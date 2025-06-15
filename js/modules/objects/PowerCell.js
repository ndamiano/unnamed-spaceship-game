import GameObject from "./GameObject.js";

export default class PowerCell extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "powercell";
  }
}
