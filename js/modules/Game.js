import { UserInterface } from "./UserInterface.js";
import { eventBus } from "./EventBus.js";
import { Player } from "./Player.js";
import { InputHandler } from "./InputHandler.js";
import { GameConfig } from "./Config.js";
import { registerPlayer } from "./PlayerStats.js";
import { Ship } from "./ship/Ship.js";
import { storySystem } from "./StorySystem.js"; // Add this import

export class Game {
  constructor(
    options = {
      setupCanvas: true,
      setupShip: true,
      setupPlayer: true,
      setupInputHandling: true,
      setupMoveValidation: true,
      setupUI: true,
      setupStory: true,
      startGameLoop: true,
    }
  ) {
    console.log("Initializing game...");
    this.config = GameConfig;
    if (options.setupCanvas) {
      this.setupCanvas();
    }
    if (options.setupShip) {
      this.setupShip();
    }
    if (options.setupPlayer) {
      this.setupPlayer();
    }
    if (options.setupInputHandling) {
      this.setupInputHandling();
    }
    if (options.setupMoveValidation) {
      this.setupMoveValidation();
    }
    if (options.setupUI) {
      console.log("Setting up UI");
      this.setupUI();
    }
    if (options.setupStory) {
      this.setupStorySystem();
    }
    if (options.startGameLoop) {
      this.gameLoop();
    }
  }

  setupStorySystem() {
    // Story system is already initialized as singleton
    // We can add any game-specific story setup here
    console.log("Story system initialized");
    
    // Example: Show intro story when game starts
    eventBus.emit("game-message", "Systems online... accessing memory banks...");
  }

  setupUI() {
    this.userInterface = new UserInterface(this.player);
  }

  setupInputHandling() {
    this.inputHandler = new InputHandler();
  }

  setupShip() {
    this.ship = new Ship(250, 250, "colony");
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
      if (this.ship.canMoveTo(newX, newY, direction)) {
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
      this.ship.attemptInteract(targetX, targetY);
    });
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

    this.ship.render(this.ctx, this.config.tileSize);

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