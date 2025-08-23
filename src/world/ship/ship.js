// src/world/ship/ship.js - Fix room factory initialization
import { SectionGenerator } from './section-generator.js';
import { roomFactory } from '../rooms/room-factory.js';
import { getStats } from '../../entities/player/player-stats.js';
import { Directions } from '../../utils/index.js';
import { GameEvents } from '../../core/game-events.js';
import { SectionMap } from './section-map.js';

export class Ship {
  constructor(width, height, type = 'colony', sectionId = 'ENGINEERING_CORE') {
    this.width = width;
    this.height = height;
    this.type = type;
    this.currentSection = sectionId;
    this.completedSections = new Set();
    this.sectionProgress = new Map(); // Track progress per section

    this.sectionGenerator = new SectionGenerator();
    this.map = null; // Will be SectionMap instead of ShipMap
    this.isRestored = false;

    // Listen for save/restore events
    GameEvents.Save.Listeners.restoreShip(shipData => {
      this.restoreState(shipData);
    });

    // Listen for section transition events
    this.setupSectionTransitionListeners();
  }

  setupSectionTransitionListeners() {
    // Listen for neural interface activation
    GameEvents.Game.Listeners.enterMindSpace(() => {
      this.handleMindSpaceEntry();
    });

    // Listen for section completion
    GameEvents.Game.Listeners.sectionComplete(sectionId => {
      this.handleSectionCompletion(sectionId);
    });
  }

  async initializeSection(sectionId = null, saveData = null) {
    const targetSection = sectionId || this.currentSection;

    console.log(`Initializing section: ${targetSection}`, {
      sectionId: targetSection,
      hasSaveData: !!saveData,
      saveDataSectionId: saveData?.sectionData?.sectionId,
      saveDataCurrentSection: saveData?.currentSection,
    });

    try {
      console.log('Loading room definitions...');
      await roomFactory.loadRoomDefinitions();

      console.log('Initializing section generator...');
      await this.sectionGenerator.initialize(roomFactory);

      if (
        saveData &&
        saveData.sectionData &&
        (saveData.sectionData.sectionId === targetSection ||
          saveData.currentSection === targetSection)
      ) {
        // Restore from save
        console.log('Restoring section from save data');
        this.map = await this.restoreSectionFromSave(saveData);
      } else {
        // Generate new section
        console.log('Generating new section');
        this.map = await this.sectionGenerator.generateSection(targetSection);
      }

      // Update current section
      this.currentSection = targetSection;

      console.log(`Section ${targetSection} initialized successfully`);

      return true;
    } catch (error) {
      console.error(`Failed to initialize section ${targetSection}:`, error);
      throw error;
    }
  }

  async transitionToSection(newSectionId) {
    console.log(`Transitioning from ${this.currentSection} to ${newSectionId}`);

    try {
      // Mark current section as complete
      this.completedSections.add(this.currentSection);

      // Store current section progress
      if (this.map) {
        this.sectionProgress.set(
          this.currentSection,
          this.map.getCompletionProgress()
        );
      }

      // Generate and transition to new section
      await this.initializeSection(newSectionId);

      // Emit section change event
      GameEvents.Game.Emit.message(
        `Entering ${this.map.getSectionInfo().name}...`
      );
      GameEvents.Ship.Emit.sectionChanged({
        from: this.currentSection,
        to: newSectionId,
        completedSections: Array.from(this.completedSections),
      });
      const spawnPoint = this.getSpawnPoint();

      GameEvents.Player.Emit.move(spawnPoint.x, spawnPoint.y, { x: 0, y: 1 });
      GameEvents.Player.Emit.updateSpawn(spawnPoint);

      return true;
    } catch (error) {
      console.error(`Failed to transition to section ${newSectionId}:`, error);

      return false;
    }
  }

  handleMindSpaceEntry() {
    console.log('Handling mind space entry...');

    // Check if current section is sufficiently complete
    const progress = this.getCurrentSectionProgress();
    const requiredProgress = 75; // Require 75% completion

    if (progress.overall < requiredProgress) {
      GameEvents.Game.Emit.message(
        `Neural pathways incomplete. Section progress: ${progress.overall}%. Continue exploring.`
      );

      return false;
    }

    // Check if there's a next section
    const nextSection = this.sectionGenerator.getNextSection(
      this.currentSection
    );

    if (!nextSection) {
      // This is the final section - handle ship completion
      this.handleShipCompletion();

      return true;
    }

    // Transition to next section
    setTimeout(() => {
      this.transitionToSection(nextSection);
    }, 3000);

    return true;
  }

  handleSectionCompletion(sectionId) {
    console.log(`Section completed: ${sectionId}`);
    this.completedSections.add(sectionId);

    // Update progress tracking
    if (this.map && this.currentSection === sectionId) {
      this.sectionProgress.set(sectionId, this.map.getCompletionProgress());
    }

    // Check if all sections are complete
    const allSections = this.sectionGenerator.getSectionProgression();

    if (this.completedSections.size >= allSections.length) {
      this.handleShipCompletion();
    }
  }

  handleShipCompletion() {
    console.log('Ship awakening complete!');

    GameEvents.Game.Emit.message(
      'Ship consciousness fully awakened. All systems online. Ready for deep space exploration.'
    );

    // Emit ship completion event
    GameEvents.Ship.Emit.awakeningComplete({
      completedSections: Array.from(this.completedSections),
      totalProgress: this.getTotalProgress(),
    });
  }

