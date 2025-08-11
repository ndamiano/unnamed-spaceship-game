import GameObject from "./GameObject.js";

export default class EnergyPylon extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "energy-pylon";
  }
}
