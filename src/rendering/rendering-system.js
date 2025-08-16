import { Renderer } from './renderer.js';
import { Camera } from './camera.js';
import { Scene } from './scene.js';
import { AssetManager } from './asset-manager.js';
import {
  SpriteRenderable,
  GlowRenderable,
  TextRenderable,
  RectRenderable,
} from './components/index.js';

export class RenderingSystem {
  constructor(canvas, config, gameObjectLoader = null) {
    this.canvas = canvas;
    this.config = config;

    // Core systems
    this.renderer = new Renderer(canvas, config);
    this.camera = new Camera(0, 0, 1, config.canvasWidth, config.canvasHeight);
    this.scene = new Scene();
    this.assetManager = new AssetManager();

    // Set up asset manager with game object loader
    if (gameObjectLoader) {
      this.assetManager.setGameObjectLoader(gameObjectLoader);
    }

    // State
    this.running = false;
    this.debugMode = false;
    this.lastFrameTime = 0;

    // Asset loading
    this.assetsLoaded = false;
    this.loadingPromise = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Debug controls
    document.addEventListener('keydown', e => {
      if (e.key === 'F1') {
        this.toggleDebugMode();
      }
    });
  }

  // Asset management
  async loadAssets() {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    console.log('🎨 Starting dynamic asset loading...');

    this.loadingPromise = this.assetManager
      .preloadAssets()
      .then(success => {
        this.assetsLoaded = success;

        const progress = this.assetManager.getLoadingProgress();

        console.log(
          `🎨 Asset loading complete: ${progress.loaded}/${progress.total} loaded (${progress.missing} missing)`
        );

        if (progress.missing > 0) {
          console.log(
            '💡 Missing assets will be shown as colored placeholders'
          );
          this.assetManager.logMissingAssets();
        }

        return success;
      })
      .catch(error => {
        console.error('🎨 Asset loading failed:', error);
        this.assetsLoaded = false;
        throw error;
      });

    return this.loadingPromise;
  }

  getLoadingProgress() {
    return this.assetManager.getLoadingProgress();
  }

  // Renderable factory methods
  createSpriteRenderable(x, y, spritePath, options = {}) {
    const sprite = this.assetManager.getImage(spritePath);
    const renderable = new SpriteRenderable(x, y, spritePath, options);

    renderable.setSprite(sprite);

    return renderable;
  }

  createGlowRenderable(x, y, size, color, intensity = 1) {
    return new GlowRenderable(x, y, size, color, intensity);
  }

  createTextRenderable(x, y, text, options = {}) {
    return new TextRenderable(x, y, text, options);
  }

  createRectRenderable(x, y, width, height, color, options = {}) {
    return new RectRenderable(x, y, width, height, color, options);
  }

  // Scene management
  addToScene(renderable) {
    return this.scene.addRenderable(renderable);
  }

  removeFromScene(renderable) {
    this.scene.removeRenderable(renderable);
  }

  clearScene() {
    this.scene.removeAllRenderables();
  }

  // Camera controls
  setCameraPosition(x, y) {
    this.camera.setPosition(x, y);
  }

  setCameraZoom(zoom) {
    this.camera.setZoom(zoom);
  }

  followTarget(target, offsetX = 0, offsetY = 0) {
    this.camera.follow(target, offsetX, offsetY);
  }

  setCameraBounds(minX, minY, maxX, maxY) {
    this.camera.setBounds(minX, minY, maxX, maxY);
  }

  // Main render loop
  render(deltaTime = 0) {
    if (!this.running) return;

    // Update camera
    this.camera.update(deltaTime);

    // Update scene objects
    this.scene.update(deltaTime);

    // Render everything
    this.renderer.render(this.scene, this.camera);

    // Debug rendering
    if (this.debugMode) {
      this.renderDebugInfo();
    }
  }

  // Control methods
  start() {
    this.running = true;
    console.log('🎮 Rendering system started');
  }

  stop() {
    this.running = false;
    console.log('🎮 Rendering system stopped');
  }

  pause() {
    this.running = false;
  }

  resume() {
    this.running = true;
  }

  // Debug mode
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    console.log(`🐛 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
  }

  renderDebugInfo() {
    const _performanceInfo = this.renderer.getPerformanceInfo();
    const sceneStats = this.scene.getStats();
    const assetStats = this.assetManager.getStats();

    // Render performance info
    this.renderer.drawDebugInfo(this.camera);

    // Render scene stats
    this.renderer.drawText(
      `Scene Objects: ${sceneStats.totalRenderables}`,
      10,
      90,
      { color: '#0f0' }
    );
    this.renderer.drawText(
      `Visible: ${sceneStats.visibleRenderables}`,
      10,
      110,
      { color: '#0f0' }
    );
    this.renderer.drawText(`Culled: ${sceneStats.culledRenderables}`, 10, 130, {
      color: '#0f0',
    });

    // Render asset stats
    this.renderer.drawText(`Assets: ${assetStats.loadedAssets}`, 10, 150, {
      color: '#0f0',
    });
    this.renderer.drawText(`Missing: ${assetStats.missingAssets}`, 10, 170, {
      color: '#ff0',
    });

    // Render bounding boxes
    this.scene.renderDebugBounds(this.renderer, this.camera);
  }

  // Utility methods
  worldToScreen(worldX, worldY) {
    return this.camera.worldToScreen(worldX, worldY);
  }

  screenToWorld(screenX, screenY) {
    return this.camera.screenToWorld(screenX, screenY);
  }

  handleResize() {
    // Update canvas size
    this.renderer.setupCanvas();

    // Update camera viewport
    this.camera.viewportWidth = this.config.canvasWidth;
    this.camera.viewportHeight = this.config.canvasHeight;
  }

  // Effects
  cameraShake(intensity = 10, duration = 500) {
    this.camera.shake(intensity, duration);
  }

  // Asset management helpers
  getMissingAssets() {
    return this.assetManager.getMissingAssetsReport();
  }

  enableAssetStrictMode() {
    this.assetManager.enableStrictMode();
  }

  disableAssetStrictMode() {
    this.assetManager.disableStrictMode();
  }

  // Statistics
  getStats() {
    return {
      renderer: this.renderer.getPerformanceInfo(),
      scene: this.scene.getStats(),
      camera: this.camera.getDebugInfo(),
      assets: this.assetManager.getStats(),
      system: {
        running: this.running,
        debugMode: this.debugMode,
        assetsLoaded: this.assetsLoaded,
      },
    };
  }

  // Cleanup
  destroy() {
    this.stop();
    this.assetManager.unloadAllAssets();
    this.scene.removeAllRenderables();
    console.log('🎮 Rendering system destroyed');
  }
}

// Export components for external use
export {
  SpriteRenderable,
  GlowRenderable,
  TextRenderable,
  RectRenderable,
  Renderer,
  Camera,
  Scene,
  AssetManager,
};
