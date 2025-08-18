// src/world/ship/section-room-queue.js
export class SectionRoomQueue {
  constructor(sectionDefinition, roomFactory) {
    this.sectionDef = sectionDefinition;
    this.roomFactory = roomFactory;
    this.roomQueue = []; // Single queue with all rooms mixed
    this.roomCounts = new Map(); // Track how many of each room type we've used
    this.excludedRooms = new Set(sectionDefinition.excludeRooms || []);
  }

  async initialize() {
    console.log(`Initializing room queue for section: ${this.sectionDef.name}`);

    // Generate all rooms and mix them together
    await this.generateMixedRoomQueue();

    console.log(`Room queue initialized: ${this.roomQueue.length} total rooms`);
  }

  async generateMixedRoomQueue() {
    const targetRoomCount = this.getRandomRoomCount();
    const requiredRooms = [...this.sectionDef.requiredRooms];
    const themeRooms = [];

    console.log(
      `Target room count: ${targetRoomCount}, required rooms: ${requiredRooms.length}`
    );

    // Generate theme rooms first (excluding required rooms from count)
    const themeRoomCount = targetRoomCount - requiredRooms.length;

    for (let i = 0; i < themeRoomCount; i++) {
      const roomConfig = this.selectWeightedRoom();

      if (!roomConfig) break;

      const currentCount = this.roomCounts.get(roomConfig.id) || 0;

      if (currentCount >= roomConfig.maxCount) {
        continue; // Skip if we've hit the max for this room type
      }

      try {
        const room = this.roomFactory.createRoom(roomConfig.id);

        room.sectionType = this.sectionDef.theme;
        room.sectionId = this.sectionDef.id;
        themeRooms.push({ room, priority: Math.random() });

        this.roomCounts.set(roomConfig.id, currentCount + 1);
        console.log(
          `Generated theme room: ${roomConfig.id} (${currentCount + 1}/${roomConfig.maxCount})`
        );
      } catch (error) {
        console.error(`Failed to create theme room ${roomConfig.id}:`, error);
      }
    }

    // Create required rooms with assigned priorities
    const requiredRoomObjects = [];

    for (let i = 0; i < requiredRooms.length; i++) {
      const roomId = requiredRooms[i];

      try {
        const room = this.roomFactory.createRoom(roomId);

        room.sectionType = this.sectionDef.theme;
        room.sectionId = this.sectionDef.id;

        // Assign priorities for mixing
        let priority;

        if (roomId === 'spawn') {
          priority = 0; // Always first
        } else if (roomId === 'shipComplete') {
          priority = 1000; // Always last
        } else if (roomId === 'neuralInterface') {
          priority = 500 + Math.random() * 100; // Later in the sequence but not last
        } else {
          priority = 100 + Math.random() * 300; // Mixed throughout
        }

        requiredRoomObjects.push({ room, priority });
        console.log(
          `Generated required room: ${roomId} with priority ${priority}`
        );
      } catch (error) {
        console.error(`Failed to create required room ${roomId}:`, error);
      }
    }

    // Combine all rooms and sort by priority
    const allRooms = [...requiredRoomObjects, ...themeRooms];

    allRooms.sort((a, b) => a.priority - b.priority);

    // Extract the sorted rooms
    this.roomQueue = allRooms.map(item => item.room);

    console.log(
      `Room queue order: ${this.roomQueue.map(r => r.id || r.constructor.name).join(' -> ')}`
    );
  }

  selectWeightedRoom() {
    const availableRooms = this.sectionDef.roomPool.filter(roomConfig => {
      // Check if room is excluded
      if (this.excludedRooms.has(roomConfig.id)) {
        return false;
      }

      // Check if we've reached max count for this room type
      const currentCount = this.roomCounts.get(roomConfig.id) || 0;

      return currentCount < roomConfig.maxCount;
    });

    if (availableRooms.length === 0) {
      return null;
    }

    const totalWeight = availableRooms.reduce(
      (sum, room) => sum + room.weight,
      0
    );
    const random = Math.random() * totalWeight;
    let weightSum = 0;

    for (const roomConfig of availableRooms) {
      weightSum += roomConfig.weight;
      if (random <= weightSum) {
        return roomConfig;
      }
    }

    return availableRooms[0]; // Fallback
  }

  getRandomRoomCount() {
    const min = this.sectionDef.roomCount.min;
    const max = this.sectionDef.roomCount.max;

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getNextRoom() {
    return this.roomQueue.shift() || null;
  }

  getAlternativeRoom() {
    // Try to generate a different room if placement failed
    const roomConfig = this.selectWeightedRoom();

    if (!roomConfig) {
      return null;
    }

    try {
      const room = this.roomFactory.createRoom(roomConfig.id);

      room.sectionType = this.sectionDef.theme;
      room.sectionId = this.sectionDef.id;

      // Update count tracking
      const currentCount = this.roomCounts.get(roomConfig.id) || 0;

      this.roomCounts.set(roomConfig.id, currentCount + 1);

      return room;
    } catch (error) {
      console.error(
        `Failed to create alternative room ${roomConfig.id}:`,
        error
      );

      return null;
    }
  }

  // Utility methods
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  getRemainingRoomCount() {
    return this.roomQueue.length;
  }

  getSectionTheme() {
    return this.sectionDef.theme;
  }

  getSectionInfo() {
    return {
      id: this.sectionDef.id,
      name: this.sectionDef.name,
      theme: this.sectionDef.theme,
      description: this.sectionDef.description,
    };
  }
}
