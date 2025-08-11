import { eventBus } from "../EventBus.js";
import { getStats } from "../PlayerStats.js";
import GameObject from "./GameObject.js";
import { storySystem } from "../StorySystem.js";

export default class DronePod extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "drone-pod";
    this.storyGroupId = "SYSTEM_DIAGNOSTICS";
  }

  onInteract() {
    // Check if we have story content first
    const nextFragment = storySystem.requestStoryFromGroup(this.storyGroupId);
    
    if (nextFragment) {
      eventBus.emit("story-discovery", { fragmentId: nextFragment });
    } else {
      // Fall back to upgrade menu
      eventBus.emit("open-upgrade-menu", getStats());
    }
  }

  render(ctx, x, y, size) {
    super.render(ctx, x, y, size);
    
    // Different visual indicators for story vs upgrades
    const hasStory = storySystem.requestStoryFromGroup(this.storyGroupId);
    if (hasStory) {
      // Story indicator - pulsing blue
      ctx.save();
      ctx.fillStyle = "#4444ff";
      ctx.shadowColor = "#4444ff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Upgrade indicator - steady green
      ctx.save();
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(x + size - 10, y + size - 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}