  getCurrentSectionProgress() {
    if (!this.map) {
      return { exploration: 0, overall: 0 };
    }

    return this.map.getCompletionProgress();
  }

  getTotalProgress() {
    const allSections = this.sectionGenerator.getSectionProgression();
    const completed = this.completedSections.size;
    const total = allSections.length;

    return {
      completedSections: completed,
      totalSections: total,
      percentage: Math.round((completed / total) * 100),
    };
  }

  // Original Ship interface methods (updated for sections)
  getSpawnPoint() {
    if (!this.map) {
      return { x: 0, y: 0 };
    }

    return this.map.getSpawnPoint();
  }

  revealAreaAroundPlayer(x, y, radius) {
    if (this.map) {
      this.map.revealAreaAroundPlayer(x, y, radius);
    }
  }

  canMoveTo(x, y, direction) {
    if (!this.map) return false;

    if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) {
      return false;
    }

    const tile = this.map.getTile(x, y);

    if (!tile || !tile.passable) {
      return false;
    }

    const player = getStats();
    const currentTile = this.map.getTile(player.x, player.y);

    if (!currentTile) return false;

    // Check walls/doors in the direction of movement
    switch (direction) {
      case Directions.RIGHT:
        if (currentTile.getSlot('right')?.passable === false) return false;
        if (tile.getSlot('left')?.passable === false) return false;
        break;
      case Directions.LEFT:
        if (currentTile.getSlot('left')?.passable === false) return false;
        if (tile.getSlot('right')?.passable === false) return false;
        break;
      case Directions.DOWN:
        if (currentTile.getSlot('bottom')?.passable === false) return false;
        if (tile.getSlot('top')?.passable === false) return false;
        break;
      case Directions.UP:
        if (currentTile.getSlot('top')?.passable === false) return false;
        if (tile.getSlot('bottom')?.passable === false) return false;
        break;
    }

    return true;
  }

  attemptInteract(targetX, targetY) {
    if (!this.map) return;

    const tile = this.map.getTile(targetX, targetY);

    if (!tile) return;

    if (typeof tile.onInteract === 'function') {
      tile.onInteract();
    }

    if (tile.object && typeof tile.object.onInteract === 'function') {
      tile.object.onInteract();
    }
  }

  // Save/Load methods
  getSaveState() {
    const baseState = {
      width: this.width,
      height: this.height,
      type: this.type,
      currentSection: this.currentSection,
      completedSections: Array.from(this.completedSections),
      sectionProgress: Object.fromEntries(this.sectionProgress),
    };

    if (this.map) {
      baseState.sectionData = this.map.getSaveState();
    }

    return baseState;
  }

  restoreState(shipData) {
    console.log('Restoring ship state...');

    if (!shipData) {
      console.log('No ship data to restore');

      return;
    }

    this.isRestored = true;

    // Restore basic ship properties
    this.width = shipData.width || this.width;
    this.height = shipData.height || this.height;
    this.type = shipData.type || this.type;
    this.currentSection = shipData.currentSection || this.currentSection;

    // Restore completed sections
    if (shipData.completedSections) {
      this.completedSections = new Set(shipData.completedSections);
    }

    // Restore section progress
    if (shipData.sectionProgress) {
      this.sectionProgress = new Map(Object.entries(shipData.sectionProgress));
    }

    // The actual section data will be restored during initializeSection
    console.log(
      `Ship state restored: current section ${this.currentSection}, ${this.completedSections.size} completed sections`
    );
  }

  async restoreSectionFromSave(saveData) {
    console.log('Restoring section from save data:', saveData);

    if (!saveData || !saveData.sectionData) {
      console.log('No section data found in save, generating new section');

      return await this.sectionGenerator.generateSection(
        saveData?.sectionId || this.currentSection
      );
    }

    try {
      const sectionId = saveData.sectionData.sectionId || this.currentSection;

      const sectionDef = this.sectionGenerator.getSectionDefinition(sectionId);

      if (!sectionDef) {
        console.warn(
          `No section definition found for ${sectionId}, falling back to generation`
        );

        return await this.sectionGenerator.generateSection(sectionId);
      }

      const restoredMap = new SectionMap(
        saveData.sectionData.width || this.width,
        saveData.sectionData.height || this.height,
        sectionDef
      );

      await restoredMap.restoreFromSave(saveData.sectionData);

      console.log('Section successfully restored from save data');

      return restoredMap;
    } catch (error) {
      console.error('Failed to restore section from save data:', error);
      console.log('Falling back to generating new section');

      return await this.sectionGenerator.generateSection(
        saveData?.sectionId || this.currentSection
      );
    }
  }

  // Utility methods
  getSectionInfo() {
    if (!this.map) return null;

    return this.map.getSectionInfo();
  }

  getAvailableSections() {
    return this.sectionGenerator.getSectionProgression();
  }

  isCurrentSectionComplete() {
    const progress = this.getCurrentSectionProgress();

    return progress.overall >= 75; // 75% completion threshold
  }

  canAccessNextSection() {
    return (
      this.isCurrentSectionComplete() &&
      this.sectionGenerator.getNextSection(this.currentSection) !== null
    );
  }
}
