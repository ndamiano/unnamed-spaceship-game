import { eventBus } from "../EventBus.js";
import GameObject from "./GameObject.js";

export default class Terminal extends GameObject {
  constructor(x, y, storyFragmentId = null) {
    super(x, y);
    this.name = "terminal";
    this.storyFragmentId = storyFragmentId || this.getRandomStoryFragment();
    this.accessed = false;
    
    eventBus.on("reset-state", () => {
      this.accessed = false;
    });
  }

  getRandomStoryFragment() {
    const terminalStories = [
      "ENGINEERING_TERMINAL_01",
      "CRYO_CHAMBER_LOG", 
      "DRONE_POD_MAINTENANCE"
    ];
    return terminalStories[Math.floor(Math.random() * terminalStories.length)];
  }

  onInteract() {
    if (!this.accessed && this.storyFragmentId) {
      // Trigger story discovery
      eventBus.emit("story-discovery", { 
        fragmentId: this.storyFragmentId 
      });
      this.accessed = true;
    } else if (this.accessed) {
      eventBus.emit("game-message", "Terminal accessed - no new data available");
    } else {
      eventBus.emit("game-message", "Terminal is offline");
    }
  }

  render(ctx, x, y, size) {
    // Call parent render
    super.render(ctx, x, y, size);
    
    // Add visual indicator if story is available
    if (!this.accessed && this.storyFragmentId) {
      // Add a pulsing green dot to indicate interactive content
      ctx.save();
      ctx.fillStyle = "#00ff00";
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x + size - 10, y + 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}