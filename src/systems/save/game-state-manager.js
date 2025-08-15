import { SaveCompression } from './save-compression.js';

export class GameStateManager {
  constructor() {
    this.currentState = 'start';
    this.saveData = null;
    this.saveVersion = '1.0.0';
    this.compression = new SaveCompression();
    this.maxSaveSlots = 5; // Support multiple save slots
    this.autoSaveInterval = 30000; // 30 seconds
  }

  startNewGame() {
    this.currentState = 'playing';
    this.saveData = {
      version: this.saveVersion,
      created: new Date().toISOString(),
      lastPlayed: new Date().toISOString(),
      playtime: 0,

      // Player progress
      player: {
        x: 0,
        y: 0,
        battery: 100,
        maxBattery: 100,
        resources: {
          Nanites: 100,
          'Ship Parts': 0,
          'Research Points': 0,
        },
        upgrades: [],
        totalPlaytime: 0,
        spawnPoint: { x: 0, y: 0 },
        direction: { x: 0, y: 1 },
      },

      // Ship state - comprehensive ship data
      ship: {
        width: 250,
        height: 250,
        type: 'colony',
        rooms: [], // Will store serialized room data
        exploredTiles: [], // Which tiles player has seen
        objects: [], // All interactive objects and their states
        seed: Math.random(), // For deterministic regeneration
      },

      // Story system state
      story: {
        discoveredFragments: [],
        discoveredGroups: {},
        journalEntries: {},
      },

      // Game progression
      gameLayer: 1,
      unlockedFeatures: ['exploration'],

      // Settings
      settings: {
        soundVolume: 50,
        musicVolume: 30,
        fullscreen: false,
      },
    };

    this.transitionToGame();
  }

  async loadGame(saveData) {
    this.currentState = 'playing';

    // Decompress if needed
    if (
      saveData.compressed ||
      (typeof saveData === 'object' && saveData.data)
    ) {
      try {
        console.log('Decompressing save data...');
        this.saveData = await this.compression.decompressSave(saveData);
      } catch (error) {
        console.error('Failed to decompress save data:', error);
        throw new Error('Save file is corrupted or incompatible');
      }
    } else {
      this.saveData = saveData;
    }

    this.saveData.lastPlayed = new Date().toISOString();
    this.transitionToGame();
  }

  transitionToGame() {
    sessionStorage.setItem(
      'gameStartData',
      JSON.stringify({
        isNewGame: this.saveData.created === this.saveData.lastPlayed,
        saveData: this.saveData,
      })
    );

    document.body.style.transition = 'opacity 0.5s ease-out';
    document.body.style.opacity = '0';

    setTimeout(() => {
      window.location.href = 'game.html';
    }, 500);
  }

  async saveGame(gameData, slot = 'auto') {
    if (!this.saveData) {
      console.error('No save data to update');

      return false;
    }

    try {
      console.log(`Starting save operation for slot: ${slot}`);

      // Update save data with current game state
      this.saveData.lastPlayed = new Date().toISOString();

      // Update player data
      if (gameData.player) {
        this.saveData.player = {
          ...this.saveData.player,
          ...gameData.player,
        };
      }

      // Update ship data
      if (gameData.ship) {
        this.saveData.ship = {
          ...this.saveData.ship,
          ...gameData.ship,
        };
      }

      // Update story data
      if (gameData.story) {
        this.saveData.story = {
          ...this.saveData.story,
          ...gameData.story,
        };
      }

      if (gameData.gameLayer) {
        this.saveData.gameLayer = gameData.gameLayer;
      }

      if (gameData.unlockedFeatures) {
        this.saveData.unlockedFeatures = gameData.unlockedFeatures;
      }

      console.log(
        'Save data updated, starting optimization and compression...'
      );

      // Optimize and compress save data
      const optimizedSave = this.compression.optimizeSaveData(this.saveData);
      const compressedSave = await this.compression.compressSave(optimizedSave);

      console.log('Compression complete:', {
        originalSize: compressedSave.originalSize,
        compressedSize: compressedSave.compressedSize,
        compressed: compressedSave.compressed,
      });

      // Create save header
      const saveHeader = this.compression.createSaveHeader(optimizedSave);

      const finalSave = {
        header: saveHeader,
        save: compressedSave,
      };

      // Save to localStorage with slot support
      const saveKey =
        slot === 'auto' ? 'digitalConquestSave' : `digitalConquestSave_${slot}`;
      const saveString = JSON.stringify(finalSave);

      console.log(
        `Writing save to localStorage with key: ${saveKey}, size: ${saveString.length} bytes`
      );

      localStorage.setItem(saveKey, saveString);

      // Verify the save was written correctly
      const verification = localStorage.getItem(saveKey);

      if (!verification) {
        throw new Error(
          'Save verification failed - data not written to localStorage'
        );
      }

      console.log(`Game saved successfully to slot: ${slot}`);
      console.log(`Final save size: ${saveString.length} bytes`);

      return true;
    } catch (error) {
      console.error('Failed to save game:', error);

      // Try to save uncompressed as fallback
      try {
        console.log('Attempting fallback save without compression...');
        const saveKey =
          slot === 'auto'
            ? 'digitalConquestSave'
            : `digitalConquestSave_${slot}`;

        localStorage.setItem(saveKey, JSON.stringify(this.saveData));
        console.log('Fallback save successful');

        return true;
      } catch (fallbackError) {
        console.error('Fallback save also failed:', fallbackError);

        return false;
      }
    }
  }

