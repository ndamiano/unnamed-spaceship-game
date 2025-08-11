import GameObject from "./GameObject.js";

export default class Terminal extends GameObject {
  constructor(x, y, storyGroupId = null) {
    const groupId = storyGroupId || Terminal.getRandomStoryGroup();
    
    super(x, y, false, false, {
      name: "terminal",
      storyGroupId: groupId,
      exhaustedMessage: "Terminal accessed - no new data available"
    });
  }

  static getRandomStoryGroup() {
    const terminalGroups = [
      "ENGINEERING_LOGS",
      "MEDICAL_REPORTS", 
      "SYSTEM_DIAGNOSTICS"
    ];
    return terminalGroups[Math.floor(Math.random() * terminalGroups.length)];
  }
}