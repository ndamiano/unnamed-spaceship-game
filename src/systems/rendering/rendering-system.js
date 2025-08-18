import { Renderer } from './renderer.js';
import { GameEvents } from '../../core/game-events.js';
import { gameObjectLoader } from '../../entities/objects/game-object-loader.js';

export class RenderingSystem {
  constructor(config) {
    this.config = config;
    this.renderer = null;
    this.canvas = null;
    this.initialized = false;
  }

  async initialize() {
    console.log('Initializing rendering system...');

    try {
      this.canvas = document.getElementById('gameCanvas');
      if (!this.canvas) {
        throw new Error('Canvas element not found');
      }

      this.renderer = new Renderer(this.canvas, this.config, gameObjectLoader);

      console.log('Loading game assets...');
      const assetsLoaded = await this.renderer.loadGameAssets();

      if (!assetsLoaded) {
        throw new Error('Failed to load game assets');
      }

      console.log('Assets loaded successfully');
      this.renderer.start();

      this.initialized = true;
      GameEvents.Initialization.Emit.rendererReady();
    } catch (error) {
      console.error('Failed to setup renderer:', error);
      throw error;
    }
  }

  setupCameraBounds(width, height, tileSize) {
    if (this.renderer) {
      const padding = 500;

      this.renderer.setCameraBounds(
        -padding,
        -padding,
        width * tileSize + padding,
        height * tileSize + padding
      );
    }
  }

  setFollowTarget(target) {
    if (this.renderer) {
      this.renderer.setFollowTarget(target);
    }
  }

  isInitialized() {
    return this.initialized;
  }

  getRenderer() {
    return this.renderer;
  }
}
