import GameObject from "./GameObject.js";

export default class AssemblyArm extends GameObject {
  constructor(x, y, storyGroupId = "REVELATION_MEMORIES") {
    super(x, y, false, false, {
      name: "assembly-arm",
      storyGroupId: storyGroupId,
      exhaustedMessage: "The assembly arm remains silent, its work complete."
    });
  }
}