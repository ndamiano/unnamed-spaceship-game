import { GameEvents } from '../core/game-events.js';
import { getStats } from '../entities/player/player-stats.js';

export class Minimap {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.ship = null;
    this.player = null;
    this.enabled = false;
    this.visible = false;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Enable minimap when upgrade is purchased
    GameEvents.UI.Listeners.enableMinimap(() => {
      this.enable();
    });

    // Toggle minimap visibility
    GameEvents.UI.Listeners.toggleMinimap(() => {
      this.toggle();
    });

    // Update on player movement
    GameEvents.Player.Listeners.updated(() => {
      if (this.enabled && this.visible) {
        this.update();
      }
    });

    // Listen for ship and player references
    GameEvents.Game.Listeners.initialized(() => {
      // Get references to ship and player from window object or game instance
      if (window.game) {
        this.ship = window.game.ship;
        this.player = window.game.player;
      }
    });
  }

  enable() {
    if (this.enabled) return;

    this.enabled = true;
    this.create();
    this.show();

    console.log('Minimap enabled');
  }

  create() {
    if (this.container) return;

    // Create minimap container
    this.container = document.createElement('div');
    this.container.id = 'minimap';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 200px;
      height: 200px;
      border: 2px solid #00ff00;
      background: rgba(0, 0, 0, 0.9);
      border-radius: 8px;
      z-index: 200;
      box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
      font-family: monospace;
    `;

    // Create title bar
    const titleBar = document.createElement('div');

    titleBar.style.cssText = `
      background: rgba(0, 255, 0, 0.2);
      color: #00ff00;
      padding: 4px 8px;
      font-size: 10px;
      border-bottom: 1px solid #00ff00;
      text-align: center;
      font-weight: bold;
    `;
    titleBar.textContent = 'NAVIGATION MATRIX';

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 196;
    this.canvas.height = 176;
    this.canvas.style.cssText = `
      width: 196px;
      height: 176px;
      display: block;
      margin: 2px;
    `;
    this.ctx = this.canvas.getContext('2d');

    // Create controls
    const controls = document.createElement('div');

    controls.style.cssText = `
      position: absolute;
      bottom: 4px;
      right: 4px;
      color: #666;
      font-size: 8px;
    `;
    controls.textContent = 'M to toggle';

    this.container.appendChild(titleBar);
    this.container.appendChild(this.canvas);
    this.container.appendChild(controls);

    document.getElementById('game-container').appendChild(this.container);
  }

  show() {
    if (!this.container) return;

    this.container.style.display = 'block';
    this.visible = true;
    this.update();
  }

  hide() {
    if (!this.container) return;

    this.container.style.display = 'none';
    this.visible = false;
  }

  toggle() {
    if (!this.enabled) {
      const playerStats = getStats();

      if (playerStats.getUpgradeCount('NAVIGATION_MATRIX') > 0) {
        this.enable();
      } else {
        GameEvents.Game.Emit.message('Navigation Matrix upgrade required');
      }

      return;
    }

    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  update() {
    if (!this.ctx || !this.ship || !this.player) return;

    this.render();
  }

  render() {
    const { width, height } = this.canvas;

    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, width, height);

    if (!this.ship || !this.player) return;

    // Calculate scale to fit ship in minimap
    const shipWidth = this.ship.width;
    const shipHeight = this.ship.height;
    const scale = Math.min(
      (width - 20) / shipWidth,
      (height - 20) / shipHeight
    );

    const offsetX = (width - shipWidth * scale) / 2;
    const offsetY = (height - shipHeight * scale) / 2;

    // Draw ship boundary
    this.ctx.strokeStyle = '#004400';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      offsetX,
      offsetY,
      shipWidth * scale,
      shipHeight * scale
    );

    // Draw discovered areas
    this.ctx.fillStyle = '#222';
    for (let y = 0; y < shipHeight; y++) {
      for (let x = 0; x < shipWidth; x++) {
        const tile = this.ship.map.getTile(x, y);

        if (tile && tile.visible) {
          this.ctx.fillRect(
            offsetX + x * scale,
            offsetY + y * scale,
            Math.max(1, scale),
            Math.max(1, scale)
          );
        }
      }
    }

    // Draw rooms
    this.drawRooms(scale, offsetX, offsetY);

    // Draw player
    this.drawPlayer(scale, offsetX, offsetY);

    // Draw compass
    this.drawCompass();
  }

  drawRooms(scale, offsetX, offsetY) {
    if (!this.ship.map.rooms) return;

    this.ctx.strokeStyle = '#00ff00';
    this.ctx.fillStyle = '#00ff00';
    this.ctx.lineWidth = 1;
    this.ctx.font = '8px monospace';

    this.ship.map.rooms.forEach(room => {
      // Check if any part of room is discovered
      let hasDiscoveredTile = false;

      for (
        let y = room.y;
        y < room.y + room.height && !hasDiscoveredTile;
        y++
      ) {
        for (
          let x = room.x;
          x < room.x + room.width && !hasDiscoveredTile;
          x++
        ) {
          const tile = this.ship.map.getTile(x, y);

          if (tile && tile.visible) {
            hasDiscoveredTile = true;
          }
        }
      }

      if (!hasDiscoveredTile) return;

      const roomX = offsetX + room.x * scale;
      const roomY = offsetY + room.y * scale;
      const roomWidth = room.width * scale;
      const roomHeight = room.height * scale;

      // Draw room outline
      this.ctx.strokeRect(roomX, roomY, roomWidth, roomHeight);

      // Draw room type indicator
      if (room.id === 'spawn') {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(roomX + 1, roomY + 1, 3, 3);
      } else if (room.id === 'finish') {
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillRect(roomX + 1, roomY + 1, 3, 3);
      } else if (roomWidth > 20 && roomHeight > 10) {
        // Only show room names for larger rooms
        this.ctx.fillStyle = '#00ff00';
        const roomName = this.getRoomDisplayName(room);
        const textWidth = this.ctx.measureText(roomName).width;

        if (textWidth < roomWidth - 4) {
          this.ctx.fillText(
            roomName,
            roomX + (roomWidth - textWidth) / 2,
            roomY + roomHeight / 2 + 3
          );
        }
      }
    });
  }

  drawPlayer(scale, offsetX, offsetY) {
    const playerX = offsetX + this.player.x * scale;
    const playerY = offsetY + this.player.y * scale;

    // Draw player as a pulsing dot
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 4) * 0.3 + 0.7;

    this.ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
    this.ctx.fillRect(playerX - 1, playerY - 1, 3, 3);

    // Draw direction indicator
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(playerX, playerY);

    const dirX = this.player.direction.x * 4;
    const dirY = this.player.direction.y * 4;

    this.ctx.lineTo(playerX + dirX, playerY + dirY);
    this.ctx.stroke();
  }

  drawCompass() {
    const compassX = this.canvas.width - 25;
    const compassY = 25;
    const radius = 12;

    // Draw compass circle
    this.ctx.strokeStyle = '#006600';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(compassX, compassY, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Draw cardinal directions
    this.ctx.fillStyle = '#006600';
    this.ctx.font = '8px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // N
    this.ctx.fillText('N', compassX, compassY - radius + 4);
    // S
    this.ctx.fillText('S', compassX, compassY + radius - 2);
    // E
    this.ctx.fillText('E', compassX + radius - 3, compassY + 2);
    // W
    this.ctx.fillText('W', compassX - radius + 3, compassY + 2);

    // Reset text alignment
    this.ctx.textAlign = 'start';
    this.ctx.textBaseline = 'alphabetic';
  }

  getRoomDisplayName(room) {
    if (room.name) {
      // Abbreviate long room names
      const name = room.name;

      if (name.length > 8) {
        return name.substring(0, 6) + '..';
      }

      return name;
    }

    // Use room ID as fallback
    return room.id.substring(0, 4).toUpperCase();
  }

  // Called by game when ship/player references are available
  setReferences(ship, player) {
    this.ship = ship;
    this.player = player;

    if (this.enabled && this.visible) {
      this.update();
    }
  }

  // Called when game is destroyed
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.ship = null;
    this.player = null;
    this.enabled = false;
    this.visible = false;
  }
}

// Create singleton instance
export const minimap = new Minimap();
