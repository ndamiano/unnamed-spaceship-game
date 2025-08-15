// Updated GameObject.js with better story restoration
import { Tile } from '../../world/tiles/tile.js';
import { eventBus } from '../../core/event-bus.js';
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

    // Register this object with the story system if it has story content
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
  }

  _setupFromConfig(config, objectType) {
    // Story configuration
    this.storyGroupId = config.storyGroupId || null;
    this.storyChance = config.storyChance || 0.0;
    this.guaranteedStory = config.guaranteedStory || false;
    this.exhaustedMessage = config.exhaustedMessage || null;
    this.activationResults = config.activationResults || [];

    // Pick flavor text once and stick with it
    this.flavorTexts = config.flavorTexts || ['An unremarkable object.'];
    this.selectedFlavorText =
      this.flavorTexts[Math.floor(Math.random() * this.flavorTexts.length)];

    // Visual properties - pre-compute asset path
    this.flipped = false;
    this.name = config.name;
    this.objectType = objectType;
    this.config = config;
    this.assetPath = this.name ? `assets/${this.name}-100x100.png` : null;
    this.availableStoryFragments = new Set();
    this.availableStoryEvents = [];
    this.storyEventDetermined = false;
  }

  _setupStoryManagement() {
    this.availableStoryEvents = [];
    this.storyEventDetermined = false;
  }

  _setupEventHandlers() {
    eventBus.on('reset-state', () => this.onReset());
  }

  // Method to remove a specific story fragment from this object
  removeStoryFragment(fragmentId) {
    this.availableStoryFragments.delete(fragmentId);

    // Remove from available story events if it's there
    this.availableStoryEvents = this.availableStoryEvents.filter(
      event => event.type !== 'fragment' || event.fragmentId !== fragmentId
    );
  }

  // Restore story state (called during save loading)
  restoreStoryState(storyData) {
    console.log(
      'Restoring story state for object:',
      this.objectType,
      storyData
    );

    // Restore story configuration
    if (storyData.storyGroupId) {
      this.storyGroupId = storyData.storyGroupId;
    }

    if (storyData.storyChance !== undefined) {
      this.storyChance = storyData.storyChance;
    }

    if (storyData.guaranteedStory) {
      this.guaranteedStory = storyData.guaranteedStory;
    }

    // Restore determined state
    this.storyEventDetermined = storyData.storyEventDetermined || false;

    // Restore available fragments
    if (storyData.availableStoryFragments) {
      this.availableStoryFragments = new Set(storyData.availableStoryFragments);
    }

    // Restore available story events
    if (storyData.availableStoryEvents) {
      this.availableStoryEvents = storyData.availableStoryEvents.map(event => ({
        type: event.type,
        fragmentId: event.fragmentId,
        content: event.content,
      }));
    }

    console.log('Story state restored:', {
      storyGroupId: this.storyGroupId,
      fragmentsCount: this.availableStoryFragments.size,
      eventsCount: this.availableStoryEvents.length,
      determined: this.storyEventDetermined,
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

        // Add the fragment to our available set
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

        // Remove from our available fragments set
        this.availableStoryFragments.delete(storyEvent.fragmentId);

        eventBus.emit('story-discovery', { fragmentId: storyEvent.fragmentId });

        return true;
      case 'message':
        eventBus.emit('game-message', storyEvent.content);

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

    // Try to consume a story event first
    if (this.hasAvailableStory()) {
      console.log('Object has available story, consuming...');
      this.consumeNextStoryEvent();

      return;
    }

    // Process activation results
    for (const result of this.activationResults) {
      if (this.processActivationResult(result)) {
        return; // Only process first matching activation result
      }
    }

    // Fallback to flavor text or exhausted message
    this._handleDefaultInteraction();
  }

  _handleDefaultInteraction() {
    if (this.storyGroupId) {
      const groupProgress = storySystem.getGroupProgress(this.storyGroupId);
      const message =
        this.exhaustedMessage ||
        `Data archive complete (${groupProgress.discovered}/${groupProgress.total} files)`;

      eventBus.emit('game-message', message);
    } else {
      eventBus.emit('game-message', this.selectedFlavorText);
    }
  }

  processActivationResult(result) {
    const handlers = {
      message: () => {
        eventBus.emit('game-message', result.value);

        return true;
      },
      resource: () => this._handleResourceResult(result),
      upgrade_menu: () => {
        eventBus.emit('open-upgrade-menu');

        return true;
      },
      win_condition: () => {
        eventBus.emit('game-message', result.message || 'You win!');

        return true;
      },
      conditional: () => {
        if (this.checkConditions(result.conditions)) {
          return this.processActivationResult(result.result);
        }

        return false;
      },
    };

    const handler = handlers[result.type];

    return handler ? handler() : false;
  }

  _handleResourceResult(result) {
    if (!result.used) {
      eventBus.emit('add-resource', {
        type: result.resourceType,
        amount: result.amount,
      });
      eventBus.emit(
        'game-message',
        `Collected ${result.amount} ${result.resourceType}`
      );
      result.used = true;

      return true;
    } else {
      eventBus.emit(
        'game-message',
        result.exhaustedMessage || 'This resource has been depleted'
      );

      return true;
    }
  }

  checkConditions(_conditions) {
    // Implement condition checking logic here
    return true;
  }

  onReset() {
    // Reset activation results that can be used again
    for (const result of this.activationResults) {
      if (result.type === 'resource' && result.resetOnBatteryDrain) {
        result.used = false;
      }
    }
  }

  // Get current state for saving
  getSaveState() {
    // Make sure story events are determined before saving
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
    };

    console.log('GameObject save state for', this.objectType, ':', {
      storyEvents: saveState.availableStoryEvents.length,
      storyFragments: saveState.availableStoryFragments.length,
      storyGroupId: saveState.storyGroupId,
      determined: saveState.storyEventDetermined,
    });

    return saveState;
  }

  // Cleanup method when object is destroyed
  destroy() {
    if (this.storyGroupId) {
      storySystem.unregisterStoryObject(this);
    }
  }

  render(ctx, x, y, size) {
    // Render glow effect first if object is activatable
    if (this.isActivatable()) {
      this.renderGlow(ctx, x, y, size);
    }

    // Handle flipped rendering
    if (this.flipped) {
      ctx.save();
      ctx.scale(-1, 1);
      this.renderAsset(ctx, -x - size, y, size);
      ctx.restore();
    } else {
      this.renderAsset(ctx, x, y, size);
    }
  }

  renderAsset(ctx, x, y, size) {
    if (this.assetPath) {
      const assetImage = new Image();

      assetImage.src = this.assetPath;
      ctx.drawImage(assetImage, x, y);
    } else {
      // Fallback rendering
      ctx.fillStyle = '#f00';
      ctx.fillRect(x, y, size, size);
    }
  }

  renderGlow(ctx, x, y, size) {
    ctx.save();

    // Determine glow color based on object type
    let glowColor;

    if (this.hasAvailableStory()) {
      glowColor = '#ffffff'; // White for story objects
    } else if (this.hasActivationResults()) {
      glowColor = '#035170'; // Light blue for other activatable objects
    } else {
      ctx.restore();

      return; // No glow needed
    }

    const gradient = ctx.createRadialGradient(
      x + size / 2,
      y + size / 2,
      size / 4,
      x + size / 2,
      y + size / 2,
      size / 2
    );

    gradient.addColorStop(0, glowColor + '40');
    gradient.addColorStop(0.7, glowColor + '20');
    gradient.addColorStop(1, glowColor + '00');

    ctx.fillStyle = gradient;
    ctx.fillRect(x - size * 0.1, y - size * 0.1, size * 1.2, size * 1.2);

    ctx.restore();
  }
}
