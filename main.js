import { Game } from './js/modules/Game.js';
import { GameStateManager } from './js/modules/save/GameStateManager.js';
import { eventBus } from './js/modules/EventBus.js';

class GameLoader {
  constructor() {
    this.gameState = new GameStateManager();
    this.game = null;
    this.saveInterval = null;
    this.pendingSaveData = null;
    this.setupEventListeners();
    this.initializeFromStartScreen();
  }

  setupEventListeners() {
    // Listen for game initialization completion
    eventBus.on('game-initialized', () => {
      console.log('Game initialization complete - checking for restore data');

      if (this.pendingSaveData) {
        console.log('Restoring game state after initialization');
        this.restoreGameState(this.pendingSaveData);
        this.pendingSaveData = null; // Clear after use
      }
    });
  }

  initializeFromStartScreen() {
    const startData = sessionStorage.getItem('gameStartData');

    if (startData) {
      try {
        const { isNewGame, saveData } = JSON.parse(startData);

        sessionStorage.removeItem('gameStartData');

        console.log(
          isNewGame ? 'Starting new game...' : 'Loading saved game...'
        );

        this.initializeGame(saveData);

        if (!isNewGame) {
          // Store save data to restore after initialization
          this.pendingSaveData = saveData;
        }
      } catch (error) {
        console.error('Failed to parse start data:', error);
        this.redirectToStart();
      }
    } else {
      this.redirectToStart();
    }
  }

  redirectToStart() {
    console.log('No start data found, redirecting to start screen...');
    window.location.href = 'start.html';
  }

  initializeGame(saveData) {
    this.game = new Game();
    this.gameState.saveData = saveData;
    this.setupAutoSave();

    if (saveData && saveData.player) {
      console.log('Game initialized with save data context');
    }

    window.game = this.game;
  }

  restoreGameState(saveData) {
    console.log('Restoring game state from save data...');

    // Restore player state
    if (saveData.player) {
      eventBus.emit('restore-player-state', saveData.player);
    }

    // Restore ship state
    if (saveData.ship) {
      eventBus.emit('restore-ship-state', saveData.ship);
    }

    // Restore story progress
    if (saveData.story) {
      eventBus.emit('restore-story-state', saveData.story);
    }

    console.log('Game restoration events emitted');
  }

  setupAutoSave() {
    // Auto-save every 30 seconds
    this.saveInterval = setInterval(() => {
      this.saveCurrentGame();
    }, 30000);

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveCurrentGame();
    });

    // Save on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveCurrentGame();
      }
    });
  }

  saveCurrentGame() {
    if (!this.game || !this.game.player || !this.game.ship) return;

    try {
      // Gather comprehensive game state
      const currentGameData = {
        player: this.game.player.getSaveState
          ? this.game.player.getSaveState()
          : {
              x: this.game.player.x,
              y: this.game.player.y,
              battery: this.game.player.battery,
              maxBattery: this.game.player.maxBattery,
              resources: this.game.player.resources,
              upgrades: Array.from(this.game.player.upgrades.entries()),
              totalPlaytime: this.game.player.totalPlaytime || 0,
              spawnPoint: this.game.player.spawnPoint,
              direction: this.game.player.direction,
            },

        ship: this.game.ship.getSaveState(),

        story: this.getStoryState(),
      };

      const success = this.gameState.saveGame(currentGameData);

      if (success) {
        console.log('Game auto-saved successfully');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  getStoryState() {
    // Try to get story system state
    try {
      // Import story system dynamically
      if (typeof window !== 'undefined' && window.storySystem) {
        return {
          discoveredFragments: window.storySystem.getAllDiscovered(),
          discoveredGroups: Object.fromEntries(
            window.storySystem.discoveredGroups
          ),
          journalEntries: Object.fromEntries(window.storySystem.journalEntries),
        };
      }
    } catch (error) {
      console.warn('Could not save story state:', error);
    }

    return {
      discoveredFragments: [],
      discoveredGroups: {},
      journalEntries: {},
    };
  }

  // Cleanup when page unloads
  destroy() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
  }
}

// Initialize the game loader
const gameLoader = new GameLoader();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  gameLoader.destroy();
});
