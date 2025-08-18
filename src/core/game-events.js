// src/core/game-events.js - Add section-related events
import { eventBus } from './event-bus.js';

/**
 * Centralized game events with type safety and organized emit/listen structure
 * Updated with section system events
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
      gainBattery: amount => eventBus.emit('player-gain-battery', amount),
      loseBattery: amount => eventBus.emit('player-lose-battery', amount),
      equipPassive: (abilityId, slotIndex) =>
        eventBus.emit('player-equip-passive', { abilityId, slotIndex }),
      unequipPassive: abilityId =>
        eventBus.emit('player-unequip-passive', abilityId),
      teleportToSpawn: () => eventBus.emit('player-teleport-spawn'),
      enterRoom: roomData => eventBus.emit('player-enter-room', roomData),
      passiveEquipped: abilityId =>
        eventBus.emit('passive-equipped', abilityId),
      passiveUnequipped: abilityId =>
        eventBus.emit('passive-unequipped', abilityId),
      updateSpawn: newSpawn => eventBus.emit('update-spawn-point', newSpawn),
    },
    Listeners: {
      move: callback => eventBus.on('player-move', callback),
      updated: callback => eventBus.on('player-updated', callback),
      directionChange: callback =>
        eventBus.on('player-direction-change', callback),
      attemptMove: callback => eventBus.on('attempt-move', callback),
      attemptInteract: callback => eventBus.on('attempt-interact', callback),
      gainBattery: callback => eventBus.on('player-gain-battery', callback),
      loseBattery: callback => eventBus.on('player-lose-battery', callback),
      equipPassive: callback => eventBus.on('player-equip-passive', callback),
      unequipPassive: callback =>
        eventBus.on('player-unequip-passive', callback),
      teleportToSpawn: callback =>
        eventBus.on('player-teleport-spawn', callback),
      enterRoom: callback => eventBus.on('player-enter-room', callback),
      passiveEquipped: callback => eventBus.on('passive-equipped', callback),
      passiveUnequipped: callback =>
        eventBus.on('passive-unequipped', callback),
      updateSpawn: callback => eventBus.on('update-spawn-point', callback),
    },
  },

  Game: {
    Emit: {
      message: text => eventBus.emit('game-message', text),
      initialized: () => eventBus.emit('game-initialized'),
      resetState: () => eventBus.emit('reset-state'),
      resumed: () => eventBus.emit('game-resumed'),
      refreshNearestFabricator: () =>
        eventBus.emit('refresh-nearest-fabricator'),
      revealCurrentRoom: () => eventBus.emit('reveal-current-room'),

      // Section system events
      enterMindSpace: () => eventBus.emit('enter-mind-space'),
      sectionComplete: sectionId =>
        eventBus.emit('section-complete', sectionId),
      sectionTransition: data => eventBus.emit('section-transition', data),
    },
    Listeners: {
      message: callback => eventBus.on('game-message', callback),
      initialized: callback => eventBus.on('game-initialized', callback),
      resetState: callback => eventBus.on('reset-state', callback),
      resumed: callback => eventBus.on('game-resumed', callback),
      refreshNearestFabricator: callback =>
        eventBus.on('refresh-nearest-fabricator', callback),
      revealCurrentRoom: callback =>
        eventBus.on('reveal-current-room', callback),

      // Section system listeners
      enterMindSpace: callback => eventBus.on('enter-mind-space', callback),
      sectionComplete: callback => eventBus.on('section-complete', callback),
      sectionTransition: callback =>
        eventBus.on('section-transition', callback),
    },
  },

  Ship: {
    Emit: {
      sectionChanged: data => eventBus.emit('ship-section-changed', data),
      awakeningComplete: data => eventBus.emit('ship-awakening-complete', data),
      progressUpdate: data => eventBus.emit('ship-progress-update', data),
    },
    Listeners: {
      sectionChanged: callback => eventBus.on('ship-section-changed', callback),
      awakeningComplete: callback =>
        eventBus.on('ship-awakening-complete', callback),
      progressUpdate: callback => eventBus.on('ship-progress-update', callback),
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
      openUpgrades: data => eventBus.emit('open-upgrade-menu', data),
      openSaveManager: () => eventBus.emit('open-save-manager'),
      openPassiveEquipment: () => eventBus.emit('open-passive-equipment'),
      enableMinimap: () => eventBus.emit('enable-minimap'),
      toggleMinimap: () => eventBus.emit('toggle-minimap'),
    },
    Listeners: {
      openUpgrades: callback => eventBus.on('open-upgrade-menu', callback),
      openSaveManager: callback => eventBus.on('open-save-manager', callback),
      openPassiveEquipment: callback =>
        eventBus.on('open-passive-equipment', callback),
      enableMinimap: callback => eventBus.on('enable-minimap', callback),
      toggleMinimap: callback => eventBus.on('toggle-minimap', callback),
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
