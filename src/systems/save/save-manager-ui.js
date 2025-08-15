import { eventBus } from '../../core/event-bus.js';

export class SaveManagerUI {
  constructor(gameStateManager) {
    this.gameState = gameStateManager;
    this.modal = null;
    this.savesList = null;
    this.storageInfo = null;
    this.isOpen = false;

    this.createModal();
    this.setupEventListeners();
  }

  createModal() {
    // Create modal HTML
    const modalHTML = `
      <div id="save-manager-modal" class="story-modal">
        <div class="story-content" style="width: 900px; height: 80vh;">
          <div class="story-header">
            <div class="story-icon">💾</div>
            <div class="story-meta">
              <h3 class="story-title">Save Manager</h3>
              <p class="story-timestamp" id="storage-info">Loading...</p>
            </div>
          </div>

          <div class="save-manager-content" style="flex: 1; overflow-y: auto; padding: 20px 0;">
            <div class="save-actions" style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn" id="new-save-btn">Save to New Slot</button>
              <button class="btn secondary" id="quick-save-btn">Quick Save</button>
              <button class="btn secondary" id="export-save-btn">Export Save</button>
              <button class="btn secondary" id="import-save-btn">Import Save</button>
              <button class="btn secondary" id="cleanup-saves-btn">Cleanup Old Saves</button>
            </div>
            
            <div class="saves-list" id="saves-list">
              <div class="loading">Loading saves...</div>
            </div>
          </div>

          <div class="story-actions">
            <button class="btn secondary" id="refresh-saves-btn">Refresh</button>
            <button class="btn" id="close-save-manager-btn">Close</button>
          </div>
        </div>
      </div>
      
      <!-- Hidden file input for imports -->
      <input type="file" id="save-import-input" accept=".json,.sav" style="display: none;">
    `;

    // Add to game container
    const gameContainer = document.getElementById('game-container');

    if (gameContainer) {
      gameContainer.insertAdjacentHTML('beforeend', modalHTML);
    }

    this.modal = document.getElementById('save-manager-modal');
    this.savesList = document.getElementById('saves-list');
    this.storageInfo = document.getElementById('storage-info');
  }

