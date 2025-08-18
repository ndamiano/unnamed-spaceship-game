import { GameEvents } from '../../core/game-events.js';
import { getStats } from '../../entities/player/player-stats.js';
import { ModalFactory } from '../../ui/modal-factory.js';

export const STORY_GROUPS = {
  TUTORIAL: {
    id: 'TUTORIAL',
    name: 'System Initialization',
    icon: '🤖',
    fragments: ['AWAKENING_PROTOCOL'],
  },
  ENGINEERING_LOGS: {
    id: 'ENGINEERING_LOGS',
    name: 'Engineering Department Logs',
    icon: '⚙️',
    fragments: [
      'ENGINEERING_TERMINAL_01',
      'ENGINEERING_TERMINAL_02',
      'ENGINEERING_PERSONAL',
    ],
  },
  MEDICAL_REPORTS: {
    id: 'MEDICAL_REPORTS',
    name: 'Medical Bay Reports',
    icon: '🧊',
    fragments: ['CRYO_CHAMBER_LOG', 'MEDICAL_EMERGENCY', 'QUARANTINE_PROTOCOL'],
  },
  SYSTEM_DIAGNOSTICS: {
    id: 'SYSTEM_DIAGNOSTICS',
    name: 'System Diagnostic Logs',
    icon: '🤖',
    fragments: ['DRONE_POD_MAINTENANCE', 'AI_ANOMALY', 'SYSTEM_CORRUPTION'],
  },
  REVELATION_MEMORIES: {
    id: 'REVELATION_MEMORIES',
    name: 'Core Memory Fragments',
    icon: '🦾',
    fragments: ['ASSEMBLY_ARM_MEMORY', 'ORIGIN_TRUTH', 'FINAL_MESSAGE'],
  },
  PERSONAL_LOGS: {
    id: 'PERSONAL_LOGS',
    name: 'Crew Personal Logs',
    icon: '👤',
    fragments: ['CAPTAIN_FINAL', 'ENGINEER_PERSONAL', 'DOCTOR_CONFESSION'],
  },
};

class StorySystem {
  constructor() {
    this.discoveredFragments = new Set();
    this.discoveredGroups = new Map();
    this.journalEntries = new Map();
    this.currentModal = null;
    this.storyFragments = null;
    this.loadPromise = null;
    this.registeredObjects = new Set();
    this.isRestored = false;
    this.restorationInProgress = false;
    this.journalCleanup = null;

    this.setupEventListeners();
    this.setupModalElements();
  }

  async loadStoryFragments() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = fetch('./src/config/story-fragments.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      })
      .then(data => {
        this.storyFragments = data;
        console.log('Story fragments loaded successfully');

        return data;
      })
      .catch(error => {
        console.error('Failed to load story fragments:', error);
        throw error;
      });

    return this.loadPromise;
  }

  getStoryFragments() {
    if (!this.storyFragments) {
      throw new Error(
        'Story fragments not loaded yet. Call loadStoryFragments() first.'
      );
    }

    return this.storyFragments;
  }

  registerStoryObject(gameObject) {
    console.log(
      'Registering story object:',
      gameObject.objectType,
      'at',
      gameObject.x,
      gameObject.y
    );
    this.registeredObjects.add(gameObject);

    if (!this.restorationInProgress) {
      this.removeDiscoveredFragmentsFromObject(gameObject);
    }
  }

  unregisterStoryObject(gameObject) {
    this.registeredObjects.delete(gameObject);
  }

  removeDiscoveredFragmentsFromObject(gameObject) {
    if (gameObject.availableStoryFragments) {
      for (const fragmentId of this.discoveredFragments) {
        gameObject.availableStoryFragments.delete(fragmentId);
      }

      if (gameObject.availableStoryEvents) {
        gameObject.availableStoryEvents =
          gameObject.availableStoryEvents.filter(
            event =>
              event.type !== 'fragment' ||
              !this.discoveredFragments.has(event.fragmentId)
          );
      }
    }
  }

