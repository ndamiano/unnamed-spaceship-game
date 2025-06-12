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
  const minSpacing = 1;

  const sides = [
    {
      name: "top",
      condition: (r) => r.y > targetRoom.height + minSpacing,
      calc: (r) => {
        const x = randomInt(r.x + 1, r.x + r.width - 2);
        return {
          x: x - Math.floor(targetRoom.width / 2),
          y: r.y - targetRoom.height - minSpacing,
          doorX: x,
          doorY: r.y - 1,
        };
      },
    },
    {
      name: "bottom",
      condition: (r) =>
        r.y + r.height + targetRoom.height + minSpacing < maxHeight,
      calc: (r) => {
        const x = randomInt(r.x + 1, r.x + r.width - 2);
        return {
          x: x - Math.floor(targetRoom.width / 2),
          y: r.y + r.height + minSpacing,
          doorX: x,
          doorY: r.y + r.height,
        };
      },
    },
    {
      name: "left",
      condition: (r) => r.x > targetRoom.width + minSpacing,
      calc: (r) => {
        const y = randomInt(r.y + 1, r.y + r.height - 2);
        return {
          x: r.x - targetRoom.width - minSpacing,
          y: y - Math.floor(targetRoom.height / 2),
          doorX: r.x - 1,
          doorY: y,
        };
      },
    },
    {
      name: "right",
      condition: (r) =>
        r.x + r.width + targetRoom.width + minSpacing < maxWidth,
      calc: (r) => {
        const y = randomInt(r.y + 1, r.y + r.height - 2);
        return {
          x: r.x + r.width + minSpacing,
          y: y - Math.floor(targetRoom.height / 2),
          doorX: r.x + r.width,
          doorY: y,
        };
      },
    },
  ];

  for (const existingRoom of rooms) {
    for (const side of sides) {
      if (side.condition(existingRoom)) {
        const pos = side.calc(existingRoom);
        pos.connectingRoom = existingRoom;
        positions.push(pos);
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
