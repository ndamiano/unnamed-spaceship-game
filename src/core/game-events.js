import { eventBus } from './event-bus.js';

/**
 * Centralized game events with type safety and organized emit/listen structure
 */
export const GameEvents = {
  Player: {
    Emit: {
      move: (x, y, direction) =>
        eventBus.emit('player-move', { x, y, direction }),
      updated: stats => eventBus.emit('player-updated', stats),
      directionChange: direction =>
        eventBus.emit('player-direction-change', direction),
      attemptMove: direction => eventBus.emit('attempt-move', direction),
      attemptInteract: () => eventBus.emit('attempt-interact'),
    },
    Listeners: {
      move: callback => eventBus.on('player-move', callback),
      updated: callback => eventBus.on('player-updated', callback),
      directionChange: callback =>
        eventBus.on('player-direction-change', callback),
      attemptMove: callback => eventBus.on('attempt-move', callback),
      attemptInteract: callback => eventBus.on('attempt-interact', callback),
    },
  },

  Game: {
    Emit: {
      message: text => eventBus.emit('game-message', text),
      initialized: () => eventBus.emit('game-initialized'),
      resetState: () => eventBus.emit('reset-state'),
      resumed: () => eventBus.emit('game-resumed'),
    },
    Listeners: {
      message: callback => eventBus.on('game-message', callback),
      initialized: callback => eventBus.on('game-initialized', callback),
      resetState: callback => eventBus.on('reset-state', callback),
      resumed: callback => eventBus.on('game-resumed', callback),
    },
  },

  Initialization: {
    Emit: {
      dataLoaded: () => eventBus.emit('init-data-loaded'),
      rendererReady: () => eventBus.emit('init-renderer-ready'),
      shipInitialized: () => eventBus.emit('init-ship-initialized'),
      playerReady: () => eventBus.emit('init-player-ready'),
      inputReady: () => eventBus.emit('init-input-ready'),
      uiReady: () => eventBus.emit('init-ui-ready'),
      storyReady: () => eventBus.emit('init-story-ready'),
      gameLoopReady: () => eventBus.emit('init-gameloop-ready'),
      allSystemsReady: () => eventBus.emit('init-all-systems-ready'),
    },
    Listeners: {
      dataLoaded: callback => eventBus.on('init-data-loaded', callback),
      rendererReady: callback => eventBus.on('init-renderer-ready', callback),
      shipInitialized: callback =>
        eventBus.on('init-ship-initialized', callback),
      playerReady: callback => eventBus.on('init-player-ready', callback),
      inputReady: callback => eventBus.on('init-input-ready', callback),
      uiReady: callback => eventBus.on('init-ui-ready', callback),
      storyReady: callback => eventBus.on('init-story-ready', callback),
      gameLoopReady: callback => eventBus.on('init-gameloop-ready', callback),
      allSystemsReady: callback =>
        eventBus.on('init-all-systems-ready', callback),
    },
  },

  Story: {
    Emit: {
      discovery: fragmentId => eventBus.emit('story-discovery', { fragmentId }),
      show: fragmentId => eventBus.emit('show-story', fragmentId),
      openJournal: () => eventBus.emit('open-journal'),
      restoreState: storyData =>
        eventBus.emit('restore-story-state', storyData),
      registerObject: obj => eventBus.emit('register-story-object', obj),
    },
    Listeners: {
      discovery: callback => eventBus.on('story-discovery', callback),
      show: callback => eventBus.on('show-story', callback),
      openJournal: callback => eventBus.on('open-journal', callback),
      restoreState: callback => eventBus.on('restore-story-state', callback),
      registerObject: callback =>
        eventBus.on('register-story-object', callback),
    },
  },

  UI: {
    Emit: {
      openUpgrades: () => eventBus.emit('open-upgrade-menu'),
      openSaveManager: () => eventBus.emit('open-save-manager'),
    },
    Listeners: {
      openUpgrades: callback => eventBus.on('open-upgrade-menu', callback),
      openSaveManager: callback => eventBus.on('open-save-manager', callback),
    },
  },

  Resources: {
    Emit: {
      add: (type, amount) => eventBus.emit('add-resource', { type, amount }),
    },
    Listeners: {
      add: callback => eventBus.on('add-resource', callback),
    },
  },

  Upgrades: {
    Emit: {
      purchase: upgradeDef => eventBus.emit('purchase-upgrade', upgradeDef),
    },
    Listeners: {
      purchase: callback => eventBus.on('purchase-upgrade', callback),
    },
  },

  Save: {
    Emit: {
      restorePlayer: playerData =>
        eventBus.emit('restore-player-state', playerData),
      restoreShip: shipData => eventBus.emit('restore-ship-state', shipData),
      restoreStory: storyData =>
        eventBus.emit('restore-story-state', storyData),
    },
    Listeners: {
      restorePlayer: callback => eventBus.on('restore-player-state', callback),
      restoreShip: callback => eventBus.on('restore-ship-state', callback),
      restoreStory: callback => eventBus.on('restore-story-state', callback),
    },
  },
};
