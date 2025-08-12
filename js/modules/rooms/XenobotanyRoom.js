import { BaseRoom } from "./BaseRoom.js";
import GameObject from "../objects/GameObject.js";

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

    this.addObject(new GameObject(0, 0, "xenobotanyChamber"), 1, 2);
    this.addObject(new GameObject(0, 0, "growthVat"), 1, 3);
    this.addObject(new GameObject(0, 0, "growthVat"), 4, 2);
    this.addObject(new GameObject(0, 0, "xenobotanyChamber"), 4, 3);
    this.addObject(new GameObject(0, 0, "xenobotanyChamber"), 1, 5);
    this.addObject(new GameObject(0, 0, "xenobotanyChamber"), 4, 5);
    this.addObject(new GameObject(0, 0, "nutrientDispenser"), 1, 0);
    this.addObject(new GameObject(0, 0, "nutrientDispenser"), 4, 0);
  }
}
