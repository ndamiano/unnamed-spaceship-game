export const Directions = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

function roomsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
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

  const isInBounds = ({ x, y, width, height }) =>
    x >= 0 && y >= 0 && x + width <= maxWidth && y + height <= maxHeight;

  const hasOverlap = (proposed) => rooms.some((r) => roomsOverlap(proposed, r));

  for (const existingRoom of rooms) {
    for (const sourceDoor of existingRoom.potentialDoors) {
      // room is at 50, 50, door is at 0, 2 (on the left side)
      const absSourceX = existingRoom.x + sourceDoor.x;
      const absSourceY = existingRoom.y + sourceDoor.y;
      // absSourceX = 50
      // absSourceY = 52

      for (const targetDoor of targetRoom.potentialDoors) {
        if (!doorsAreCompatible(sourceDoor.side, targetDoor.side)) {
          continue;
        }
        // targetRoom = width = 5, height = 5
        // targetDoor = 4, 3 (on the right side)

        // Calculate new room position to align doors
        let newRoomX, newRoomY;

        // Calculate meeting point where doors should connect
        let meetingX = absSourceX;
        let meetingY = absSourceY;

        // Position new room based on door side
        switch (targetDoor.side) {
          case "left":
            meetingX = meetingX + 1;
            newRoomX = meetingX;
            newRoomY = meetingY - targetDoor.y;
            break;
          case "right":
            newRoomX = meetingX - targetRoom.width;
            newRoomY = meetingY - targetDoor.y;
            meetingX = meetingX - 1;
            break;
          case "top":
            meetingY = meetingY + 1;
            newRoomX = meetingX - targetDoor.x;
            newRoomY = meetingY;
            break;
          case "bottom":
            meetingY = meetingY - 1;
            newRoomX = meetingX - targetDoor.x;
            newRoomY = meetingY - (targetRoom.height - 1);
            break;
        }

        const proposedRoom = {
          x: newRoomX,
          y: newRoomY,
          width: targetRoom.width,
          height: targetRoom.height,
        };

        if (!isInBounds(proposedRoom)) {
          continue;
        }
        if (hasOverlap(proposedRoom)) {
          continue;
        }

        positions.push({
          x: newRoomX,
          y: newRoomY,
          existingDoor: {
            x: absSourceX,
            y: absSourceY,
            orientation: sourceDoor.side,
          },
          targetDoor: {
            x: meetingX,
            y: meetingY,
            orientation: targetDoor.side,
          },
          connectingRoom: existingRoom,
        });
      }
    }
  }
  return positions;
}

function doorsAreCompatible(sourceSide, targetSide) {
  const opposites = {
    left: "right",
    right: "left",
    top: "bottom",
    bottom: "top",
  };
  return opposites[sourceSide] === targetSide;
}

export { roomsOverlap, areRoomsAdjacent, randomInt, getPossibleDoorPositions };