  setupEventListeners() {
    // Modal control
    document
      .getElementById('close-save-manager-btn')
      ?.addEventListener('click', () => {
        this.close();
      });

    // Action buttons
    document.getElementById('new-save-btn')?.addEventListener('click', () => {
      this.createNewSave();
    });

    document.getElementById('quick-save-btn')?.addEventListener('click', () => {
      this.quickSave();
    });

    document
      .getElementById('export-save-btn')
      ?.addEventListener('click', () => {
        this.exportSave();
      });

    document
      .getElementById('import-save-btn')
      ?.addEventListener('click', () => {
        this.importSave();
      });

    document
      .getElementById('cleanup-saves-btn')
      ?.addEventListener('click', () => {
        this.cleanupSaves();
      });

    document
      .getElementById('refresh-saves-btn')
      ?.addEventListener('click', () => {
        this.refreshSaves();
      });

    // File input for imports
    document
      .getElementById('save-import-input')
      ?.addEventListener('change', e => {
        this.handleFileImport(e);
      });

    // Close on outside click
    this.modal?.addEventListener('click', e => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Close on escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Listen for save manager open requests
    eventBus.on('open-save-manager', () => {
      this.open();
    });
  }

  async open() {
    this.isOpen = true;
    this.modal?.classList.add('active');
    await this.refreshSaves();
  }

  close() {
    this.isOpen = false;
    this.modal?.classList.remove('active');
  }

  async refreshSaves() {
    try {
      this.savesList.innerHTML = '<div class="loading">Loading saves...</div>';

      // Get all save info
      const saveInfos = await this.gameState.getAllSaveInfo();
      const storageStats = this.gameState.getStorageStats();

      // Update storage info
      this.storageInfo.textContent = `${storageStats.totalSaves} saves • ${storageStats.totalSize} • ${storageStats.compressionRate} compressed`;

      // Render saves list
      this.renderSavesList(saveInfos);
    } catch (error) {
      console.error('Failed to refresh saves:', error);
      this.savesList.innerHTML =
        '<div class="error">Failed to load saves</div>';
    }
  }

  renderSavesList(saveInfos) {
    if (saveInfos.length === 0) {
      this.savesList.innerHTML = '<div class="no-saves">No saves found</div>';

      return;
    }

    const savesHTML = saveInfos
      .map(info => this.createSaveItemHTML(info))
      .join('');

    this.savesList.innerHTML = `
      <div class="saves-grid" style="display: grid; grid-template-columns: 1fr; gap: 15px;">
        ${savesHTML}
      </div>
    `;

    // Add event listeners to save items
    this.setupSaveItemListeners();
  }

  createSaveItemHTML(info) {
    const isAutoSave = info.slot === 'auto';
    const compressionBadge = info.compressed
      ? `<span class="compression-badge" style="background: #00ff00; color: #000; padding: 2px 6px; border-radius: 3px; font-size: 0.7em; margin-left: 5px;">COMPRESSED ${info.compressionRatio}</span>`
      : '';

    return `
      <div class="save-item" data-slot="${info.slot}" style="
        border: 1px solid #00ff00; 
        border-radius: 8px; 
        padding: 15px; 
        background: rgba(0, 255, 0, 0.05);
        ${isAutoSave ? 'border-color: #ffaa00; background: rgba(255, 170, 0, 0.05);' : ''}
      ">
        <div class="save-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div class="save-title" style="font-weight: bold; color: ${isAutoSave ? '#ffaa00' : '#00ff00'};">
            ${isAutoSave ? '🔄 Auto Save' : `💾 Save Slot ${info.slot}`}
            ${compressionBadge}
          </div>
          <div class="save-size" style="font-size: 0.8em; color: #888;">
            ${info.saveSize}
          </div>
        </div>
        
        <div class="save-details" style="font-size: 0.9em; color: #ccffcc; line-height: 1.4;">
          <div>Created: ${info.created} | Last Played: ${info.lastPlayed}</div>
          <div>Playtime: ${info.playtime} | Layer: ${info.gameLayer} | Level: ${info.playerLevel}</div>
          <div>Story Progress: ${info.storyProgress} | Rooms: ${info.roomsExplored}</div>
        </div>
        
        <div class="save-actions" style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="save-load-btn btn secondary" data-slot="${info.slot}" style="font-size: 0.8em; padding: 5px 10px;">
            Load
          </button>
          <button class="save-overwrite-btn btn secondary" data-slot="${info.slot}" style="font-size: 0.8em; padding: 5px 10px;">
            Overwrite
          </button>
          <button class="save-export-btn btn secondary" data-slot="${info.slot}" style="font-size: 0.8em; padding: 5px 10px;">
            Export
          </button>
          ${!isAutoSave ? `<button class="save-delete-btn btn secondary" data-slot="${info.slot}" style="font-size: 0.8em; padding: 5px 10px; border-color: #ff4444; color: #ff4444;">Delete</button>` : ''}
        </div>
      </div>
    `;
  }

  setupSaveItemListeners() {
    // Load buttons
    document.querySelectorAll('.save-load-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const slot = e.target.dataset.slot;

        this.loadSave(slot);
      });
    });

    // Overwrite buttons
    document.querySelectorAll('.save-overwrite-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const slot = e.target.dataset.slot;

        this.overwriteSave(slot);
      });
    });

    // Export buttons
    document.querySelectorAll('.save-export-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const slot = e.target.dataset.slot;

        this.exportSave(slot);
      });
    });

    // Delete buttons
    document.querySelectorAll('.save-delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const slot = e.target.dataset.slot;

        this.deleteSave(slot);
      });
    });
  }

  async createNewSave() {
    try {
      // Find next available slot
      const existingSlots = this.gameState
        .getAllSaveSlots()
        .filter(slot => slot !== 'auto');
      let newSlot = 1;

      while (existingSlots.includes(newSlot.toString())) {
        newSlot++;
      }

      // Get current game data and save
      const gameData = this.getCurrentGameData();
      const success = await this.gameState.saveGame(
        gameData,
        newSlot.toString()
      );

      if (success) {
        eventBus.emit('game-message', `Game saved to slot ${newSlot}`);
        await this.refreshSaves();
      } else {
        eventBus.emit('game-message', 'Failed to create save');
      }
    } catch (error) {
      console.error('Failed to create new save:', error);
      eventBus.emit('game-message', 'Error creating save');
    }
  }

  async quickSave() {
    try {
      const gameData = this.getCurrentGameData();
      const success = await this.gameState.saveGame(gameData, 'auto');

      if (success) {
        eventBus.emit('game-message', 'Quick save complete');
        await this.refreshSaves();
      } else {
        eventBus.emit('game-message', 'Quick save failed');
      }
    } catch (error) {
      console.error('Quick save failed:', error);
      eventBus.emit('game-message', 'Quick save error');
    }
  }

  async loadSave(slot) {
    if (
      confirm(`Load save from slot ${slot}? Current progress will be lost.`)
    ) {
      try {
        const saveData = await this.gameState.loadSaveData(slot);

        if (saveData) {
          await this.gameState.loadGame(saveData);
        } else {
          eventBus.emit('game-message', 'Failed to load save');
        }
      } catch (error) {
        console.error('Failed to load save:', error);
        eventBus.emit('game-message', 'Error loading save');
      }
    }
  }

  async overwriteSave(slot) {
    if (confirm(`Overwrite save in slot ${slot}?`)) {
      try {
        const gameData = this.getCurrentGameData();
        const success = await this.gameState.saveGame(gameData, slot);

        if (success) {
          eventBus.emit('game-message', `Save overwritten in slot ${slot}`);
          await this.refreshSaves();
        } else {
          eventBus.emit('game-message', 'Failed to overwrite save');
        }
      } catch (error) {
        console.error('Failed to overwrite save:', error);
        eventBus.emit('game-message', 'Error overwriting save');
      }
    }
  }

  async deleteSave(slot) {
    if (confirm(`Delete save from slot ${slot}? This cannot be undone.`)) {
      try {
        this.gameState.deleteSaveData(slot);
        eventBus.emit('game-message', `Save deleted from slot ${slot}`);
        await this.refreshSaves();
      } catch (error) {
        console.error('Failed to delete save:', error);
        eventBus.emit('game-message', 'Error deleting save');
      }
    }
  }

  async exportSave(slot = 'auto') {
    try {
      const exportData = await this.gameState.exportSave(slot);

      if (exportData) {
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = `digital-conquest-save-${slot}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        eventBus.emit('game-message', `Save exported from slot ${slot}`);
      } else {
        eventBus.emit('game-message', 'Export failed');
      }
    } catch (error) {
      console.error('Export failed:', error);
      eventBus.emit('game-message', 'Export error');
    }
  }

  importSave() {
    document.getElementById('save-import-input')?.click();
  }

  async handleFileImport(event) {
    const file = event.target.files[0];

    if (!file) return;

    try {
      const text = await file.text();
      const slot =
        prompt(
          'Enter slot number for imported save (or leave empty for auto-assign):'
        ) || 'imported';

      const success = await this.gameState.importSave(text, slot);

      if (success) {
        eventBus.emit('game-message', `Save imported to slot ${slot}`);
        await this.refreshSaves();
      } else {
        eventBus.emit('game-message', 'Import failed - invalid save file');
      }
    } catch (error) {
      console.error('Import failed:', error);
      eventBus.emit('game-message', 'Import error');
    }

    // Clear file input
    event.target.value = '';
  }

  cleanupSaves() {
    if (confirm('Remove old saves, keeping only the 10 most recent?')) {
      try {
        this.gameState.cleanupOldSaves(10);
        eventBus.emit('game-message', 'Old saves cleaned up');
        this.refreshSaves();
      } catch (error) {
        console.error('Cleanup failed:', error);
        eventBus.emit('game-message', 'Cleanup failed');
      }
    }
  }

  getCurrentGameData() {
    // This should be passed in or accessed from the game instance
    // For now, emit an event to request current game data
    return {
      player: window.game?.player?.getSaveState?.() || {},
      ship: window.game?.ship?.getSaveState?.() || {},
      story: window.storySystem?.getSaveState?.() || {},
    };
  }
}