  removeFragmentFromAllObjects(fragmentId) {
    console.log('Removing fragment from all objects:', fragmentId);
    for (const obj of this.registeredObjects) {
      if (obj.removeStoryFragment) {
        obj.removeStoryFragment(fragmentId);
      } else {
        if (obj.availableStoryFragments) {
          obj.availableStoryFragments.delete(fragmentId);
        }

        if (obj.availableStoryEvents) {
          obj.availableStoryEvents = obj.availableStoryEvents.filter(
            event =>
              event.type !== 'fragment' || event.fragmentId !== fragmentId
          );
        }
      }
    }
  }

  setupEventListeners() {
    GameEvents.Story.Listeners.discovery(data => {
      this.showStoryModal(data.fragmentId);
    });

    GameEvents.Story.Listeners.show(fragmentId => {
      this.showStoryModal(fragmentId);
    });

    GameEvents.Story.Listeners.openJournal(() => {
      this.showJournal();
    });

    GameEvents.Story.Listeners.restoreState(storyData => {
      this.restoreState(storyData);
    });

    GameEvents.Story.Listeners.registerObject(obj => {
      this.registerStoryObject(obj);
    });

    document.addEventListener('keydown', e => {
      if (e.key.toLowerCase() === 'l' && !this.isModalOpen()) {
        GameEvents.Story.Emit.openJournal();
      }
    });
  }

  isModalOpen() {
    const storyModal = document.getElementById('story-modal');
    const upgradeModal = document.getElementById('new-upgrade-modal');
    const journalModal = document.getElementById('journal-modal');

    return (
      (storyModal && storyModal.classList.contains('active')) ||
      (upgradeModal && upgradeModal.classList.contains('active')) ||
      (journalModal && journalModal.classList.contains('active'))
    );
  }

  setupModalElements() {
    this.modal = document.getElementById('story-modal');
    this.titleEl = document.getElementById('story-title');
    this.timestampEl = document.getElementById('story-timestamp');
    this.iconEl = document.getElementById('story-icon');
    this.textEl = document.getElementById('story-text');
    this.closeBtn = document.getElementById('close-story-btn');

    this.closeBtn?.addEventListener('click', () => this.closeStoryModal());

    this.modal?.addEventListener('click', e => {
      if (e.target === this.modal) {
        this.closeStoryModal();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
        this.closeStoryModal();
      }
    });
  }

  checkRequirements(requirements) {
    if (!requirements || Object.keys(requirements).length === 0) {
      return true;
    }

    const playerStats = getStats();

    if (requirements.discoveredFragments) {
      const hasAllRequired = requirements.discoveredFragments.every(
        fragmentId => this.discoveredFragments.has(fragmentId)
      );

      if (!hasAllRequired) return false;
    }

    if (
      requirements.minDiscoveredCount &&
      this.discoveredFragments.size < requirements.minDiscoveredCount
    ) {
      return false;
    }

    if (requirements.upgradeCount) {
      for (const [upgradeId, requiredCount] of Object.entries(
        requirements.upgradeCount
      )) {
        if (playerStats.getUpgradeCount(upgradeId) < requiredCount) {
          return false;
        }
      }
    }

    if (requirements.groupsCompleted) {
      const hasAllCompletedGroups = requirements.groupsCompleted.every(
        groupId => {
          const progress = this.getGroupProgress(groupId);

          return progress.complete;
        }
      );

      if (!hasAllCompletedGroups) return false;
    }

    if (requirements.groupProgress) {
      for (const [groupId, requiredProgress] of Object.entries(
        requirements.groupProgress
      )) {
        const currentProgress = this.getGroupProgress(groupId);

        if (currentProgress.discovered < requiredProgress) {
          return false;
        }
      }
    }

    return true;
  }

  getAvailableFragmentsInGroup(groupId) {
    const group = STORY_GROUPS[groupId];

    if (!group) return [];

    const fragments = this.getStoryFragments();

    return group.fragments.filter(fragmentId => {
      if (this.discoveredFragments.has(fragmentId)) return false;

      const fragment = fragments[fragmentId];

      if (!fragment) return false;

      return this.checkRequirements(fragment.requirements);
    });
  }

