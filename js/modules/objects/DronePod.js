import { eventBus } from "../EventBus.js";
import { getStats } from "../PlayerStats.js";
import GameObject from "./GameObject.js";
import { storySystem } from "../StorySystem.js";

export default class DronePod extends GameObject {
  constructor(x, y) {
    super(x, y, false, false, {
      name: "drone-pod",
      storyGroupId: "SYSTEM_DIAGNOSTICS"
    });
  }

  onCustomInteract() {
    // Check if we have story content first
    const hasStory = this.storyGroupId && 
      storySystem.requestStoryFromGroup(this.storyGroupId);
    
    if (hasStory) {
      // Let base class handle story
      return false;
    } else {
      // No story available, open upgrade menu instead
      eventBus.emit("open-upgrade-menu", getStats());
      return true; // Prevent base class story handling
    }
  }
}