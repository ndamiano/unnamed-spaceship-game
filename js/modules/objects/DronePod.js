import GameObject from "./GameObject.js";

export default class DronePod extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "drone-pod";
  }
}
