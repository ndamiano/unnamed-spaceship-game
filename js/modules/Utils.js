export const Directions = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

function roomsOverlap(a, b, spacing = 0) {
  return (
    a.x <= b.x + b.width + spacing &&
    a.x + a.width + spacing >= b.x &&
    a.y <= b.y + b.height + spacing &&
    a.y + a.height + spacing >= b.y
  );
}

function areRoomsAdjacent(a, b) {
  return (
    a.x + a.width + 1 === b.x || // Right side
    b.x + b.width + 1 === a.x || // Left side
    a.y + a.height + 1 === b.y || // Bottom side
    b.y + b.height + 1 === a.y // Top side
  );
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getPossibleDoorPositions(targetRoom, rooms, maxHeight, maxWidth) {
  const positions = [];

  for (const existingRoom of rooms) {
    // Check each potential door position in the existing room
    for (const potentialDoor of existingRoom.potentialDoors) {
      const absX = existingRoom.x + potentialDoor.x;
      const absY = existingRoom.y + potentialDoor.y;

      for (const targetPotentialDoor of targetRoom.potentialDoors) {
        let newRoomX = absX - targetPotentialDoor.x;
        let newRoomY = absY - targetPotentialDoor.y;

        // Check if new position is within bounds
        if (
          newRoomX >= 0 &&
          newRoomX + targetRoom.width <= maxWidth &&
          newRoomY >= 0 &&
          newRoomY + targetRoom.height <= maxHeight &&
          !roomsOverlap(
            {
              x: newRoomX,
              y: newRoomY,
              width: targetRoom.width,
              height: targetRoom.height,
            },
            existingRoom
          )
        ) {
          positions.push({
            x: newRoomX,
            y: newRoomY,
            doorX: absX,
            doorY: absY,
            connectingRoom: existingRoom,
          });
        }
      }
    }
  }

  return positions.filter((pos) => {
    const testRoom = {
      x: pos.x,
      y: pos.y,
      width: targetRoom.width,
      height: targetRoom.height,
    };
    return !rooms.some((r) => roomsOverlap(testRoom, r));
  });
}

export { roomsOverlap, areRoomsAdjacent, randomInt, getPossibleDoorPositions };
