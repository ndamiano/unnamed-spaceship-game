// src/rendering/scene.js
export class Scene {
  constructor() {
    this.renderables = [];
    this.layers = new Map();
    this.needsSorting = false;
    this.cullingEnabled = true;

    // Performance tracking
    this.visibleCount = 0;
    this.culledCount = 0;
  }

  // Object management
  addRenderable(renderable) {
    this.renderables.push(renderable);
    this.needsSorting = true;

    // Add to layer map for quick access
    const layer = renderable.layer;

    if (!this.layers.has(layer)) {
      this.layers.set(layer, []);
    }

    this.layers.get(layer).push(renderable);

    return renderable;
  }

  removeRenderable(renderable) {
    const index = this.renderables.indexOf(renderable);

    if (index !== -1) {
      this.renderables.splice(index, 1);

      // Remove from layer
      const layerObjects = this.layers.get(renderable.layer);

      if (layerObjects) {
        const layerIndex = layerObjects.indexOf(renderable);

        if (layerIndex !== -1) {
          layerObjects.splice(layerIndex, 1);
        }
      }
    }
  }

  removeAllRenderables() {
    this.renderables = [];
    this.layers.clear();
    this.needsSorting = false;
  }

  // Layer management
  getRenderablesInLayer(layer) {
    return this.layers.get(layer) || [];
  }

  sortByLayer() {
    if (!this.needsSorting) return;

    this.renderables.sort((a, b) => {
      if (a.layer !== b.layer) {
        return a.layer - b.layer;
      }

      // Secondary sort by y position for same layer (depth sorting)
      return a.y - b.y;
    });

    this.needsSorting = false;
  }

  // Culling
  cullInvisible(camera) {
    if (!this.cullingEnabled) return this.renderables;

    const visible = [];

    this.visibleCount = 0;
    this.culledCount = 0;

    for (const renderable of this.renderables) {
      if (renderable.isVisible(camera)) {
        visible.push(renderable);
        this.visibleCount++;
      } else {
        this.culledCount++;
      }
    }

    return visible;
  }

  // Update all renderables (for animations, etc.)
  update(deltaTime) {
    for (const renderable of this.renderables) {
      if (renderable.update && typeof renderable.update === 'function') {
        renderable.update(deltaTime);
      }
    }
  }

  // Main render method
  render(renderer, camera) {
    // Sort by layer if needed
    this.sortByLayer();

    // Cull invisible objects
    const visibleRenderables = this.cullInvisible(camera);

    // Start batch rendering for performance
    renderer.beginBatch();

    // Render all visible objects
    for (const renderable of visibleRenderables) {
      try {
        renderable.render(renderer, camera);
      } catch (error) {
        console.error('Error rendering object:', error, renderable);
      }
    }

    // End batch rendering
    renderer.endBatch();
  }

  // Utilities
  findRenderableAt(x, y) {
    // Find topmost renderable at position (reverse order for top-down checking)
    for (let i = this.renderables.length - 1; i >= 0; i--) {
      const renderable = this.renderables[i];
      const bounds = renderable.getBounds();

      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        return renderable;
      }
    }

    return null;
  }

  findRenderablesInRect(x, y, width, height) {
    const found = [];

    for (const renderable of this.renderables) {
      const bounds = renderable.getBounds();

      // Check if rectangles overlap
      if (
        !(
          bounds.x + bounds.width < x ||
          bounds.x > x + width ||
          bounds.y + bounds.height < y ||
          bounds.y > y + height
        )
      ) {
        found.push(renderable);
      }
    }

    return found;
  }

  // Statistics
  getStats() {
    return {
      totalRenderables: this.renderables.length,
      visibleRenderables: this.visibleCount,
      culledRenderables: this.culledCount,
      layerCount: this.layers.size,
      cullingEnabled: this.cullingEnabled,
    };
  }

  // Configuration
  enableCulling() {
    this.cullingEnabled = true;
  }

  disableCulling() {
    this.cullingEnabled = false;
  }

  // Debug
  renderDebugBounds(renderer, camera) {
    const visibleRenderables = this.cullInvisible(camera);

    for (const renderable of visibleRenderables) {
      const bounds = renderable.getBounds();

      // Draw bounding box
      renderer.drawRect(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        `rgba(255, 0, 0, 0.3)`
      );

      // Draw layer number
      renderer.drawText(`L${renderable.layer}`, bounds.x, bounds.y - 15, {
        font: '12px monospace',
        color: '#ff0000',
      });
    }
  }
}
