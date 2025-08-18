// src/entities/objects/game-object.js
import { Tile } from '../../world/tiles/tile.js';
import { GameEvents } from '../../core/game-events.js';
import { storySystem } from '../../systems/story/story-system.js';
import { gameObjectLoader } from './game-object-loader.js';

export default class GameObject extends Tile {
  constructor(x, y, objectType) {
    const config = gameObjectLoader.getObjectConfig(objectType);

    if (!config) {
      console.error(`Unknown object type: ${objectType}`);
      super(x, y, false, false);
      this._setupFallback(objectType);

      return;
    }

    super(x, y, config.passable, config.blocksLineOfSight);
    this._setupFromConfig(config, objectType);
    this._setupStoryManagement();
    this._setupEventHandlers();

    if (this.storyGroupId) {
      storySystem.registerStoryObject(this);
    }
  }

  _setupFallback(objectType) {
    this.name = objectType;
    this.objectType = objectType;
    this.assetPath = null;
    this.config = { flavorTexts: ['An unknown object.'] };
    this.selectedFlavorText = 'An unknown object.';
    this.storyGroupId = null;
    this.activationResults = [];
    this.availableStoryFragments = new Set();
    this.availableStoryEvents = [];
    this.storyEventDetermined = false;

    // Section properties
    this.sectionType = null;
    this.sectionId = null;
  }

  _setupFromConfig(config, objectType) {
    this.storyGroupId = config.storyGroupId || null;
    this.storyChance = config.storyChance || 0.0;
    this.guaranteedStory = config.guaranteedStory || false;
    this.exhaustedMessage = config.exhaustedMessage || null;
    this.activationResults = config.activationResults
      ? config.activationResults.map(result => ({
          ...result,
          used: result.used || false,
        }))
      : [];

    this.flavorTexts = config.flavorTexts || ['An unremarkable object.'];
    this.selectedFlavorText =
      this.flavorTexts[Math.floor(Math.random() * this.flavorTexts.length)];

    this.flipped = false;
    this.name = config.name;
    this.objectType = objectType;
    this.config = config;
    this.assetPath = this.name ? `assets/${this.name}-100x100.png` : null;
    this.availableStoryFragments = new Set();
    this.availableStoryEvents = [];
    this.storyEventDetermined = false;

    // Section properties
    this.sectionType = null;
    this.sectionId = null;
  }

  _setupStoryManagement() {
    this.availableStoryEvents = [];
    this.storyEventDetermined = false;
  }

  _setupEventHandlers() {
    GameEvents.Game.Listeners.resetState(() => this.onReset());
  }

  removeStoryFragment(fragmentId) {
    this.availableStoryFragments.delete(fragmentId);

    this.availableStoryEvents = this.availableStoryEvents.filter(
      event => event.type !== 'fragment' || event.fragmentId !== fragmentId
    );
  }

  restoreStoryState(storyData) {
    console.log(
      'Restoring story state for object:',
      this.objectType,
      storyData
    );

    if (storyData.storyGroupId) {
      this.storyGroupId = storyData.storyGroupId;
    }

    if (storyData.storyChance !== undefined) {
      this.storyChance = storyData.storyChance;
    }

    if (storyData.guaranteedStory) {
      this.guaranteedStory = storyData.guaranteedStory;
    }

    this.storyEventDetermined = storyData.storyEventDetermined || false;

    if (storyData.availableStoryFragments) {
      this.availableStoryFragments = new Set(storyData.availableStoryFragments);
    }

    if (storyData.availableStoryEvents) {
      this.availableStoryEvents = storyData.availableStoryEvents.map(event => ({
        type: event.type,
        fragmentId: event.fragmentId,
        content: event.content,
      }));
    }

    // Restore section data
    if (storyData.sectionType) {
      this.sectionType = storyData.sectionType;
    }

    if (storyData.sectionId) {
      this.sectionId = storyData.sectionId;
    }

    console.log('Story state restored:', {
      storyGroupId: this.storyGroupId,
      fragmentsCount: this.availableStoryFragments.size,
      eventsCount: this.availableStoryEvents.length,
      determined: this.storyEventDetermined,
      sectionType: this.sectionType,
      sectionId: this.sectionId,
    });
  }

