import GameObject from "./GameObject.js";

export default class CryogenicTube extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "cryogenic-tube";
  }
}
