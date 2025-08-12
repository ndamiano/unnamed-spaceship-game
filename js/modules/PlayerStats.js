let playerInstance = null;

function getStats() {
  if (!playerInstance) {
    throw new Error('Player instance not registered with PlayerStats');
  }

  return Object.freeze({
    x: playerInstance.x,
    y: playerInstance.y,
    battery: playerInstance.battery,
    maxBattery: playerInstance.maxBattery,
    harvestMultiplier: playerInstance.harvestMultiplier,
    movementCost: playerInstance.movementCost,
    resources: playerInstance.resources,
    getUpgradeCount: upgradeId => playerInstance.upgrades.get(upgradeId) || 0,
  });
}

function registerPlayer(player) {
  playerInstance = player;
}

export { getStats, registerPlayer };