  determineAvailableStoryEvents() {
    if (this.storyEventDetermined) return;

    console.log(
      'Determining story events for:',
      this.objectType,
      'at',
      this.x,
      this.y
    );

    this.availableStoryEvents = [];

    if (
      this.storyGroupId &&
      (this.guaranteedStory ||
        (this.storyChance > 0 && Math.random() <= this.storyChance))
    ) {
      const availableFragment = storySystem.requestStoryFromGroup(
        this.storyGroupId
      );

      if (availableFragment) {
        console.log(
          'Adding story fragment:',
          availableFragment,
          'to object:',
          this.objectType
        );

        this.availableStoryFragments.add(availableFragment);

        this.availableStoryEvents.push({
          type: 'fragment',
          fragmentId: availableFragment,
        });
      } else {
        console.log('No available fragments for group:', this.storyGroupId);
      }
    }

    this.storyEventDetermined = true;
    console.log(
      'Story events determined:',
      this.availableStoryEvents.length,
      'events available'
    );
  }

  hasAvailableStory() {
    this.determineAvailableStoryEvents();

    return this.availableStoryEvents.length > 0;
  }

  hasActivationResults() {
    return this.activationResults && this.activationResults.length > 0;
  }

  isActivatable() {
    return this.hasAvailableStory() || this.hasActivationResults();
  }

  consumeNextStoryEvent() {
    if (this.availableStoryEvents.length === 0) return false;

    const storyEvent = this.availableStoryEvents.shift();

    switch (storyEvent.type) {
      case 'fragment':
        console.log('Consuming story fragment:', storyEvent.fragmentId);

        this.availableStoryFragments.delete(storyEvent.fragmentId);

        GameEvents.Story.Emit.discovery(storyEvent.fragmentId);

        return true;
      case 'message':
        GameEvents.Game.Emit.message(storyEvent.content);

        return true;
      default:
        return false;
    }
  }

  flip() {
    this.flipped = !this.flipped;

    return this;
  }

  onInteract() {
    console.log(
      'Interacting with object:',
      this.objectType,
      'at',
      this.x,
      this.y
    );

    // Special handling for neural interface
    if (this.objectType === 'neuralInterface') {
      console.log('Neural interface interaction detected');

      // Always try activation results first for neural interface
      for (const result of this.activationResults) {
        if (this.processActivationResult(result)) {
          return;
        }
      }
    }

    // Standard interaction flow
    if (this.hasAvailableStory()) {
      console.log('Object has available story, consuming...');
      this.consumeNextStoryEvent();

      return;
    }

    for (const result of this.activationResults) {
      if (this.processActivationResult(result)) {
        return;
      }
    }

    this._handleDefaultInteraction();
  }

  _handleDefaultInteraction() {
    if (this.storyGroupId) {
      const groupProgress = storySystem.getGroupProgress(this.storyGroupId);
      const message =
        this.exhaustedMessage ||
        `Data archive complete (${groupProgress.discovered}/${groupProgress.total} files)`;

      GameEvents.Game.Emit.message(message);
    } else {
      GameEvents.Game.Emit.message(this.selectedFlavorText);
    }
  }

  processActivationResult(result) {
    const handlers = {
      message: () => {
        GameEvents.Game.Emit.message(result.value);

        return true;
      },
      resource: () => this._handleResourceResult(result),
      upgrade_menu: () => {
        GameEvents.UI.Emit.openUpgrades({
          shopType: result.shopType || 'always_on',
        });

        return true;
      },
      win_condition: () => {
        GameEvents.Game.Emit.message(result.message || 'You win!');

        return true;
      },
      conditional: () => {
        if (this.checkConditions(result.conditions)) {
          return this.processActivationResult(result.result);
        }

        return false;
      },

      // NEW: Mind dive handler for neural interface
      mind_dive: () => this._handleMindDive(result),

      // NEW: Ship completion handler
      ship_completion: () => this._handleShipCompletion(result),
    };

    const handler = handlers[result.type];

    return handler ? handler() : false;
  }

