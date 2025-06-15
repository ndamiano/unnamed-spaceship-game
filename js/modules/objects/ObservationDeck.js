import GameObject from "./GameObject.js";

export default class ObservationDeck extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "observation-deck";
  }
}