  hasSaveData(slot = 'auto') {
    const saveKey =
      slot === 'auto' ? 'digitalConquestSave' : `digitalConquestSave_${slot}`;
    const saved = localStorage.getItem(saveKey);

    if (!saved) return false;

    try {
      const saveFile = JSON.parse(saved);

      // Handle both old and new save formats
      if (saveFile.header && saveFile.save) {
        // New compressed format
        return saveFile.header.version && saveFile.header.created;
      } else if (saveFile.compressed !== undefined) {
        // Direct compressed save format (fallback)
        return true;
      } else {
        // Old uncompressed format
        return saveFile.version && saveFile.player && saveFile.created;
      }
    } catch (error) {
      console.error('Corrupted save data:', error);

      return false;
    }
  }

  async loadSaveData(slot = 'auto') {
    const saveKey =
      slot === 'auto' ? 'digitalConquestSave' : `digitalConquestSave_${slot}`;
    const saved = localStorage.getItem(saveKey);

    if (!saved) return null;

    try {
      const saveFile = JSON.parse(saved);

      // Handle new save format with compression
      if (saveFile.header && saveFile.save) {
        // Validate integrity if checksum exists
        if (saveFile.header.checksum) {
          const decompressedData = await this.compression.decompressSave(
            saveFile.save
          );
          const isValid = this.compression.validateSaveIntegrity(
            decompressedData,
            saveFile.header.checksum
          );

          if (!isValid) {
            console.warn(
              'Save file checksum validation failed - save may be corrupted'
            );
          }
        }

        return saveFile.save; // Return the compressed save data
      } else {
        // Handle old format saves
        console.log('Loading legacy save format');
        let data = saveFile;

        if (data.version !== this.saveVersion) {
          data = this.migrateSaveData(data);
        }

        return data;
      }
    } catch (error) {
      console.error('Failed to load save data:', error);

      return null;
    }
  }

  migrateSaveData(oldData) {
    console.log(
      `Migrating save data from ${oldData.version} to ${this.saveVersion}`
    );

    // Add migration logic here as your save format evolves
    const migrated = { ...oldData };

    migrated.version = this.saveVersion;

    // Example: Add new fields with defaults
    if (!migrated.settings) {
      migrated.settings = {
        soundVolume: 50,
        musicVolume: 30,
        fullscreen: false,
      };
    }

    return migrated;
  }

  deleteSaveData(slot = 'auto') {
    const saveKey =
      slot === 'auto' ? 'digitalConquestSave' : `digitalConquestSave_${slot}`;

    localStorage.removeItem(saveKey);

    if (slot === 'auto') {
      this.saveData = null;
    }
  }

