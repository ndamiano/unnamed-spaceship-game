import GameObject from "./GameObject.js";

export default class PlasmaConduit extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "plasma-conduit";
  }
}
