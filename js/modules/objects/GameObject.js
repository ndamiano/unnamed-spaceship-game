import { Tile } from "../Tile.js";
import { eventBus } from "../EventBus.js";
import { storySystem } from "../StorySystem.js";

export default class GameObject extends Tile {
  constructor(x, y, passable = false, blocksLineOfSight = false, options = {}) {
    super(x, y, passable, blocksLineOfSight);
    
    // Story configuration
    this.storyGroupId = options.storyGroupId || null;
    this.storyMessage = options.storyMessage || null;
    this.noStoryMessage = options.noStoryMessage || "Nothing of interest here.";
    this.exhaustedMessage = options.exhaustedMessage || null;
    
    // Visual properties
    this.flipped = false;
    this.name = options.name || null;
    
    // Reset handling
    eventBus.on("reset-state", () => {
      this.onReset();
    });
  }

  flip() {
    this.flipped = !this.flipped;
    return this;
  }

  // Base interaction handler - handles story logic
  onInteract() {
    // First, let subclass handle any custom logic
    const customResult = this.onCustomInteract();
    
    // If custom interaction handled everything, return
    if (customResult === true) {
      return;
    }
    
    // Handle story interaction if configured
    if (this.storyGroupId) {
      this.handleStoryInteraction();
    } else if (this.storyMessage) {
      // Single message fallback
      eventBus.emit("game-message", this.storyMessage);
    } else {
      // Default message
      eventBus.emit("game-message", this.noStoryMessage);
    }
  }

  // Subclasses can override this for custom behavior
  // Return true to prevent default story handling
  onCustomInteract() {
    return false;
  }

  // Subclasses can override this for reset behavior
  onReset() {
    // Default: do nothing on reset
  }

  handleStoryInteraction() {
    const nextFragment = storySystem.requestStoryFromGroup(this.storyGroupId);
    
    if (nextFragment) {
      eventBus.emit("story-discovery", { fragmentId: nextFragment });
    } else {
      // No more fragments in this group
      const groupProgress = storySystem.getGroupProgress(this.storyGroupId);
      const message = this.exhaustedMessage || 
        `Data archive complete (${groupProgress.discovered}/${groupProgress.total} files)`;
      eventBus.emit("game-message", message);
    }
  }

  // Enhanced render method with story indicators
  render(ctx, x, y, size) {
    // Handle flipped rendering
    if (this.flipped) {
      ctx.save();
      ctx.scale(-1, 1);
      this.renderAsset(ctx, -x - size, y, size);
      ctx.restore();
    } else {
      this.renderAsset(ctx, x, y, size);
    }
    
    // Add story indicators
    this.renderStoryIndicators(ctx, x, y, size);
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

  renderStoryIndicators(ctx, x, y, size) {
    if (!this.storyGroupId) return;
    
    const hasStory = storySystem.requestStoryFromGroup(this.storyGroupId);
    
    if (hasStory) {
      // Add a pulsing indicator for available story content
      ctx.save();
      ctx.fillStyle = this.getStoryIndicatorColor();
      ctx.shadowColor = this.getStoryIndicatorColor();
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x + size - 10, y + 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (storySystem.getGroupProgress(this.storyGroupId).discovered > 0) {
      // Dimmed indicator for exhausted story content
      ctx.save();
      ctx.fillStyle = this.getExhaustedIndicatorColor();
      ctx.beginPath();
      ctx.arc(x + size - 10, y + 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Subclasses can override these for different indicator colors
  getStoryIndicatorColor() {
    return "#00ff00"; // Default green
  }

  getExhaustedIndicatorColor() {
    return "#004400"; // Default dark green
  }
}