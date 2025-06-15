import GameObject from "./GameObject.js";

export default class ControlPanel extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "control-panel";
  }
}
