export class Renderer {
  constructor(canvas, config, gameObjectLoader = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    this.gameObjectLoader = gameObjectLoader;
    this.images = new Map();
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.followTarget = null;
    this.running = false;

    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
    this.canvas.style.backgroundColor = '#000';

    // High DPI support
    const dpr = window.devicePixelRatio || 1;

    if (dpr > 1) {
      this.canvas.width = this.config.canvasWidth * dpr;
      this.canvas.height = this.config.canvasHeight * dpr;
      this.canvas.style.width = this.config.canvasWidth + 'px';
      this.canvas.style.height = this.config.canvasHeight + 'px';
      this.ctx.scale(dpr, dpr);
    }
  }

  // Simple image loading with placeholders
  async loadImage(path) {
    if (this.images.has(path)) {
      return this.images.get(path);
    }

    return new Promise(resolve => {
      const img = new Image();

      img.onload = () => {
        this.images.set(path, img);
        console.log(`✓ Loaded: ${path}`);
        resolve(img);
      };

      img.onerror = () => {
        console.warn(`⚠️ Missing: ${path} - using placeholder`);
        const placeholder = this.createPlaceholder(path);

        this.images.set(path, placeholder);
        resolve(placeholder);
      };

      img.src = path;
    });
  }

  createPlaceholder(path) {
    const canvas = document.createElement('canvas');

    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    // Extract object type from path for better placeholders
    const objectType = path.split('/').pop()?.split('-')[0] || 'unknown';
    const color = this.getPlaceholderColor(objectType);

    // Draw placeholder
    ctx.fillStyle = color.bg;
    ctx.fillRect(0, 0, 100, 100);
    ctx.strokeStyle = color.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 98, 98);

    // Add text
    ctx.fillStyle = color.text;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const displayName = objectType.toUpperCase().substring(0, 8);

    ctx.fillText(displayName, 50, 40);
    ctx.font = '8px monospace';
    ctx.fillText('MISSING', 50, 65);

