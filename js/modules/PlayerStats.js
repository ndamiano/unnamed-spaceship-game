let playerInstance = null;

function getStats() {
  if (!playerInstance) {
    throw new Error("Player instance not registered with PlayerStats");
  }

  return Object.freeze({
    x: playerInstance.x,
    y: playerInstance.y,
    battery: playerInstance.battery,
    maxBattery: playerInstance.maxBattery,
    resources: playerInstance.resources,
  });
}

function registerPlayer(player) {
  playerInstance = player;
}

export { getStats, registerPlayer };
