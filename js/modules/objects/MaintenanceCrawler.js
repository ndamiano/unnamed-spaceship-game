import GameObject from "./GameObject.js";

export default class MaintenanceCrawler extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "maintenance-crawler";
  }
}
