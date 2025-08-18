// src/systems/ship/ship-system.js - Fixed for section system
import { Ship } from '../../world/ship/ship.js';
import { GameEvents } from '../../core/game-events.js';
import { getStats } from '../../entities/player/player-stats.js';

export class ShipSystem {
  constructor() {
    this.ship = null;
    this.initialized = false;
  }

  async initialize(saveData = null) {
    console.log('Initializing ship system...');

    try {
      // Determine section based on save data or default
      const sectionId = saveData?.currentSection || 'ENGINEERING_CORE';
      const width = saveData?.width || 250;
      const height = saveData?.height || 250;
      const type = saveData?.type || 'colony';

      // Create ship instance
      this.ship = new Ship(width, height, type, sectionId);

      // Add enhancement methods
      this.addShipEnhancements();

      // Initialize the section (this replaces the old generateLayout call)
      await this.ship.initializeSection(
        sectionId,
        saveData?.sectionData || saveData
      );

      // Setup upgrade features
      this.setupUpgradeFeatures();

      console.log(
        `Ship created: ${width}x${height}, type: ${type}, section: ${sectionId}`
      );

      this.initialized = true;
      GameEvents.Initialization.Emit.shipInitialized();
    } catch (error) {
      console.error('Failed to setup ship:', error);
      throw error;
    }
  }

  addShipEnhancements() {
    // Room scanner functionality
    this.ship.revealCurrentRoom = (playerX, playerY) => {
      if (!this.ship.map) return;

      const currentRoom = this.ship.map.rooms.find(
        room =>
          playerX >= room.x &&
          playerX < room.x + room.width &&
          playerY >= room.y &&
          playerY < room.y + room.height
      );

      if (currentRoom) {
        let tilesRevealed = 0;

        for (
          let y = currentRoom.y;
          y < currentRoom.y + currentRoom.height;
          y++
        ) {
          for (
            let x = currentRoom.x;
            x < currentRoom.x + currentRoom.width;
            x++
          ) {
            const tile = this.ship.map.getTile(x, y);

            if (tile && !tile.visible) {
              tile.visible = true;
              tilesRevealed++;
            }
          }
        }

        if (tilesRevealed > 0) {
          GameEvents.Game.Emit.message(
            `Room Scanner: ${currentRoom.name || currentRoom.id} fully mapped (${tilesRevealed} new areas)`
          );
        }
      }
    };

    // Fabricator refresh functionality
    this.ship.refreshNearestFabricator = (playerX, playerY) => {
      if (!this.ship.map) return false;

      let nearestFabricator = null;
      let nearestDistance = Infinity;
      let fabricatorPos = null;

      for (let y = 0; y < this.ship.height; y++) {
        for (let x = 0; x < this.ship.width; x++) {
          const tile = this.ship.map.getTile(x, y);

          if (tile?.object?.objectType === 'nanofabricator') {
            const distance = Math.abs(x - playerX) + Math.abs(y - playerY);

            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestFabricator = tile.object;
              fabricatorPos = { x, y };
            }
          }
        }
      }

      if (nearestFabricator && nearestDistance <= 5) {
        let refreshed = false;

        nearestFabricator.activationResults.forEach(result => {
          if (result.type === 'resource' && result.used) {
            result.used = false;
            refreshed = true;
          }
        });

        const message = refreshed
          ? `Nanofabricator at (${fabricatorPos.x}, ${fabricatorPos.y}) refreshed and ready for use`
          : 'Nanofabricator was already ready for use';

        GameEvents.Game.Emit.message(message);

        return true;
      } else {
        GameEvents.Game.Emit.message(
          `No nanofabricator within range (5 tiles). Nearest: ${nearestDistance} tiles away.`
        );

        return false;
      }
    };
  }

  setupUpgradeFeatures() {
    // Room scanner
    GameEvents.Game.Listeners.revealCurrentRoom(() => {
      const playerStats = getStats();

      if (playerStats.getUpgradeCount('ROOM_SCANNER') > 0) {
        this.ship.revealCurrentRoom(playerStats.x, playerStats.y);
      }
    });

    // Fabricator refresh
    GameEvents.Game.Listeners.refreshNearestFabricator(() => {
      const playerStats = getStats();

      this.ship.refreshNearestFabricator(playerStats.x, playerStats.y);
    });
  }

  getSpawnPoint() {
    return this.ship ? this.ship.getSpawnPoint() : { x: 0, y: 0 };
  }

  revealAreaAroundPlayer(x, y, radius) {
    if (this.ship) {
      this.ship.revealAreaAroundPlayer(x, y, radius);
    }
  }

  canMoveTo(x, y, direction) {
    return this.ship ? this.ship.canMoveTo(x, y, direction) : false;
  }

  attemptInteract(targetX, targetY) {
    if (this.ship) {
      this.ship.attemptInteract(targetX, targetY);
    }
  }

  isInitialized() {
    return this.initialized;
  }

  getShip() {
    return this.ship;
  }

  getSaveState() {
    return this.ship ? this.ship.getSaveState() : null;
  }
}
