import { jest } from "@jest/globals";
import { Floor } from "../tiles/Floor.js";
import { WallSegment } from "../tiles/WallSegment.js";
import { eventBus } from "../EventBus.js";
import { Directions } from "../Utils.js";
import { Game } from "../Game.js";

describe("Tile Slot System Tests", () => {
  let map;
  let player;
  let game;

  beforeAll(() => {
    game = new Game({
      setupCanvas: false,
      setupShip: true,
      setupPlayer: true,
      setupInputHandling: true,
      setupMoveValidation: true,
      setupUI: false,
      startGameLoop: false,
    });
    map = game.ship.map;
    player = game.player;
  });

  test("Player can move with no wall between tiles", () => {
    const startTile = new Floor(5, 5);
    const targetTile = new Floor(5, 4); // Above

    player.x = 5;
    player.y = 5;

    map.setTile(5, 5, startTile);
    map.setTile(5, 4, targetTile);
    eventBus.emit("attempt-move", Directions.UP);

    expect(player.x).toBe(5);
    expect(player.y).toBe(4);
  });

  test("Player cannot move with wall between tiles", () => {
    const startTile = new Floor(5, 5);
    startTile.setSlot("top", new WallSegment(5, 5, "top"));
    const targetTile = new Floor(5, 4); // Above

    player.x = 5;
    player.y = 5;
    map.setTile(5, 5, startTile);
    map.setTile(5, 4, targetTile);

    eventBus.emit("attempt-move", Directions.UP);
    expect(player.x).toBe(5);
    expect(player.y).toBe(5);
  });
});
