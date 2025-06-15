import GameObject from "./GameObject.js";

export default class NutrientDispenser extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "nutrient-dispenser";
  }
}
