import GameObject from "./GameObject.js";

export default class Terminal extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "terminal";
  }

  onInteract(player) {
    // Terminal interaction logic
    console.log("Terminal interacted with by player");
  }
}
