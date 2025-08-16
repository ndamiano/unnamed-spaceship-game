export class AssetManager {
  constructor() {
    this.images = new Map();
    this.loadingPromises = new Map();
    this.loadedCount = 0;
    this.totalCount = 0;
    this.baseUrl = '';
    this.missingAssets = new Set();
    this.placeholderCache = new Map();
    this.allowMissingAssets = true;
    this.gameObjectLoader = null;
  }

  setGameObjectLoader(gameObjectLoader) {
    this.gameObjectLoader = gameObjectLoader;
  }

  setBaseUrl(url) {
    this.baseUrl = url;
  }

  // Load a single image
  async loadImage(path) {
    const fullPath = this.baseUrl + path;

    // Return cached image if already loaded
    if (this.images.has(fullPath)) {
      return this.images.get(fullPath);
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(fullPath)) {
      return this.loadingPromises.get(fullPath);
    }

    // Create loading promise
    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.images.set(fullPath, img);
        this.loadingPromises.delete(fullPath);
        this.loadedCount++;
        console.log(`✓ Loaded image: ${path}`);
        resolve(img);
      };

      img.onerror = () => {
        this.loadingPromises.delete(fullPath);
        this.missingAssets.add(path);

        if (this.allowMissingAssets) {
          console.warn(`⚠️  Missing asset: ${path} - using placeholder`);
          const placeholder = this.createPlaceholderImage(path);

          this.images.set(fullPath, placeholder);
          this.loadedCount++;
          resolve(placeholder);
        } else {
          console.error(`❌ Failed to load image: ${path}`);
          reject(new Error(`Failed to load image: ${path}`));
        }
      };

      img.src = fullPath;
    });

    this.loadingPromises.set(fullPath, loadPromise);
    this.totalCount++;

    return loadPromise;
  }

  // Load multiple images
  async loadImages(paths) {
    const promises = paths.map(path => this.loadImage(path));

    return Promise.allSettled(promises);
  }

  // Dynamically generate asset paths from game objects
  getGameAssetPaths() {
    const assetPaths = [];

    // Essential game assets (always needed)
    const essentialAssets = [
      'assets/player-100x100.png',
      'assets/tile1-100x100.png',
      'assets/tile2-100x100.png',
      'assets/tile3-100x100.png',
    ];

    assetPaths.push(...essentialAssets);

    // Get all game objects and generate their asset paths
    if (this.gameObjectLoader) {
      try {
        const gameObjects = this.gameObjectLoader.getGameObjects();

        for (const [objectType, config] of Object.entries(gameObjects)) {
          // Generate asset path from object name
          const assetPath = this.getAssetPath(config.name || objectType);

          assetPaths.push(assetPath);
        }

        console.log(
          `Generated ${assetPaths.length} asset paths from game objects`
        );
      } catch (error) {
        console.warn(
          'Could not load game objects for asset generation:',
          error
        );
        console.log('Falling back to essential assets only');
      }
    } else {
      console.warn('GameObjectLoader not set - loading essential assets only');
    }

    // Remove duplicates
    return [...new Set(assetPaths)];
  }

  // Preload all game assets
  async preloadAssets() {
    console.log('Starting dynamic asset preload...');

    const assetPaths = this.getGameAssetPaths();

    console.log(`Attempting to load ${assetPaths.length} assets...`);

    try {
      const results = await this.loadImages(assetPaths);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(
        `Asset preload complete: ${successful} loaded, ${failed} missing`
      );

      if (this.missingAssets.size > 0) {
        console.group(`⚠️  ${this.missingAssets.size} Missing Assets:`);
        Array.from(this.missingAssets).forEach(asset => {
          console.log(`❌ ${asset}`);
        });
        console.groupEnd();

        console.log('💡 Create these image files to replace placeholders:');
        Array.from(this.missingAssets).forEach(asset => {
          console.log(`   ${asset}`);
        });
      } else {
        console.log('✅ All assets loaded successfully!');
      }

      return true; // Always return true when allowing missing assets
    } catch (error) {
      console.error('Asset preload failed:', error);

      return false;
    }
  }

  // Get image (returns cached image or placeholder)
  getImage(path) {
    const fullPath = this.baseUrl + path;

    if (this.images.has(fullPath)) {
      return this.images.get(fullPath);
    }

    // If not loaded and we allow missing assets, create placeholder
    if (this.allowMissingAssets) {
      console.warn(`Creating placeholder for unloaded asset: ${path}`);
      const placeholder = this.createPlaceholderImage(path);

      this.images.set(fullPath, placeholder);

      return placeholder;
    }

    console.error(`Image not loaded and placeholders disabled: ${path}`);

    return null;
  }

  // Create a placeholder image for missing assets
  createPlaceholderImage(path = 'unknown') {
    // Cache placeholders to avoid recreating them
    if (this.placeholderCache.has(path)) {
      return this.placeholderCache.get(path);
    }

    const canvas = document.createElement('canvas');

    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    // Extract object type from path for better placeholders
    const objectType = this.extractObjectTypeFromPath(path);

    // Different colors for different object types
    const colors = this.getPlaceholderColor(objectType);

    // Draw placeholder pattern
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, 100, 100);

    // Add a border
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 98, 98);

    // Add text
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Split long object names
    const displayName = this.formatObjectNameForDisplay(objectType);

    if (displayName.length > 8) {
      const words = displayName.split(/[-_\s]/);

      if (words.length > 1) {
        ctx.fillText(words[0].toUpperCase().substring(0, 6), 50, 35);
        ctx.fillText(words[1].toUpperCase().substring(0, 6), 50, 50);
      } else {
        const part1 = displayName.substring(0, 6);
        const part2 = displayName.substring(6, 12);

        ctx.fillText(part1.toUpperCase(), 50, 35);
        ctx.fillText(part2.toUpperCase(), 50, 50);
      }
    } else {
      ctx.fillText(displayName.toUpperCase(), 50, 40);
    }

    // Add "MISSING" label
    ctx.font = '7px monospace';
    ctx.fillText('MISSING', 50, 70);

    this.placeholderCache.set(path, canvas);

    return canvas;
  }

  // Extract object type from asset path
  extractObjectTypeFromPath(path) {
    if (!path.includes('/')) return path;

    const filename = path.split('/').pop();
    const nameWithoutExtension = filename.split('.')[0];
    const objectType = nameWithoutExtension.replace('-100x100', '');

    return objectType;
  }

  // Format object name for display
  formatObjectNameForDisplay(objectType) {
    return objectType
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/\s/g, '');
  }

  // Get appropriate colors for different object types
  getPlaceholderColor(objectType) {
    const colorMap = {
      // Player/Character
      player: { bg: '#00ff00', border: '#ffffff', text: '#000000' },

      // Tiles
      tile: { bg: '#444444', border: '#666666', text: '#ffffff' },

      // Terminals/Consoles
      terminal: { bg: '#0088ff', border: '#ffffff', text: '#ffffff' },
      console: { bg: '#0088ff', border: '#ffffff', text: '#ffffff' },
      panel: { bg: '#0066cc', border: '#ffffff', text: '#ffffff' },

      // Medical/Bio
      cryo: { bg: '#00ffff', border: '#ffffff', text: '#000000' },
      bio: { bg: '#00cc88', border: '#ffffff', text: '#ffffff' },
      medical: { bg: '#ff6666', border: '#ffffff', text: '#ffffff' },
      auto: { bg: '#ff6666', border: '#ffffff', text: '#ffffff' },
      psycho: { bg: '#cc4400', border: '#ffffff', text: '#ffffff' },
      quarantine: { bg: '#ffaa00', border: '#ffffff', text: '#000000' },

      // Tech/AI
      drone: { bg: '#ff8800', border: '#ffffff', text: '#ffffff' },
      assembly: { bg: '#ff0088', border: '#ffffff', text: '#ffffff' },
      nanofabricator: { bg: '#8800ff', border: '#ffffff', text: '#ffffff' },
      ai: { bg: '#ff4400', border: '#ffffff', text: '#ffffff' },
      ship: { bg: '#ff2200', border: '#ffffff', text: '#ffffff' },

      // Energy/Power
      energy: { bg: '#ffff00', border: '#000000', text: '#000000' },
      power: { bg: '#ffcc00', border: '#000000', text: '#000000' },
      plasma: { bg: '#ff4444', border: '#ffffff', text: '#ffffff' },

      // Biological/Growth
      hydroponic: { bg: '#44ff44', border: '#ffffff', text: '#000000' },
      growth: { bg: '#66ff66', border: '#ffffff', text: '#000000' },
      xenobotany: { bg: '#88ff44', border: '#ffffff', text: '#000000' },

      // Security/Military
      combat: { bg: '#ff0000', border: '#ffffff', text: '#ffffff' },
      security: { bg: '#cc0000', border: '#ffffff', text: '#ffffff' },
      observation: { bg: '#0066ff', border: '#ffffff', text: '#ffffff' },

      // Infrastructure
      wall: { bg: '#666666', border: '#888888', text: '#ffffff' },
      door: { bg: '#888888', border: '#aaaaaa', text: '#ffffff' },

      // Default
      default: { bg: '#ff0000', border: '#ffffff', text: '#ffffff' },
    };

    // Find matching color by checking if object type contains any key
    for (const [key, colors] of Object.entries(colorMap)) {
      if (objectType.toLowerCase().includes(key)) {
        return colors;
      }
    }

    return colorMap.default;
  }

  // Check if image is loaded
  isLoaded(path) {
    const fullPath = this.baseUrl + path;

    return this.images.has(fullPath);
  }

  // Check if currently loading
  isLoading(path) {
    const fullPath = this.baseUrl + path;

    return this.loadingPromises.has(fullPath);
  }

  // Check if asset is missing
  isMissing(path) {
    return this.missingAssets.has(path);
  }

  // Get loading progress
  getLoadingProgress() {
    return {
      loaded: this.loadedCount,
      total: this.totalCount,
      missing: this.missingAssets.size,
      percentage:
        this.totalCount > 0 ? (this.loadedCount / this.totalCount) * 100 : 0,
      isComplete: this.loadedCount === this.totalCount && this.totalCount > 0,
    };
  }

  // Get missing assets report
  getMissingAssetsReport() {
    return {
      missing: Array.from(this.missingAssets),
      count: this.missingAssets.size,
      hasPlayerAsset: !this.missingAssets.has('assets/player-100x100.png'),
      hasTileAssets: !['tile1', 'tile2', 'tile3'].some(tile =>
        this.missingAssets.has(`assets/${tile}-100x100.png`)
      ),
    };
  }

  // Development helper - disable placeholders to see what's missing
  enableStrictMode() {
    this.allowMissingAssets = false;
    console.log('Asset strict mode enabled - missing assets will cause errors');
  }

  disableStrictMode() {
    this.allowMissingAssets = true;
    console.log(
      'Asset strict mode disabled - missing assets will use placeholders'
    );
  }

  // Memory management
  unloadAsset(path) {
    const fullPath = this.baseUrl + path;

    if (this.images.has(fullPath)) {
      this.images.delete(fullPath);
      this.loadedCount--;
      console.log(`Unloaded image: ${path}`);
    }
  }

  unloadAllAssets() {
    this.images.clear();
    this.loadingPromises.clear();
    this.placeholderCache.clear();
    this.missingAssets.clear();
    this.loadedCount = 0;
    this.totalCount = 0;
    console.log('All assets unloaded');
  }

  // Statistics
  getStats() {
    return {
      loadedAssets: this.images.size,
      loadingAssets: this.loadingPromises.size,
      missingAssets: this.missingAssets.size,
      memoryUsage: this.estimateMemoryUsage(),
      allowMissingAssets: this.allowMissingAssets,
    };
  }

  estimateMemoryUsage() {
    // Rough estimate: 100x100 RGBA = ~40KB per image
    return this.images.size * 40 * 1024; // bytes
  }

  // Utility to get asset path for object type
  getAssetPath(objectType) {
    return `assets/${objectType}-100x100.png`;
  }

  // Development helper to log all missing assets
  logMissingAssets() {
    if (this.missingAssets.size === 0) {
      console.log('✅ No missing assets!');
    } else {
      console.group('⚠️  Missing Assets Report');
      this.missingAssets.forEach(asset => {
        console.log(`❌ ${asset}`);
      });
      console.groupEnd();
    }
  }
}