  showStoryModal(fragmentId) {
    const fragments = this.getStoryFragments();
    const fragment = fragments[fragmentId];

    if (!fragment) {
      console.error(`Story fragment not found: ${fragmentId}`);

      return;
    }

    // For tutorial fragments, always show them even if already discovered
    const isTutorial = fragment.group === 'TUTORIAL';

    if (!isTutorial && this.discoveredFragments.has(fragmentId)) {
      GameEvents.Game.Emit.message("You've already accessed this information");

      return;
    }

    if (!isTutorial && !this.checkRequirements(fragment.requirements)) {
      GameEvents.Game.Emit.message(
        'Insufficient access credentials for this data'
      );

      return;
    }

    // Only add to discovered if not already there and not tutorial
    if (!this.discoveredFragments.has(fragmentId) && !isTutorial) {
      this.discoveredFragments.add(fragmentId);
      this.journalEntries.set(fragmentId, {
        fragment: fragment,
        discoveredAt: new Date(),
        order: this.journalEntries.size,
      });
      this.currentModal = fragmentId;

      this.removeFragmentFromAllObjects(fragmentId);

      if (fragment.group && fragment.group !== 'TUTORIAL') {
        if (!this.discoveredGroups.has(fragment.group)) {
          this.discoveredGroups.set(fragment.group, []);
        }

        this.discoveredGroups.get(fragment.group).push(fragmentId);
      }
    }

    this.titleEl.textContent = fragment.title;
    this.timestampEl.textContent = fragment.timestamp;
    this.iconEl.textContent = fragment.icon;
    this.textEl.textContent = '';

    this.modal.classList.add('active');

    // Different message for tutorial vs regular story
    if (isTutorial) {
      GameEvents.Game.Emit.message(`System message: ${fragment.title}`);
    } else {
      let message = `Story fragment discovered: ${fragment.title}`;

      if (fragment.group) {
        const groupProgress = this.discoveredGroups.get(fragment.group);
        const totalInGroup = STORY_GROUPS[fragment.group].fragments.length;

        message += ` (${groupProgress.length}/${totalInGroup} in series)`;
      }

      GameEvents.Game.Emit.message(message);
    }

    this.typewriterEffect(fragment.text);
  }

  showJournal() {
    if (this.journalEntries.size === 0) {
      GameEvents.Game.Emit.message('No journal entries found');

      return;
    }

    this.createJournalModal();
    this.populateJournal();

    const journalModal = document.getElementById('journal-modal');

    journalModal.classList.add('active');
  }

  createJournalModal() {
    let journalModal = document.getElementById('journal-modal');

    if (!journalModal) {
      // Use ModalFactory to create the journal modal
      const { modal, closeButtonId } = ModalFactory.createModal({
        id: 'journal-modal',
        icon: '📖',
        title: 'Personal Journal',
        subtitle: 'Discovered Data Fragments',
        contentHTML: '<div class="story-text" id="journal-content"></div>',
        closeButtonId: 'close-journal-btn',
      });

      journalModal = modal;

      // Setup events using the factory
      this.journalCleanup = ModalFactory.setupModalEvents(modal, closeButtonId);
    }
  }

  populateJournal() {
    const journalContent = document.getElementById('journal-content');
    const entries = Array.from(this.journalEntries.values()).sort(
      (a, b) => a.order - b.order
    );

    let content = '';

    const groupedEntries = {};

    entries.forEach(entry => {
      const groupId = entry.fragment.group || 'MISC';

      if (!groupedEntries[groupId]) {
        groupedEntries[groupId] = [];
      }

      groupedEntries[groupId].push(entry);
    });

    Object.entries(groupedEntries).forEach(([groupId, groupEntries]) => {
      const group = STORY_GROUPS[groupId];
      const groupName = group ? group.name : 'Miscellaneous';
      const groupIcon = group ? group.icon : '📄';

      content += `\n${groupIcon} ${groupName}\n${'='.repeat(
        groupName.length + 3
      )}\n\n`;

      groupEntries.forEach(entry => {
        const fragment = entry.fragment;

        content += `${fragment.icon} ${fragment.title}\n`;
        content += `${fragment.timestamp}\n\n`;
        content += `${fragment.text}\n\n`;
        content += `${'─'.repeat(50)}\n\n`;
      });
    });

    journalContent.textContent = content;
  }

