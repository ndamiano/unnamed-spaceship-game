import { eventBus } from "../EventBus.js";
import GameObject from "./GameObject.js";

export default class AssemblyArm extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "assembly-arm";
    this.memoryAccessed = false;
    
    eventBus.on("reset-state", () => {
      this.memoryAccessed = false;
    });
  }

  onInteract() {
    if (!this.memoryAccessed) {
      // This is a key story moment - the reveal about the player's nature
      eventBus.emit("story-discovery", { 
        fragmentId: "ASSEMBLY_ARM_MEMORY" 
      });
      this.memoryAccessed = true;
    } else {
      eventBus.emit("game-message", "The assembly arm remains silent, its work complete");
    }
  }

  render(ctx, x, y, size) {
    // Call parent render
    super.render(ctx, x, y, size);
    
    // Add special visual effect for this important story object
    if (!this.memoryAccessed) {
      // Add a subtle blue glow to indicate this is special
      ctx.save();
      ctx.strokeStyle = "#4444ff";
      ctx.shadowColor = "#4444ff";
      ctx.shadowBlur = 15;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
      ctx.restore();
    }
  }
}