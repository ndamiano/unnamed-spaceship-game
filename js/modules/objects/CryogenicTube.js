// Update CryogenicTube.js
import { eventBus } from "../EventBus.js";
import GameObject from "./GameObject.js";
import { storySystem } from "../StorySystem.js";

export default class CryogenicTube extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "cryogenic-tube";
    this.storyGroupId = "MEDICAL_REPORTS";
  }

  onInteract() {
    const nextFragment = storySystem.requestStoryFromGroup(this.storyGroupId);
    
    if (nextFragment) {
      eventBus.emit("story-discovery", { fragmentId: nextFragment });
    } else {
      eventBus.emit("game-message", "The cryo tube is empty. Its occupant long gone.");
    }
  }

  render(ctx, x, y, size) {
    super.render(ctx, x, y, size);
    
    // Add frost effect if story available
    const hasStory = storySystem.requestStoryFromGroup(this.storyGroupId);
    if (hasStory) {
      ctx.save();
      ctx.strokeStyle = "#88ccff";
      ctx.lineWidth = 1;
      ctx.shadowColor = "#88ccff";
      ctx.shadowBlur = 5;
      ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
      ctx.restore();
    }
  }
}