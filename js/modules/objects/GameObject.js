import { Tile } from "../Tile.js";
import { eventBus } from "../EventBus.js";
import { storySystem } from "../StorySystem.js";
import { gameObjectLoader } from "./GameObjectLoader.js";

export default class GameObject extends Tile {
  constructor(x, y, objectType) {
    // Get config but handle case where it might not be loaded yet
    let config;
    try {
      config = gameObjectLoader.getGameObjects()[objectType];
    } catch (error) {
      console.error(`Failed to load config for ${objectType}:`, error);
      // Fallback config
      config = {
        passable: false,
        blocksLineOfSight: false,
        name: objectType,
        storyChance: 0,
        activationResults: [],
        flavorTexts: ["An unremarkable object."]
      };
    }
    
    super(x, y, config.passable, config.blocksLineOfSight);
    
    // Story configuration
    this.storyGroupId = config.storyGroupId || null;
    this.storyChance = config.storyChance || 0.0;
    this.guaranteedStory = config.guaranteedStory || false;
    this.exhaustedMessage = config.exhaustedMessage || null;
    this.activationResults = config.activationResults || [];
    
    // Flavor text - pick one at creation and stick with it
    this.flavorTexts = config.flavorTexts || ["An unremarkable object."];
    this.selectedFlavorText = this.flavorTexts[Math.floor(Math.random() * this.flavorTexts.length)];
    
    // Visual properties
    this.flipped = false;
    this.name = config.name || null;
    this.objectType = objectType;
    this.config = config;
    
    // Story management - determine available stories upfront
    this.availableStoryEvents = [];
    this.storyEventDetermined = false;
    
    // Reset handling
    eventBus.on("reset-state", () => {
      this.onReset();
    });
  }

  // Determine what story events this object can provide
  determineAvailableStoryEvents() {
    if (this.storyEventDetermined) return;
    
    this.availableStoryEvents = [];
    
    // Check if this object should have story content (only for storyGroupId objects)
    if (this.storyGroupId && (this.guaranteedStory || (this.storyChance > 0 && Math.random() <= this.storyChance))) {
      // Try to get a story from the group
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

  // Check if this object has any available story content
  hasAvailableStory() {
    this.determineAvailableStoryEvents();
    return this.availableStoryEvents.length > 0;
  }

  // Consume the next available story event
  consumeNextStoryEvent() {
    if (this.availableStoryEvents.length === 0) return false;
    
    const storyEvent = this.availableStoryEvents.shift(); // Remove first event
    
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

  // Base interaction handler - handles story logic and activation results
  onInteract() {
    // First, try to consume a story event
    if (this.hasAvailableStory()) {
      this.consumeNextStoryEvent();
      return;
    }
    
    // If no story available, process activation results
    let handledByActivation = false;
    
    for (const result of this.activationResults) {
      if (this.processActivationResult(result)) {
        handledByActivation = true;
        break; // Only process first matching activation result
      }
    }
    
    // If nothing handled the interaction, show flavor text or default message
    if (!handledByActivation) {
      if (this.storyGroupId) {
        // Check if we've exhausted the story group
        const groupProgress = storySystem.getGroupProgress(this.storyGroupId);
        const message = this.exhaustedMessage || 
          `Data archive complete (${groupProgress.discovered}/${groupProgress.total} files)`;
        eventBus.emit("game-message", message);
      } else {
        // Show flavor text for non-story objects
        eventBus.emit("game-message", this.selectedFlavorText);
      }
    }
  }

  processActivationResult(result) {
    switch (result.type) {
      case 'message':
        eventBus.emit("game-message", result.value);
        return true;
        
      case 'resource':
        if (!result.used) {
          eventBus.emit("add-resource", {
            type: result.resourceType,
            amount: result.amount,
          });
          eventBus.emit("game-message", `Collected ${result.amount} ${result.resourceType}`);
          result.used = true; // Mark as used
          return true;
        } else {
          eventBus.emit("game-message", result.exhaustedMessage || "This resource has been depleted");
          return true;
        }
        
      case 'upgrade_menu':
        eventBus.emit("open-upgrade-menu");
        return true;
        
      case 'win_condition':
        eventBus.emit("game-message", result.message || "You win!");
        return true;
        
      case 'conditional':
        // Check if conditions are met
        if (this.checkConditions(result.conditions)) {
          return this.processActivationResult(result.result);
        }
        return false;
        
      default:
        return false;
    }
  }

  checkConditions(conditions) {
    // Implement condition checking logic here
    // For now, just return true
    return true;
  }

  // Subclasses can override this for reset behavior
  onReset() {
    // Reset story events - they can be redetermined
    this.storyEventDetermined = false;
    this.availableStoryEvents = [];
    
    // Reset activation results that can be used again
    for (const result of this.activationResults) {
      if (result.type === 'resource' && result.resetOnBatteryDrain) {
        result.used = false;
      }
    }
  }

  // Enhanced render method with glow indicator
  render(ctx, x, y, size) {
    // Render glow effect first (underneath) - only if has available story
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
    if (this.name) {
      const assetImage = new Image();
      assetImage.src = `assets/${this.name}-100x100.png`;
      ctx.drawImage(assetImage, x, y);
    } else {
      // Fallback rendering
      ctx.fillStyle = "#f00";
      ctx.fillRect(x, y, size, size);
    }
  }

  renderStoryGlow(ctx, x, y, size) {
    // Create a subtle glow underneath the object
    ctx.save();
    
    // Create radial gradient for glow effect
    const gradient = ctx.createRadialGradient(
      x + size/2, y + size/2, size/4,  // Inner circle
      x + size/2, y + size/2, size/2   // Outer circle
    );
    
    const glowColor = this.getStoryGlowColor();
    gradient.addColorStop(0, glowColor + '40'); // 25% opacity at center
    gradient.addColorStop(0.7, glowColor + '20'); // 12% opacity
    gradient.addColorStop(1, glowColor + '00'); // Transparent at edge
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x - size*0.1, y - size*0.1, size*1.2, size*1.2);
    
    ctx.restore();
  }

  // Different objects can have different glow colors
  getStoryGlowColor() {
    if (this.config.storyGlowColor) {
      return this.config.storyGlowColor;
    }
    
    // Default colors based on story group
    switch (this.storyGroupId) {
      case 'ENGINEERING_LOGS': return '#ffaa00'; // Orange
      case 'MEDICAL_REPORTS': return '#00aaff'; // Blue  
      case 'SYSTEM_DIAGNOSTICS': return '#ff4444'; // Red
      case 'REVELATION_MEMORIES': return '#aa44ff'; // Purple
      case 'PERSONAL_LOGS': return '#44ff44'; // Green
      default: return '#00ff00'; // Default green
    }
  }
}