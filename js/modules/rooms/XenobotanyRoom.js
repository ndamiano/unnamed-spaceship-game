import { BaseRoom } from "./BaseRoom.js";
import XenobotanyChamber from "../objects/XenobotanyChamber.js";
import GrowthVat from "../objects/GrowthVat.js";
import NutrientDispenser from "../objects/NutrientDispenser.js";

export class XenobotanyRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 6;
    this.height = 6;

    this.addPotentialDoor(3, 0, "top");
    this.addPotentialDoor(2, 0, "top");
    this.addPotentialDoor(3, this.height - 1, "bottom");
    this.addPotentialDoor(2, this.height - 1, "bottom");
    this.addPotentialDoor(0, 3, "left");

    this.addObject(new XenobotanyChamber(), 1, 2);
    this.addObject(new GrowthVat(), 1, 3);
    this.addObject(new GrowthVat(), 4, 2);
    this.addObject(new XenobotanyChamber(), 4, 3);
    this.addObject(new XenobotanyChamber(), 1, 5);
    this.addObject(new XenobotanyChamber(), 4, 5);
    this.addObject(new NutrientDispenser(), 1, 0);
    this.addObject(new NutrientDispenser(), 4, 0);
  }
}
