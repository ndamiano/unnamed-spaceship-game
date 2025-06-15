import GameObject from "./GameObject.js";

export default class CommsRelayStation extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.name = "comms-relay-station";
  }
  render(ctx, x, y, size) {
    const assetImage = new Image();
    assetImage.src = `assets/comms-relay-station-100x100.png`;
    ctx.drawImage(assetImage, x, y - 50);
  }
}
