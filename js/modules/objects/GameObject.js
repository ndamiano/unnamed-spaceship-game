import { Tile } from "../Tile.js";
import { eventBus } from "../EventBus.js";
import { storySystem } from "../StorySystem.js";
import { gameObjectLoader } from "./GameObjectLoader.js";

// Pre-defined story glow colors to avoid switch statements
const STORY_GLOW_COLORS = {
  'ENGINEERING_LOGS': '#ffaa00',
  'MEDICAL_REPORTS': '#00aaff',
  'SYSTEM_DIAGNOSTICS': '#ff4444',
  'REVELATION_MEMORIES': '#aa44ff',
  'PERSONAL_LOGS': '#44ff44',
  'DEFAULT': '#00ff00'
};

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
  }

  _setupFallback(objectType) {
    this.name = objectType;
    this.objectType = objectType;
    this.assetPath = null;
    this.config = { flavorTexts: ["An unknown object."] };
    this.selectedFlavorText = "An unknown object.";
    this.storyGroupId = null;
    this.activationResults = [];
  }

  _setupFromConfig(config, objectType) {
    // Story configuration
    this.storyGroupId = config.storyGroupId || null;
    this.storyChance = config.storyChance || 0.0;
    this.guaranteedStory = config.guaranteedStory || false;
    this.exhaustedMessage = config.exhaustedMessage || null;
    this.activationResults = config.activationResults || [];
    
    // Pick flavor text once and stick with it
    this.flavorTexts = config.flavorTexts || ["An unremarkable object."];
    this.selectedFlavorText = this.flavorTexts[Math.floor(Math.random() * this.flavorTexts.length)];
    
    // Visual properties - pre-compute asset path
    this.flipped = false;
    this.name = config.name;
    this.objectType = objectType;
    this.config = config;
    this.assetPath = this.name ? `assets/${this.name}-100x100.png` : null;
    
    // Pre-compute story glow color
    this.storyGlowColor = config.storyGlowColor || 
                         STORY_GLOW_COLORS[this.storyGroupId] || 
                         STORY_GLOW_COLORS.DEFAULT;
  }

  _setupStoryManagement() {
    this.availableStoryEvents = [];
    this.storyEventDetermined = false;
  }

  _setupEventHandlers() {
    eventBus.on("reset-state", () => this.onReset());
  }

  determineAvailableStoryEvents() {
    if (this.storyEventDetermined) return;
    
    this.availableStoryEvents = [];
    
    if (this.storyGroupId && (this.guaranteedStory || (this.storyChance > 0 && Math.random() <= this.storyChance))) {
      const availableFragment = storySystem.requestStoryFromGroup(this.storyGroupId);
      if (availableFragment) {
        this.availableStoryEvents.push({
          type: 'fragment',
          fragmentId: availableFragment
        });
      }
    }
    
    this.storyEventDetermined = true;
  }

  hasAvailableStory() {
    this.determineAvailableStoryEvents();
    return this.availableStoryEvents.length > 0;
  }

  consumeNextStoryEvent() {
    if (this.availableStoryEvents.length === 0) return false;
    
    const storyEvent = this.availableStoryEvents.shift();
    
    switch (storyEvent.type) {
      case 'fragment':
        eventBus.emit("story-discovery", { fragmentId: storyEvent.fragmentId });
        return true;
      case 'message':
        eventBus.emit("game-message", storyEvent.content);
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
    // Try to consume a story event first
    if (this.hasAvailableStory()) {
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
      const message = this.exhaustedMessage || 
        `Data archive complete (${groupProgress.discovered}/${groupProgress.total} files)`;
      eventBus.emit("game-message", message);
    } else {
      eventBus.emit("game-message", this.selectedFlavorText);
    }
  }

  processActivationResult(result) {
    const handlers = {
      'message': () => {
        eventBus.emit("game-message", result.value);
        return true;
      },
      'resource': () => this._handleResourceResult(result),
      'upgrade_menu': () => {
        eventBus.emit("open-upgrade-menu");
        return true;
      },
      'win_condition': () => {
        eventBus.emit("game-message", result.message || "You win!");
        return true;
      },
      'conditional': () => {
        if (this.checkConditions(result.conditions)) {
          return this.processActivationResult(result.result);
        }
        return false;
      }
    };

    const handler = handlers[result.type];
    return handler ? handler() : false;
  }

  _handleResourceResult(result) {
    if (!result.used) {
      eventBus.emit("add-resource", {
        type: result.resourceType,
        amount: result.amount,
      });
      eventBus.emit("game-message", `Collected ${result.amount} ${result.resourceType}`);
      result.used = true;
      return true;
    } else {
      eventBus.emit("game-message", result.exhaustedMessage || "This resource has been depleted");
      return true;
    }
  }

  checkConditions(conditions) {
    // Implement condition checking logic here
    return true;
  }

  onReset() {
    // Reset story events
    this.storyEventDetermined = false;
    this.availableStoryEvents = [];
    
    // Reset activation results that can be used again
    for (const result of this.activationResults) {
      if (result.type === 'resource' && result.resetOnBatteryDrain) {
        result.used = false;
      }
    }
  }

  render(ctx, x, y, size) {
    // Render glow effect first if has available story
    if (this.hasAvailableStory()) {
      this.renderStoryGlow(ctx, x, y, size);
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
      ctx.fillStyle = "#f00";
      ctx.fillRect(x, y, size, size);
    }
  }

  renderStoryGlow(ctx, x, y, size) {
    ctx.save();
    
    const gradient = ctx.createRadialGradient(
      x + size/2, y + size/2, size/4,
      x + size/2, y + size/2, size/2
    );
    
    gradient.addColorStop(0, this.storyGlowColor + '40');
    gradient.addColorStop(0.7, this.storyGlowColor + '20');
    gradient.addColorStop(1, this.storyGlowColor + '00');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x - size*0.1, y - size*0.1, size*1.2, size*1.2);
    
    ctx.restore();
  }
}