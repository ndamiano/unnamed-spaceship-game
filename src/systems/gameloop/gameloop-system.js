// src/systems/gameloop/gameloop-system.js
import { minimap } from '../../ui/minimap.js';

export class GameLoopSystem {
  constructor() {
    this.renderer = null;
    this.ship = null;
    this.player = null;
    this.lastFrameTime = 0;
    this.running = false;
    this.initialized = false;
  }

  initialize(renderer, ship, player) {
    console.log('Initializing game loop system...');

    this.renderer = renderer;
    this.ship = ship;
    this.player = player;

    this.start();
    this.initialized = true;
  }

  start() {
    console.log('Starting game loop...');

    this.running = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  stop() {
    this.running = false;
  }

  gameLoop() {
    if (!this.running || !this.renderer) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;

    this.lastFrameTime = currentTime;

    try {
      this.render(deltaTime);
      this.updateUI();
    } catch (error) {
      console.error('Error in game loop:', error);
    }

    if (this.running) {
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  render(deltaTime) {
    if (this.renderer && this.ship && this.player) {
      this.renderer.render(this.ship, this.player, deltaTime);
    }
  }

  updateUI() {
    // Update upgrade features
    if (minimap.enabled && minimap.visible) {
      minimap.update();
    }

    // Update other UI elements as needed
  }

  isInitialized() {
    return this.initialized;
  }

  isRunning() {
    return this.running;
  }
}
