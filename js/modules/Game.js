import { ShipMap } from "./ShipMap.js";
import { UserInterface } from "./UserInterface.js";
import { EventBus } from "./EventBus.js";
import { Player } from "./Player.js";
import { InputHandler } from "./InputHandler.js";

class Game {
  constructor() {
    console.log("Initializing game...");
    this.config = {
      canvasWidth: 800,
      canvasHeight: 800,
      tileSize: 32,
      shipTypes: ["colony", "warship", "science"],
      debugMode: false,
    };

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

    // Set canvas background
    this.canvas.style.backgroundColor = "#000";

    // Initialize EventBus
    this.eventBus = new EventBus();

    this.ship = new ShipMap(50, 50, "colony", this.eventBus);
    const spawnPoint = this.ship.getSpawnPoint();
    this.player = new Player(spawnPoint.x, spawnPoint.y);
    this.player.registerEventHandlers(this.eventBus);
    this.inputHandler = new InputHandler(this.eventBus);
    this.setupMoveValidation();
    this.gameLoop();
    new UserInterface(this.player, this.eventBus);
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      this.handleKeyPress(e.key);
    });
  }

  setupMoveValidation() {
    this.eventBus.on("attempt-move", (direction) => {
      const newX = this.player.x + direction.dx;
      const newY = this.player.y + direction.dy;
      if (this.canMoveTo(newX, newY)) {
        this.eventBus.emit("player-move", { x: newX, y: newY });
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
        if (tile.visible) {
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
    this.ctx.fillStyle = "#ff0";
    this.ctx.beginPath();
    this.ctx.arc(
      centerX,
      centerY,
      this.config.tileSize / 2 - 1,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }
}

new Game();
