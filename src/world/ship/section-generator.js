// src/world/ship/section-generator.js
import { SectionMap } from './section-map.js';
import { SectionRoomQueue } from './section-room-queue.js';

export class SectionGenerator {
  constructor() {
    this.sectionDefinitions = null;
    this.roomFactory = null;
    this.loadPromise = null;
  }

  async initialize(roomFactory) {
    this.roomFactory = roomFactory;

    if (!this.sectionDefinitions) {
      await this.loadSectionDefinitions();
    }

    console.log('Section generator initialized');
  }

  async loadSectionDefinitions() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = fetch('./src/config/section-definitions.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      })
      .then(data => {
        this.sectionDefinitions = data;
        console.log('Section definitions loaded successfully');

        return data;
      })
      .catch(error => {
        console.error('Failed to load section definitions:', error);
        throw error;
      });

    return this.loadPromise;
  }

  getSectionDefinitions() {
    if (!this.sectionDefinitions) {
      throw new Error(
        'Section definitions not loaded yet. Call initialize() first.'
      );
    }

    return this.sectionDefinitions;
  }

  getSectionDefinition(sectionId) {
    const definitions = this.getSectionDefinitions();

    return definitions.sections[sectionId] || null;
  }

  async generateSection(sectionId, _existingProgress = null) {
    const sectionDef = this.getSectionDefinition(sectionId);

    if (!sectionDef) {
      throw new Error(`Unknown section: ${sectionId}`);
    }

    console.log(`Generating section: ${sectionDef.name}`);

    const sectionMap = new SectionMap(
      sectionDef.sectionSize.width,
      sectionDef.sectionSize.height,
      sectionDef
    );

    // Generate rooms based on section definition
    await this.populateSection(sectionMap, sectionDef);

    console.log(
      `Section generation complete: ${sectionMap.rooms.length} rooms placed`
    );

    return sectionMap;
  }

  async populateSection(sectionMap, sectionDef) {
    const roomQueue = new SectionRoomQueue(sectionDef, this.roomFactory);

    await roomQueue.initialize();

    console.log('Placing rooms in priority order...');
    let placedCount = 0;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loops
    const requiredRooms = new Set(sectionDef.requiredRooms);
    const placedRequiredRooms = new Set();

    let nextRoom = roomQueue.getNextRoom();

    while (
      nextRoom &&
      sectionMap.canPlaceMoreRooms() &&
      attempts < maxAttempts
    ) {
      if (sectionMap.placeRoom(nextRoom)) {
        placedCount++;
        console.log(
          `Placed room: ${nextRoom.id || nextRoom.constructor.name} (${placedCount} total)`
        );

        // Track required room placement
        if (requiredRooms.has(nextRoom.id)) {
          placedRequiredRooms.add(nextRoom.id);
        }

        nextRoom = roomQueue.getNextRoom();
      } else {
        console.log(
          `Failed to place room: ${nextRoom.id || nextRoom.constructor.name}, trying alternative...`
        );
        // Try an alternative room if placement failed
        nextRoom = roomQueue.getAlternativeRoom();
        if (!nextRoom) {
          // If no alternative available, get next room from queue
          nextRoom = roomQueue.getNextRoom();
        }
      }

      attempts++;
    }

    // Verify all required rooms were placed
    const missingRequired = [...requiredRooms].filter(
      roomId => !placedRequiredRooms.has(roomId)
    );

    if (missingRequired.length > 0) {
      console.error(
        `CRITICAL: Missing required rooms: ${missingRequired.join(', ')}`
      );
      console.error('Section generation failed - required rooms not placed!');
      throw new Error(
        `Failed to place required rooms: ${missingRequired.join(', ')}`
      );
    }

    if (attempts >= maxAttempts) {
      console.warn(
        'Section generation stopped: maximum placement attempts reached'
      );
    }

    if (roomQueue.getRemainingRoomCount() > 0) {
      console.warn(
        `${roomQueue.getRemainingRoomCount()} rooms could not be placed`
      );
    }

    console.log(
      `Section population complete: ${placedCount} rooms placed in ${attempts} attempts`
    );
    console.log(
      `Required rooms placed: ${[...placedRequiredRooms].join(', ')}`
    );
  }

  // Utility methods
  getAllSectionIds() {
    const definitions = this.getSectionDefinitions();

    return Object.keys(definitions.sections);
  }

  getSectionProgression() {
    // Return the recommended section order
    return [
      'ENGINEERING_CORE',
      'MEDICAL_DISTRICT',
      'HABITAT_MODULE',
      'COMMAND_BRIDGE',
      'CORE_NEXUS',
    ];
  }

  getNextSection(currentSectionId) {
    const progression = this.getSectionProgression();
    const currentIndex = progression.indexOf(currentSectionId);

    if (currentIndex === -1 || currentIndex >= progression.length - 1) {
      return null; // No next section or unknown current section
    }

    return progression[currentIndex + 1];
  }

  isFinalSection(sectionId) {
    const progression = this.getSectionProgression();

    return progression[progression.length - 1] === sectionId;
  }
}
