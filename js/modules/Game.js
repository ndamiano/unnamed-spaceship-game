import { UserInterface } from "./UserInterface.js";
import { eventBus } from "./EventBus.js";
import { Player } from "./Player.js";
import { InputHandler } from "./InputHandler.js";
import { GameConfig } from "./Config.js";
import { registerPlayer } from "./PlayerStats.js";
import { Ship } from "./ship/Ship.js";
import { storySystem } from "./StorySystem.js";
import { gameObjectLoader } from "./objects/GameObjectLoader.js";

export class Game {
  constructor(options = {
    setupCanvas: true,
    setupShip: true,
    setupPlayer: true,
    setupInputHandling: true,
    setupMoveValidation: true,
    setupUI: true,
    setupStory: true,
    startGameLoop: true,
  }) {
    this.config = GameConfig;
    this.initialized = false;
    this.init(options);
  }

  async init(options) {
    console.log("Initializing game...");
    
    try {
      // Load game data first
      console.log("Loading game configurations...");
      await gameObjectLoader.loadGameObjects();
      console.log("Game objects loaded");
      await storySystem.loadStoryFragments();
      console.log("Story fragments loaded");
      console.log("Game data loaded successfully");

      // Continue with normal initialization
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

      this.initialized = true;
      console.log("Game initialization complete");
      
    } catch (error) {
      console.error("Failed to initialize game:", error);
      this.showLoadingError(error);
    }
  }

  showLoadingError(error) {
    // Show a user-friendly error message
    document.body.innerHTML = `
      <div style="color: #ff0000; text-align: center; margin-top: 50px; font-family: monospace;">
        <h2>Game Loading Error</h2>
        <p>Failed to load game configuration.</p>
        <p>Error: ${error.message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  setupStorySystem() {
    console.log("Story system initialized with JSON data");
    eventBus.emit("game-message", "Systems online... accessing memory banks...");
  }

  setupUI() {
    this.userInterface = new UserInterface(this.player);
  }

  setupInputHandling() {
    this.inputHandler = new InputHandler();
  }

  setupShip() {
    console.log("Setting up ship...");
    this.ship = new Ship(250, 250, "colony");
    console.log("Ship created");
  }

  setupPlayer() {
    console.log("Setting up player...");
    const spawnPoint = this.ship.getSpawnPoint();
    console.log("Spawn point:", spawnPoint);
    this.player = new Player(spawnPoint.x, spawnPoint.y);
    registerPlayer(this.player);
    this.ship.revealAreaAroundPlayer(this.player.x, this.player.y, 20);
    console.log("Player setup complete");
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
    try {
      this.renderShip();
    } catch (error) {
      console.error("Error in game loop:", error);
    }
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

    try {
      this.ship.render(this.ctx, this.config.tileSize);
    } catch (error) {
      console.error("Error rendering ship:", error);
    }

    // Restore context state
    this.ctx.restore();

    // Render player (always centered)
    try {
      this.player.render(this.ctx, centerX, centerY, this.config.tileSize);
    } catch (error) {
      console.error("Error rendering player:", error);
    }
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