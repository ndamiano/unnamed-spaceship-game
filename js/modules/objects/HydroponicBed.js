import GameObject from "./GameObject.js";

export default class HydroponicBed extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "hydroponic-bed";
  }
}
