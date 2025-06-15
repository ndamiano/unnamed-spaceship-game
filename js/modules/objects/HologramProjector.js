import GameObject from "./GameObject.js";

export default class HologramProjector extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "hologram-projector";
  }
}