  async getSaveInfo(slot = 'auto') {
    try {
      const saveKey =
        slot === 'auto' ? 'digitalConquestSave' : `digitalConquestSave_${slot}`;
      const saved = localStorage.getItem(saveKey);

      if (!saved) return null;

      const saveFile = JSON.parse(saved);

      // Handle new format with header
      if (saveFile.header) {
        const header = saveFile.header;

        return {
          slot: slot,
          created: new Date(header.created).toLocaleDateString(),
          lastPlayed: new Date(header.lastPlayed).toLocaleDateString(),
          playtime: this.formatPlaytime(header.playtime || 0),
          gameLayer: header.metadata?.gameLayer || 1,
          storyProgress: header.metadata?.storyProgress || 0,
          roomsExplored: header.metadata?.roomsExplored || 0,
          playerLevel: header.metadata?.playerLevel || 1,
          saveSize: this.formatBytes(JSON.stringify(saveFile).length),
          compressed: saveFile.save.compressed || false,
          compressionRatio: saveFile.save.compressed
            ? `${(((saveFile.save.originalSize - saveFile.save.compressedSize) / saveFile.save.originalSize) * 100).toFixed(1)}%`
            : 'N/A',
        };
      } else {
        // Handle old format
        const saveData = saveFile;

        return {
          slot: slot,
          created: new Date(saveData.created).toLocaleDateString(),
          lastPlayed: new Date(saveData.lastPlayed).toLocaleDateString(),
          playtime: this.formatPlaytime(saveData.player.totalPlaytime || 0),
          gameLayer: saveData.gameLayer || 1,
          storyProgress: (saveData.story?.discoveredFragments || []).length,
          roomsExplored: (saveData.ship?.rooms || []).length,
          playerLevel: 1,
          saveSize: this.formatBytes(JSON.stringify(saveFile).length),
          compressed: false,
          compressionRatio: 'N/A',
        };
      }
    } catch (error) {
      console.error('Failed to get save info:', error);

      return null;
    }
  }

  getAllSaveSlots() {
    const saves = [];

    // Check auto save
    if (this.hasSaveData('auto')) {
      saves.push('auto');
    }

    // Check numbered slots
    for (let i = 1; i <= this.maxSaveSlots; i++) {
      if (this.hasSaveData(i.toString())) {
        saves.push(i.toString());
      }
    }

    return saves;
  }

  async getAllSaveInfo() {
    const slots = this.getAllSaveSlots();
    const saveInfos = [];

    for (const slot of slots) {
      const info = await this.getSaveInfo(slot);

      if (info) {
        saveInfos.push(info);
      }
    }

    return saveInfos;
  }

  formatPlaytime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Backup and restore functionality
  async exportSave(slot = 'auto') {
    const saveData = await this.loadSaveData(slot);

    if (!saveData) return null;

    const exportData = {
      gameTitle: 'Digital Conquest',
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      saveData: saveData,
    };

    const compressed = await this.compression.compressSave(exportData);

    return JSON.stringify(compressed);
  }

  async importSave(importString, slot = 'manual') {
    try {
      const importData = JSON.parse(importString);
      const decompressed = await this.compression.decompressSave(importData);

      if (decompressed.gameTitle !== 'Digital Conquest') {
        throw new Error('Invalid save file');
      }

      await this.saveGame(decompressed.saveData, slot);

      return true;
    } catch (error) {
      console.error('Failed to import save:', error);

      return false;
    }
  }

  // Cleanup old saves
  cleanupOldSaves(keepCount = 10) {
    const saves = this.getAllSaveSlots();

    if (saves.length <= keepCount) return;

    // Sort saves by last played date and remove oldest
    saves.sort((a, b) => {
      const infoA = this.getSaveInfo(a);
      const infoB = this.getSaveInfo(b);

      return new Date(infoB.lastPlayed) - new Date(infoA.lastPlayed);
    });

    // Keep the most recent saves, delete the rest
    for (let i = keepCount; i < saves.length; i++) {
      this.deleteSaveData(saves[i]);
    }
  }

  // Get storage usage statistics
  getStorageStats() {
    const saves = this.getAllSaveSlots();
    let totalSize = 0;
    let compressedSaves = 0;

    saves.forEach(slot => {
      const saveKey =
        slot === 'auto' ? 'digitalConquestSave' : `digitalConquestSave_${slot}`;
      const saveData = localStorage.getItem(saveKey);

      if (saveData) {
        totalSize += saveData.length;
        try {
          const parsed = JSON.parse(saveData);

          if (parsed.save && parsed.save.compressed) {
            compressedSaves++;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    return {
      totalSaves: saves.length,
      totalSize: this.formatBytes(totalSize),
      compressedSaves,
      compressionRate:
        saves.length > 0
          ? `${((compressedSaves / saves.length) * 100).toFixed(1)}%`
          : '0%',
    };
  }
}
