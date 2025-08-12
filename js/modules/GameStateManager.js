export class GameStateManager {
  constructor() {
    this.currentState = 'start';
    this.saveData = null;
    this.saveVersion = '1.0.0';
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

  loadGame(saveData) {
    this.currentState = 'playing';
    this.saveData = saveData;
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
      window.location.href = 'game.html'; // Updated to use game.html
    }, 500);
  }

  saveGame(gameData) {
    if (!this.saveData) {
      console.error('No save data to update');

      return false;
    }

    // Update save data with current game state
    this.saveData.lastPlayed = new Date().toISOString();

    // Update player data
    if (gameData.player) {
      this.saveData.player = {
        ...this.saveData.player,
        ...gameData.player,
      };
    }

    // Update ship data (most important for your use case)
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

    // Save to localStorage
    try {
      localStorage.setItem(
        'digitalConquestSave',
        JSON.stringify(this.saveData)
      );
      console.log('Game saved successfully');

      return true;
    } catch (error) {
      console.error('Failed to save game:', error);

      return false;
    }
  }

  hasSaveData() {
    const saved = localStorage.getItem('digitalConquestSave');

    if (!saved) return false;

    try {
      const data = JSON.parse(saved);

      return data.version && data.player && data.created;
    } catch (error) {
      console.error('Corrupted save data:', error);

      return false;
    }
  }

  loadSaveData() {
    const saved = localStorage.getItem('digitalConquestSave');

    if (!saved) return null;

    try {
      let data = JSON.parse(saved);

      if (data.version !== this.saveVersion) {
        data = this.migrateSaveData(data);
      }

      return data;
    } catch (error) {
      console.error('Failed to load save data:', error);

      return null;
    }
  }

  migrateSaveData(oldData) {
    console.log(
      `Migrating save data from ${oldData.version} to ${this.saveVersion}`
    );
    oldData.version = this.saveVersion;

    return oldData;
  }

  deleteSaveData() {
    localStorage.removeItem('digitalConquestSave');
    this.saveData = null;
  }

  getSaveInfo() {
    const saveData = this.loadSaveData();

    if (!saveData) return null;

    return {
      created: new Date(saveData.created).toLocaleDateString(),
      lastPlayed: new Date(saveData.lastPlayed).toLocaleDateString(),
      playtime: this.formatPlaytime(saveData.player.totalPlaytime || 0),
      gameLayer: saveData.gameLayer || 1,
      storyProgress: (saveData.story?.discoveredFragments || []).length,
      roomsExplored: (saveData.ship?.rooms || []).length,
      objectsInteracted: (saveData.ship?.objects || []).filter(
        obj => obj.hasBeenUsed
      ).length,
    };
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
}