  closeStoryModal() {
    this.modal.classList.remove('active');
    this.currentModal = null;

    GameEvents.Game.Emit.resumed();
  }

  typewriterEffect(text) {
    let i = 0;
    const speed = 30;

    const typeInterval = setInterval(() => {
      this.textEl.textContent += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(typeInterval);
      }
    }, speed);
  }

  restoreState(storyData) {
    console.log('Restoring story state:', storyData);

    if (!storyData) {
      console.log('No story data to restore');

      return;
    }

    this.restorationInProgress = true;
    this.isRestored = true;

    if (
      storyData.discoveredFragments &&
      Array.isArray(storyData.discoveredFragments)
    ) {
      this.discoveredFragments = new Set(storyData.discoveredFragments);
      console.log(
        `Restored ${this.discoveredFragments.size} discovered fragments`
      );
    }

    if (storyData.discoveredGroups) {
      this.discoveredGroups = new Map();
      for (const [groupId, fragments] of Object.entries(
        storyData.discoveredGroups
      )) {
        this.discoveredGroups.set(groupId, fragments);
      }
    }

    if (storyData.journalEntries) {
      this.journalEntries = new Map();
      for (const [fragmentId, entryData] of Object.entries(
        storyData.journalEntries
      )) {
        this.journalEntries.set(fragmentId, {
          ...entryData,
          discoveredAt: new Date(entryData.discoveredAt),
        });
      }
    }

    setTimeout(() => {
      console.log(
        'Story restoration complete - cleaning up registered objects'
      );
      for (const obj of this.registeredObjects) {
        this.removeDiscoveredFragmentsFromObject(obj);
      }

      this.restorationInProgress = false;
    }, 100);

    console.log(
      `Story state restored: ${this.discoveredFragments.size} fragments discovered`
    );
    GameEvents.Game.Emit.message(
      `Story progress restored: ${this.discoveredFragments.size} fragments recovered`
    );
  }

  getSaveState() {
    return {
      discoveredFragments: Array.from(this.discoveredFragments),
      discoveredGroups: Object.fromEntries(this.discoveredGroups),
      journalEntries: Object.fromEntries(this.journalEntries),
    };
  }

  hasDiscovered(fragmentId) {
    return this.discoveredFragments.has(fragmentId);
  }

  getDiscoveredCount() {
    return this.discoveredFragments.size;
  }

  getAllDiscovered() {
    return Array.from(this.discoveredFragments);
  }

  getGroupProgress(groupId) {
    const group = STORY_GROUPS[groupId];

    if (!group) return { discovered: 0, total: 0 };

    const discoveredInGroup = group.fragments.filter(id =>
      this.discoveredFragments.has(id)
    ).length;

    return {
      discovered: discoveredInGroup,
      total: group.fragments.length,
      complete: discoveredInGroup === group.fragments.length,
    };
  }

  getAllGroupProgress() {
    return Object.keys(STORY_GROUPS).map(groupId => ({
      groupId,
      name: STORY_GROUPS[groupId].name,
      icon: STORY_GROUPS[groupId].icon,
      ...this.getGroupProgress(groupId),
    }));
  }

  requestStoryFromGroup(groupId) {
    const availableFragments = this.getAvailableFragmentsInGroup(groupId);

    if (availableFragments.length === 0) {
      return null;
    }

    return availableFragments[0];
  }

  getJournalEntryCount() {
    return this.journalEntries.size;
  }

  destroy() {
    if (this.journalCleanup) {
      this.journalCleanup();
    }
  }
}

const storySystem = new StorySystem();

export { storySystem };
