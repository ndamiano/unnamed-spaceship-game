import GameObject from "./GameObject.js";

export default class XenobotanyChamber extends GameObject {
  constructor(x, y) {
    super(x, y);
    if (Math.random() < 0.5) {
      this.name = "xenobotany-chamber";
    } else {
      this.name = "xenobotany-chamber-2";
    }
  }
}
