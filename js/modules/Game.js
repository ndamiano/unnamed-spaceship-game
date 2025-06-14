import { ShipMap } from "./ShipMap.js";
import { UserInterface } from "./UserInterface.js";
import { eventBus } from "./EventBus.js";
import { Player } from "./Player.js";
import { InputHandler } from "./InputHandler.js";
import { Floor } from "./tiles/Floor.js";
import { GameConfig } from "./Config.js";
import { registerPlayer } from "./PlayerStats.js";

class Game {
  constructor() {
    console.log("Initializing game...");
    this.config = GameConfig;
    this.setupCanvas();
    this.setupShip();
    this.setupPlayer();
    this.setupInputHandling();
    this.setupMoveValidation();
    this.setupUI();
    this.gameLoop();
  }
  setupUI() {
    this.userInterface = new UserInterface(this.player);
  }

  setupInputHandling() {
    this.inputHandler = new InputHandler();
  }

  setupShip() {
    this.ship = new ShipMap(250, 250, "colony");
  }

  setupPlayer() {
    const spawnPoint = this.ship.getSpawnPoint();
    this.player = new Player(spawnPoint.x, spawnPoint.y);
    registerPlayer(this.player);
    this.ship.revealAreaAroundPlayer(this.player.x, this.player.y, 20);
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      this.handleKeyPress(e.key);
    });
  }

  setupMoveValidation() {
    eventBus.on("attempt-move", (direction) => {
      eventBus.emit("player-direction-change", direction);
      const newX = this.player.x + direction.x;
      const newY = this.player.y + direction.y;
      if (this.canMoveTo(newX, newY)) {
        eventBus.emit("player-move", {
          x: newX,
          y: newY,
          direction,
        });
      }
    });

    eventBus.on("attempt-interact", () => {
      const direction = this.player.direction;
      const targetX = this.player.x + direction.x;
      const targetY = this.player.y + direction.y;
      const tile = this.ship.getTile(targetX, targetY);
      if (tile && typeof tile.onInteract === "function") {
        tile.onInteract();
      }
    });
  }

  canMoveTo(x, y) {
    if (x < 0 || x >= this.ship.width || y < 0 || y >= this.ship.height)
      return false;
    const tile = this.ship.getTile(x, y);
    return tile.passable;
  }

  gameLoop() {
    this.renderShip();
    requestAnimationFrame(() => this.gameLoop());
  }

  renderShip() {
    // Clear canvas
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);

    // Calculate center of viewport
    const centerX = this.config.canvasWidth / 2;
    const centerY = this.config.canvasHeight / 2;

    // Calculate player's center position in world coordinates
    const playerCenterX = (this.player.x + 0.5) * this.config.tileSize;
    const playerCenterY = (this.player.y + 0.5) * this.config.tileSize;

    // Save context state
    this.ctx.save();

    // Move canvas origin to center, then offset by player position
    this.ctx.translate(centerX, centerY);
    this.ctx.translate(-playerCenterX, -playerCenterY);

    // Render tiles
    for (let y = 0; y < this.ship.height; y++) {
      for (let x = 0; x < this.ship.width; x++) {
        const tile = this.ship.getTile(x, y);
        if (tile && tile.visible) {
          const floor = new Floor(x, y);
          floor.render(
            this.ctx,
            x * this.config.tileSize,
            y * this.config.tileSize,
            this.config.tileSize
          );
          tile.render(
            this.ctx,
            x * this.config.tileSize,
            y * this.config.tileSize,
            this.config.tileSize
          );
        }
      }
    }

    // Restore context state
    this.ctx.restore();

    // Render player (always centered)
    this.player.render(this.ctx, centerX, centerY, this.config.tileSize);
  }

  setupCanvas() {
    this.canvas = document.getElementById("gameCanvas");
    if (!this.canvas) {
      console.error("Canvas element not found");
      return;
    }
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) {
      console.error("Could not get 2D context");
      return;
    }
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
    this.canvas.style.backgroundColor = "#000";
  }
}

new Game();