    return canvas;
  }

  getPlaceholderColor(objectType) {
    const colorMap = {
      player: { bg: '#00ff00', border: '#ffffff', text: '#000000' },
      tile: { bg: '#444444', border: '#666666', text: '#ffffff' },
      terminal: { bg: '#0088ff', border: '#ffffff', text: '#ffffff' },
      cryo: { bg: '#00ffff', border: '#ffffff', text: '#000000' },
      assembly: { bg: '#ff0088', border: '#ffffff', text: '#ffffff' },
      drone: { bg: '#ff8800', border: '#ffffff', text: '#ffffff' },
      energy: { bg: '#ffff00', border: '#000000', text: '#000000' },
      default: { bg: '#ff0000', border: '#ffffff', text: '#ffffff' },
    };

    for (const [key, colors] of Object.entries(colorMap)) {
      if (objectType.toLowerCase().includes(key)) {
        return colors;
      }
    }

    return colorMap.default;
  }

  // Batch load game assets
  async loadGameAssets() {
    const assetPaths = this.getGameAssetPaths();

    console.log(`Loading ${assetPaths.length} assets...`);

    await Promise.all(assetPaths.map(path => this.loadImage(path)));

    const missing = assetPaths.filter(path => {
      const img = this.images.get(path);

      return img && img.tagName !== 'IMG';
    });

    console.log(
      `Asset loading complete: ${assetPaths.length - missing.length}/${assetPaths.length} loaded`
    );
    if (missing.length > 0) {
      console.log(`Missing assets using placeholders:`, missing);
    }

    return true;
  }

  getGameAssetPaths() {
    const assetPaths = [
      'assets/player-100x100.png',
      'assets/tile1-100x100.png',
      'assets/tile2-100x100.png',
      'assets/tile3-100x100.png',
    ];

    // Add object assets from game object loader
    if (this.gameObjectLoader) {
      try {
        const gameObjects = this.gameObjectLoader.getGameObjects();

        for (const [objectType, config] of Object.entries(gameObjects)) {
          const assetPath = `assets/${config.name || objectType}-100x100.png`;

          assetPaths.push(assetPath);
        }
      } catch (error) {
        console.warn(
          'Could not load game objects for asset generation:',
          error
        );
      }
    }

    return [...new Set(assetPaths)]; // Remove duplicates
  }

  // Camera system
  setCamera(x, y, zoom = 1) {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.zoom = Math.max(0.1, Math.min(zoom, 5));
  }

  setCameraBounds(minX, minY, maxX, maxY) {
    this.cameraBounds = { minX, minY, maxX, maxY };
  }

  setFollowTarget(target) {
    this.followTarget = target;
  }

  updateCamera() {
    if (this.followTarget) {
      const targetX = this.followTarget.x;
      const targetY = this.followTarget.y;

      // Smooth camera following
      const lerp = 0.1;

      this.camera.x += (targetX - this.camera.x) * lerp;
      this.camera.y += (targetY - this.camera.y) * lerp;

      // Apply bounds if set
      if (this.cameraBounds) {
        this.camera.x = Math.max(
          this.cameraBounds.minX,
          Math.min(this.camera.x, this.cameraBounds.maxX)
        );
        this.camera.y = Math.max(
          this.cameraBounds.minY,
          Math.min(this.camera.y, this.cameraBounds.maxY)
        );
      }
    }
  }

  // Main render method
  render(ship, player, _deltaTime = 0) {
    if (!this.running) return;

    this.updateCamera();
    this.clear();

    this.ctx.save();
    this.applyCameraTransform();

    this.renderVisibleTiles(ship);
    this.renderPlayer(player);

    this.ctx.restore();
  }

  clear() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
  }

  applyCameraTransform() {
    // Center the viewport
    this.ctx.translate(
      this.config.canvasWidth / 2,
      this.config.canvasHeight / 2
    );

    // Apply zoom
    this.ctx.scale(this.camera.zoom, this.camera.zoom);

    // Apply camera position
    this.ctx.translate(-this.camera.x, -this.camera.y);
  }

  renderVisibleTiles(ship) {
    const bounds = this.getVisibleBounds(ship);

    for (let y = bounds.top; y < bounds.bottom; y++) {
      for (let x = bounds.left; x < bounds.right; x++) {
        const tile = ship.map.getTile(x, y);

        if (tile && tile.visible) {
          this.renderTile(tile, x, y);
        }
      }
    }
  }

  getVisibleBounds(ship) {
    const margin = 2;
    const tileSize = this.config.tileSize;
    const halfWidth = this.config.canvasWidth / 2 / this.camera.zoom;
    const halfHeight = this.config.canvasHeight / 2 / this.camera.zoom;

    return {
      left: Math.max(
        0,
        Math.floor((this.camera.x - halfWidth) / tileSize) - margin
      ),
      right: Math.min(
        ship.width,
        Math.ceil((this.camera.x + halfWidth) / tileSize) + margin
      ),
      top: Math.max(
        0,
        Math.floor((this.camera.y - halfHeight) / tileSize) - margin
      ),
      bottom: Math.min(
        ship.height,
        Math.ceil((this.camera.y + halfHeight) / tileSize) + margin
      ),
    };
  }

  renderTile(tile, x, y) {
    const worldX = x * this.config.tileSize;
    const worldY = y * this.config.tileSize;

    // Draw floor
    const floorImg = this.images.get(
      `assets/tile${tile.number || 1}-100x100.png`
    );

    if (floorImg) {
      this.ctx.drawImage(
        floorImg,
        worldX,
        worldY,
        this.config.tileSize,
        this.config.tileSize
      );
    }

    // Draw walls
    this.renderWalls(tile, worldX, worldY);

    // Draw object
    if (tile.object) {
      this.renderObject(tile.object, worldX, worldY);
    }
  }

  renderWalls(tile, worldX, worldY) {
    const wallColor = '#333333';
    const doorColor = '#888888';
    const wallThickness = this.config.tileSize * 0.1;

    const sides = ['top', 'right', 'bottom', 'left'];

    sides.forEach(side => {
      const slot = tile.getSlot(side);

      if (!slot) return;

      const isWall = slot.constructor.name === 'WallSegment';
      const isDoor = slot.constructor.name === 'Door';

      if (!isWall && !isDoor) return;

      this.ctx.fillStyle = isWall ? wallColor : doorColor;

      let rectX = worldX,
        rectY = worldY,
        rectWidth,
        rectHeight;

      switch (side) {
        case 'top':
          rectWidth = this.config.tileSize;
          rectHeight = wallThickness;
          break;
        case 'bottom':
          rectY = worldY + this.config.tileSize - wallThickness;
          rectWidth = this.config.tileSize;
          rectHeight = wallThickness;
          break;
        case 'left':
          rectWidth = wallThickness;
          rectHeight = this.config.tileSize;
          break;
        case 'right':
          rectX = worldX + this.config.tileSize - wallThickness;
          rectWidth = wallThickness;
          rectHeight = this.config.tileSize;
          break;
      }

      this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    });
  }

  renderObject(object, worldX, worldY) {
    // Simple glow for interactive objects
    if (object.isActivatable && object.isActivatable()) {
      const glowColor =
        object.hasAvailableStory && object.hasAvailableStory()
          ? '#ffffff'
          : '#035170';

      this.renderGlow(
        worldX + this.config.tileSize / 2,
        worldY + this.config.tileSize / 2,
        this.config.tileSize,
        glowColor,
        0.8
      );
    }

    // Draw object sprite
    const assetPath =
      object.assetPath ||
      `assets/${object.name || object.objectType}-100x100.png`;
    const img = this.images.get(assetPath);

    if (img) {
      this.ctx.save();

      if (object.flipped) {
        this.ctx.translate(
          worldX + this.config.tileSize / 2,
          worldY + this.config.tileSize / 2
        );
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(
          img,
          -this.config.tileSize / 2,
          -this.config.tileSize / 2,
          this.config.tileSize,
          this.config.tileSize
        );
      } else {
        this.ctx.drawImage(
          img,
          worldX,
          worldY,
          this.config.tileSize,
          this.config.tileSize
        );
      }

      this.ctx.restore();
    }
  }

  renderGlow(x, y, size, color, intensity) {
    this.ctx.save();

    const gradient = this.ctx.createRadialGradient(
      x,
      y,
      size * 0.1,
      x,
      y,
      size * 0.5
    );
    const alpha = Math.floor(intensity * 64)
      .toString(16)
      .padStart(2, '0');

    gradient.addColorStop(0, color + alpha);
    gradient.addColorStop(
      0.7,
      color +
        Math.floor(intensity * 32)
          .toString(16)
          .padStart(2, '0')
    );
    gradient.addColorStop(1, color + '00');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);

    this.ctx.restore();
  }

  renderPlayer(player) {
    const worldX = player.x * this.config.tileSize;
    const worldY = player.y * this.config.tileSize;

    const playerImg = this.images.get('assets/player-100x100.png');

    if (playerImg) {
      this.ctx.save();

      this.ctx.translate(
        worldX + this.config.tileSize / 2,
        worldY + this.config.tileSize / 2
      );

      // Simple rotation based on direction
      let rotation = 0;

      if (player.direction.x === 0 && player.direction.y === -1)
        rotation = Math.PI;
      else if (player.direction.x === 1 && player.direction.y === 0)
        rotation = -Math.PI / 2;
      else if (player.direction.x === -1 && player.direction.y === 0)
        rotation = Math.PI / 2;

      this.ctx.rotate(rotation);
      this.ctx.drawImage(
        playerImg,
        -this.config.tileSize / 2,
        -this.config.tileSize / 2,
        this.config.tileSize,
        this.config.tileSize
      );

      this.ctx.restore();
    }
  }

  // Control methods
  start() {
    this.running = true;
    console.log('🎮 Simple renderer started');
  }

  stop() {
    this.running = false;
  }

  // Debug info
  getStats() {
    return {
      running: this.running,
      imagesLoaded: this.images.size,
      camera: this.camera,
      followTarget: this.followTarget ? 'yes' : 'no',
    };
  }
}