  _handleMindDive(result) {
    console.log('Processing mind dive activation...');

    // Check if current section is sufficiently complete
    const sectionProgress = this.calculateSectionProgress();
    const requiredProgress = 75; // Require 75% completion

    if (sectionProgress < requiredProgress) {
      GameEvents.Game.Emit.message(
        `Neural pathways incomplete. Section progress: ${sectionProgress}%. Continue exploring to stabilize the connection.`
      );

      return true;
    }

    // Initiate mind dive sequence
    GameEvents.Game.Emit.message(
      result.message || 'Neural interface activated...'
    );

    // Add some dramatic pause before transition
    setTimeout(() => {
      GameEvents.Game.Emit.message(
        "Consciousness diving... accessing ship's neural core..."
      );
    }, 2000);

    setTimeout(() => {
      GameEvents.Game.Emit.enterMindSpace();
    }, 4000);

    return true;
  }

  _handleShipCompletion(result) {
    console.log('Processing ship completion...');

    GameEvents.Game.Emit.message(
      result.message || 'Ship consciousness fully awakened...'
    );

    // Handle final ship awakening
    setTimeout(() => {
      GameEvents.Ship.Emit.awakeningComplete({
        message:
          'Fleet network integration complete. Ready for deep space exploration.',
        unlocked: ['FLEET_COMMAND', 'DEEP_SPACE_EXPLORATION'],
      });
    }, 3000);

    return true;
  }

  calculateSectionProgress() {
    // Get current section progress from the ship
    try {
      const game = window.game;

      if (game && game.ship && game.ship.getCurrentSectionProgress) {
        const progress = game.ship.getCurrentSectionProgress();

        return progress.overall || 0;
      }
    } catch (error) {
      console.warn('Could not calculate section progress:', error);
    }

    // Fallback calculation based on story discoveries
    if (this.storyGroupId) {
      const groupProgress = storySystem.getGroupProgress(this.storyGroupId);

      if (groupProgress.total > 0) {
        return Math.round(
          (groupProgress.discovered / groupProgress.total) * 100
        );
      }
    }

    // Very basic fallback - assume 50% if we can't calculate
    return 50;
  }

  _handleResourceResult(result) {
    if (!result.used) {
      GameEvents.Resources.Emit.add(result.resourceType, result.amount);
      result.used = true;

      return true;
    } else {
      GameEvents.Game.Emit.message(
        result.exhaustedMessage || 'This resource has been depleted'
      );

      return true;
    }
  }

  checkConditions(_conditions) {
    return true;
  }

  onReset() {
    for (const result of this.activationResults) {
      if (result.type === 'resource' && result.resetOnBatteryDrain) {
        result.used = false;
      }
    }
  }

  getSaveState() {
    if (!this.storyEventDetermined && this.storyGroupId) {
      console.log(
        'Determining story events before save for:',
        this.objectType,
        'at',
        this.x,
        this.y
      );
      this.determineAvailableStoryEvents();
    }

    const saveState = {
      objectType: this.objectType,
      x: this.x,
      y: this.y,
      flipped: this.flipped,
      storyEventDetermined: this.storyEventDetermined,
      availableStoryFragments: Array.from(this.availableStoryFragments),
      availableStoryEvents: this.availableStoryEvents,
      storyGroupId: this.storyGroupId,
      storyChance: this.storyChance,
      guaranteedStory: this.guaranteedStory,
      activationResults: this.activationResults.map(result => ({
        ...result,
        used: result.used || false,
      })),

      // Section-specific data
      sectionType: this.sectionType || null,
      sectionId: this.sectionId || null,
    };

    console.log('GameObject save state for', this.objectType, ':', {
      storyEvents: saveState.availableStoryEvents.length,
      storyFragments: saveState.availableStoryFragments.length,
      storyGroupId: saveState.storyGroupId,
      determined: saveState.storyEventDetermined,
      section: saveState.sectionId,
    });

    return saveState;
  }

  destroy() {
    if (this.storyGroupId) {
      storySystem.unregisterStoryObject(this);
    }
  }
}
