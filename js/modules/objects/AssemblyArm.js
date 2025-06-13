import GameObject from "./GameObject.js";

export default class AssemblyArm extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "assembly-arm";
  }
}
