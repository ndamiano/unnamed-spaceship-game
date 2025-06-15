import GameObject from "./GameObject.js";

export default class HygienePod extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "hygiene-station";
  }
}
