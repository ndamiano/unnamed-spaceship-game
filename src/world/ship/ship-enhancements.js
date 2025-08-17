// src/world/ship/ship-enhancements.js
// Add these methods to your existing Ship class

import { GameEvents } from '../../core/game-events.js';
import { getStats } from '../../entities/player/player-stats.js';

export const ShipEnhancements = {
  // Add to Ship constructor
  setupUpgradeFeatures() {
    this.setupRoomScanner();
    this.setupFabricatorRefresh();
    this.setupRoomTracking();
  },

  // Room Scanner implementation
  setupRoomScanner() {
    GameEvents.Game.Listeners.revealCurrentRoom(() => {
      const playerStats = getStats();

      if (playerStats.getUpgradeCount('ROOM_SCANNER') > 0) {
        this.revealCurrentRoom(playerStats.x, playerStats.y);
      }
    });
  },

  revealCurrentRoom(playerX, playerY) {
    // Find which room the player is in
    const currentRoom = this.map.rooms.find(
      room =>
        playerX >= room.x &&
        playerX < room.x + room.width &&
        playerY >= room.y &&
        playerY < room.y + room.height
    );

    if (currentRoom) {
      // Reveal entire room
      let tilesRevealed = 0;

      for (let y = currentRoom.y; y < currentRoom.y + currentRoom.height; y++) {
        for (
          let x = currentRoom.x;
          x < currentRoom.x + currentRoom.width;
          x++
        ) {
          const tile = this.map.getTile(x, y);

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

      return currentRoom;
    }

    return null;
  },

  // Fabricator Refresh implementation
  setupFabricatorRefresh() {
    GameEvents.Game.Listeners.refreshNearestFabricator(() => {
      const playerStats = getStats();

      this.refreshNearestFabricator(playerStats.x, playerStats.y);
    });
  },

  refreshNearestFabricator(playerX, playerY) {
    let nearestFabricator = null;
    let nearestDistance = Infinity;
    let fabricatorPos = null;

    // Find nearest nanofabricator
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.map.getTile(x, y);

        if (
          tile &&
          tile.object &&
          tile.object.objectType === 'nanofabricator'
        ) {
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
      // Within 5 tiles
      // Reset the fabricator
      let refreshed = false;

      nearestFabricator.activationResults.forEach(result => {
        if (result.type === 'resource' && result.used) {
          result.used = false;
          refreshed = true;
        }
      });

      if (refreshed) {
        GameEvents.Game.Emit.message(
          `Nanofabricator at (${fabricatorPos.x}, ${fabricatorPos.y}) refreshed and ready for use`
        );
      } else {
        GameEvents.Game.Emit.message(
          'Nanofabricator was already ready for use'
        );
      }

      return true;
    } else {
      const maxRange = 5;

      GameEvents.Game.Emit.message(
        `No nanofabricator within range (${maxRange} tiles). Nearest: ${nearestDistance} tiles away.`
      );

      return false;
    }
  },

  // Room tracking for exploration rewards
  setupRoomTracking() {
    GameEvents.Player.Listeners.move(({ x, y }) => {
      this.updatePlayerRoom(x, y);
    });
  },

  updatePlayerRoom(playerX, playerY) {
    const currentRoom = this.getCurrentRoom(playerX, playerY);

    if (currentRoom) {
      // Emit room entry event with room data
      GameEvents.Player.Emit.enterRoom({
        type: currentRoom.id,
        name: currentRoom.name,
        room: currentRoom,
      });
    }
  },

  getCurrentRoom(playerX, playerY) {
    return this.map.rooms.find(
      room =>
        playerX >= room.x &&
        playerX < room.x + room.width &&
        playerY >= room.y &&
        playerY < room.y + room.height
    );
  },

  // Helper method to get room type at position
  getRoomTypeAt(x, y) {
    const room = this.getCurrentRoom(x, y);

    return room ? room.id : null;
  },

  // Get all discovered rooms
  getDiscoveredRooms() {
    return this.map.rooms.filter(room => {
      // Check if any tile in the room is visible
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          const tile = this.map.getTile(x, y);

          if (tile && tile.visible) {
            return true;
          }
        }
      }

      return false;
    });
  },

  // Get room statistics
  getRoomStats() {
    const totalRooms = this.map.rooms.length;
    const discoveredRooms = this.getDiscoveredRooms().length;

    return {
      total: totalRooms,
      discovered: discoveredRooms,
      percentage:
        totalRooms > 0 ? Math.round((discoveredRooms / totalRooms) * 100) : 0,
    };
  },

  // Enhanced save state to include room discovery
  getEnhancedSaveState() {
    const baseState = this.getSaveState();

    return {
      ...baseState,
      roomStats: this.getRoomStats(),
      discoveredRooms: this.getDiscoveredRooms().map(room => ({
        id: room.id,
        name: room.name,
        x: room.x,
        y: room.y,
        width: room.width,
        height: room.height,
      })),
    };
  },
};
