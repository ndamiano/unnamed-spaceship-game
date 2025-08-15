import { eventBus } from './event-bus.js';

/**
 * Centralized game events with type safety and documentation
 * This replaces direct eventBus.emit() calls throughout the codebase
 */
export const GameEvents = {
  // Player events
  Player: {
    move: (x, y, direction) =>
      eventBus.emit('player-move', { x, y, direction }),
    updated: stats => eventBus.emit('player-updated', stats),
    directionChange: direction =>
      eventBus.emit('player-direction-change', direction),
    attemptMove: direction => eventBus.emit('attempt-move', direction),
    attemptInteract: () => eventBus.emit('attempt-interact'),
  },

  // Game state events
  Game: {
    message: text => eventBus.emit('game-message', text),
    initialized: () => eventBus.emit('game-initialized'),
    resetState: () => eventBus.emit('reset-state'),
    resumed: () => eventBus.emit('game-resumed'),
  },

  // Story events
  Story: {
    discovery: fragmentId => eventBus.emit('story-discovery', { fragmentId }),
    show: fragmentId => eventBus.emit('show-story', fragmentId),
    openJournal: () => eventBus.emit('open-journal'),
    restoreState: storyData => eventBus.emit('restore-story-state', storyData),
    registerObject: obj => eventBus.emit('register-story-object', obj),
  },

  // UI events
  UI: {
    openUpgrades: () => eventBus.emit('open-upgrade-menu'),
    openSaveManager: () => eventBus.emit('open-save-manager'),
  },

  // Resource events
  Resources: {
    add: (type, amount) => eventBus.emit('add-resource', { type, amount }),
  },

  // Upgrade events
  Upgrades: {
    purchase: upgradeDef => eventBus.emit('purchase-upgrade', upgradeDef),
  },

  // Save/Load events
  Save: {
    restorePlayer: playerData =>
      eventBus.emit('restore-player-state', playerData),
    restoreShip: shipData => eventBus.emit('restore-ship-state', shipData),
    restoreStory: storyData => eventBus.emit('restore-story-state', storyData),
  },
};

// Event listener helpers
export const GameEventListeners = {
  // Helper to register multiple listeners at once
  register: listeners => {
    Object.entries(listeners).forEach(([event, callback]) => {
      eventBus.on(event, callback);
    });
  },

  // Helper to unregister listeners
  unregister: listeners => {
    Object.entries(listeners).forEach(([event, callback]) => {
      eventBus.off(event, callback);
    });
  },

  // Direct access to eventBus for complex cases
  on: (event, callback) => eventBus.on(event, callback),
  off: (event, callback) => eventBus.off(event, callback),
  emit: (event, data) => eventBus.emit(event, data),
};
