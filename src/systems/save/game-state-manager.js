// Simplified save/load system - remove the compression complexity
export class GameStateManager {
  constructor() {
    this.saveData = null;
    this.saveVersion = '1.0.0';
  }

  startNewGame() {
    this.saveData = {
      version: this.saveVersion,
      created: new Date().toISOString(),
      lastPlayed: new Date().toISOString(),
      player: {
        x: 0,
        y: 0,
        battery: 100,
        maxBattery: 100,
        resources: { Nanites: 100, 'Ship Parts': 0, 'Research Points': 0 },
        upgrades: [],
        totalPlaytime: 0,
        spawnPoint: { x: 0, y: 0 },
        direction: { x: 0, y: 1 },
      },
      ship: { width: 250, height: 250, type: 'colony' },
      story: {
        discoveredFragments: [],
        discoveredGroups: {},
        journalEntries: {},
      },
    };
    this.transitionToGame();
  }

  async loadGame(saveData) {
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

    setTimeout(() => (window.location.href = 'game.html'), 500);
  }

  saveGame(gameData) {
    try {
      // Simple merge - no compression needed
      this.saveData = {
        ...this.saveData,
        lastPlayed: new Date().toISOString(),
        ...gameData,
      };

      localStorage.setItem(
        'digitalConquestSave',
        JSON.stringify(this.saveData)
      );

      return true;
    } catch (error) {
      console.error('Save failed:', error);

      return false;
    }
  }

  hasSaveData() {
    const saved = localStorage.getItem('digitalConquestSave');

    if (!saved) return false;

    try {
      const data = JSON.parse(saved);

      return data !== null;
    } catch {
      return false;
    }
  }

  loadSaveData() {
    const saved = localStorage.getItem('digitalConquestSave');

    return saved ? JSON.parse(saved) : null;
  }

  async getSaveInfo() {
    const data = this.loadSaveData();

    if (!data) return null;

    return {
      created: new Date(data.created).toLocaleDateString(),
      lastPlayed: new Date(data.lastPlayed).toLocaleDateString(),
      playtime: this.formatPlaytime(data.player.totalPlaytime || 0),
      storyProgress: (data.story?.discoveredFragments || []).length,
    };
  }

  formatPlaytime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}
