// src/systems/save/save-system.js
export class SaveSystem {
  constructor() {
    this.saveData = null;
    this.isRestoringFromSave = false;
  }

  checkForSaveRestore() {
    const startData = sessionStorage.getItem('gameStartData');

    if (startData) {
      try {
        const { isNewGame, saveData } = JSON.parse(startData);

        if (!isNewGame && saveData) {
          this.isRestoringFromSave = true;
          this.saveData = saveData;
          console.log('Game will restore from save data');
        }
      } catch (error) {
        console.error('Failed to parse save data:', error);
      }
    }
  }

  getSaveData() {
    return this.saveData;
  }

  isRestoring() {
    return this.isRestoringFromSave;
  }

  // This could be expanded to handle save/load operations
  // that are currently in GameStateManager
}
