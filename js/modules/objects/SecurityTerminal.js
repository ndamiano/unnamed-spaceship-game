import GameObject from "./GameObject.js";

export default class SecurityTerminal extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "security-console";
  }
}
