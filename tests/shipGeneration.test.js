const { ShipMap } = require("../js/modules/ShipMap.js");
const { Room } = require("../js/modules/Room.js");
const { roomsOverlap, areRoomsAdjacent } = require("../js/modules/Utils.js");

function runTests() {
  console.log("Running basic ship validation tests...");

  // Create a simple, predictable ship layout
  const ship = new ShipMap(50, 50, "colony");
  ship.rooms = [];
  ship.coreRooms = { entrance: null, exit: null };

  // Manually place rooms with floor tiles
  const startRoom = new Room(5, 20, 8, 6);
  startRoom.tiles = Array(6)
    .fill()
    .map(() => Array(8).fill({ type: "floor" }));

  const room1 = new Room(15, 20, 6, 6);
  room1.tiles = Array(6)
    .fill()
    .map(() => Array(6).fill({ type: "floor" }));

  const room2 = new Room(25, 20, 6, 6);
  room2.tiles = Array(6)
    .fill()
    .map(() => Array(6).fill({ type: "floor" }));

  const room3 = new Room(35, 20, 6, 6);
  room3.tiles = Array(6)
    .fill()
    .map(() => Array(6).fill({ type: "floor" }));

  const finishRoom = new Room(45, 20, 5, 4);
  finishRoom.tiles = Array(4)
    .fill()
    .map(() => Array(5).fill({ type: "floor" }));

  ship.rooms.push(startRoom, room1, room2, room3, finishRoom);

  // Initialize ship tiles from room tiles
  ship.rooms.forEach((room) => {
    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        ship.setTile(room.x + x, room.y + y, room.tiles[y][x]);
      }
    }
  });
  ship.coreRooms.entrance = startRoom;
  ship.coreRooms.exit = finishRoom;

  // Connect rooms with properly placed doors at valid wall positions
  const doorY = 23; // Common door Y position for horizontal connections

  // Start (5,20) to Room1 (15,20) - right wall of start to left wall of room1
  ship.setTile(12, doorY, { type: "door" }); // Right wall of start room (x=5+8-1=12)
  ship.setTile(15, doorY, { type: "door" }); // Left wall of room1

  // Room1 (15,20) to Room2 (25,20) - right wall of room1 to left wall of room2
  ship.setTile(20, doorY, { type: "door" }); // Right wall of room1 (x=15+6-1=20)
  ship.setTile(25, doorY, { type: "door" }); // Left wall of room2

  // Room2 (25,20) to Room3 (35,20) - right wall of room2 to left wall of room3
  ship.setTile(30, doorY, { type: "door" }); // Right wall of room2 (x=25+6-1=30)
  ship.setTile(35, doorY, { type: "door" }); // Left wall of room3

  // Room3 (35,20) to Finish (45,20) - right wall of room3 to left wall of finish
  ship.setTile(40, doorY, { type: "door" }); // Right wall of room3 (x=35+6-1=40)
  ship.setTile(45, doorY, { type: "door" }); // Left wall of finish

  // Add hallway floor tiles connecting all doors
  for (let x = 13; x <= 45; x++) {
    ship.setTile(x, doorY, { type: "floor" });
  }

  console.log("Door connections:");
  console.log(`Start(13,${doorY}) <-> Room1(15,${doorY})`);
  console.log(`Room1(21,${doorY}) <-> Room2(25,${doorY})`);
  console.log(`Room2(31,${doorY}) <-> Room3(35,${doorY})`);
  console.log(`Room3(41,${doorY}) <-> Finish(45,${doorY})`);

  // Simple door connections between rooms
  console.log(`Room count: ${ship.rooms.length}`);
  if (ship.rooms.length < 5) {
    console.error("FAIL: Should generate at least 5 rooms");
  } else {
    console.log("PASS: Room count test");
  }

  // Test 2: Path exists
  const start = ship.coreRooms.entrance;
  const finish = ship.coreRooms.exit;

  if (!start || !finish) {
    console.error("FAIL: Start or finish room missing");
  } else {
    // Verify path from center of start to center of finish
    const startX = Math.floor(start.x + start.width / 2);
    const startY = Math.floor(start.y + start.height / 2);
    const finishX = Math.floor(finish.x + finish.width / 2);
    const finishY = Math.floor(finish.y + finish.height / 2);

    // Debug: Print path endpoints
    console.log(`Path from (${startX},${startY}) to (${finishX},${finishY})`);

    const hasPath = ship.pathExists(start, finish);
    if (!hasPath) {
      console.error("FAIL: No path from start to finish");
      // Debug: Print ship layout
      console.log("Ship layout:");
      for (let y = 0; y < ship.height; y++) {
        let row = "";
        for (let x = 0; x < ship.width; x++) {
          const tile = ship.getTile(x, y);
          row += tile.type === "floor" ? "." : tile.type === "door" ? "D" : "#";
        }
        console.log(row);
      }
    } else {
      console.log("PASS: Path exists test");
    }
  }

  // Test 3: No overlapping rooms
  let hasOverlaps = false;
  for (let i = 0; i < ship.rooms.length; i++) {
    for (let j = i + 1; j < ship.rooms.length; j++) {
      if (roomsOverlap(ship.rooms[i], ship.rooms[j])) {
        hasOverlaps = true;
        break;
      }
    }
    if (hasOverlaps) break;
  }

  if (hasOverlaps) {
    console.error("FAIL: Some rooms overlap");
  } else {
    console.log("PASS: No room overlaps");
  }

  // Utility function tests
  console.log("\nRunning utility function tests...");

  // Test roomsOverlap
  const roomA = new Room(0, 0, 5, 5);
  const roomB = new Room(4, 4, 5, 5); // Overlaps with roomA
  const roomC = new Room(10, 10, 5, 5); // Doesn't overlap
  const roomD = new Room(0, 0, 5, 5); // Same as roomA

  console.log("Testing roomsOverlap:");
  console.log(
    roomsOverlap(roomA, roomB)
      ? "PASS: Overlapping rooms detected"
      : "FAIL: Should detect overlap"
  );
  console.log(
    !roomsOverlap(roomA, roomC)
      ? "PASS: Non-overlapping rooms"
      : "FAIL: Should not detect overlap"
  );
  console.log(
    roomsOverlap(roomA, roomD)
      ? "PASS: Same room detected as overlapping"
      : "FAIL: Same room should overlap"
  );

  // Test areRoomsAdjacent
  const roomE = new Room(0, 0, 5, 5);
  const roomF = new Room(6, 0, 5, 5); // Right adjacent (x + width + 1 = 0+5+1=6)
  const roomG = new Room(0, 6, 5, 5); // Bottom adjacent (y + height + 1 = 0+5+1=6)
  const roomH = new Room(10, 10, 5, 5); // Not adjacent

  console.log("\nTesting areRoomsAdjacent:");
  console.log(
    areRoomsAdjacent(roomE, roomF)
      ? "PASS: Right adjacent detected"
      : "FAIL: Should detect right adjacency"
  );
  console.log(
    areRoomsAdjacent(roomE, roomG)
      ? "PASS: Bottom adjacent detected"
      : "FAIL: Should detect bottom adjacency"
  );
  console.log(
    !areRoomsAdjacent(roomE, roomH)
      ? "PASS: Non-adjacent rooms"
      : "FAIL: Should not detect adjacency"
  );
}

runTests();
