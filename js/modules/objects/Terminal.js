import { eventBus } from "../EventBus.js";
import GameObject from "./GameObject.js";
import { storySystem } from "../StorySystem.js";

export default class Terminal extends GameObject {
  constructor(x, y, storyGroupId = null) {
    super(x, y);
    this.name = "terminal";
    this.storyGroupId = storyGroupId || this.getRandomStoryGroup();
    
    eventBus.on("reset-state", () => {
      // Don't reset story progress - that should persist
    });
  }

  getRandomStoryGroup() {
    const terminalGroups = [
      "ENGINEERING_LOGS",
      "MEDICAL_REPORTS", 
      "SYSTEM_DIAGNOSTICS"
    ];
    return terminalGroups[Math.floor(Math.random() * terminalGroups.length)];
  }

  onInteract() {
    const nextFragment = storySystem.requestStoryFromGroup(this.storyGroupId);
    
    if (nextFragment) {
      // Trigger story discovery
      eventBus.emit("story-discovery", { 
        fragmentId: nextFragment 
      });
    } else {
      // No more fragments in this group
      const groupProgress = storySystem.getGroupProgress(this.storyGroupId);
      eventBus.emit("game-message", 
        `Terminal accessed - data archive complete (${groupProgress.discovered}/${groupProgress.total} files)`
      );
    }
  }

  render(ctx, x, y, size) {
    // Call parent render
    super.render(ctx, x, y, size);
    
    // Add visual indicator based on group status
    const nextFragment = storySystem.requestStoryFromGroup(this.storyGroupId);
    if (nextFragment) {
      // Add a pulsing green dot to indicate interactive content
      ctx.save();
      ctx.fillStyle = "#00ff00";
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x + size - 10, y + 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Add a dimmed indicator to show this terminal is exhausted
      ctx.save();
      ctx.fillStyle = "#004400";
      ctx.beginPath();
      ctx.arc(x + size - 10, y + 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}