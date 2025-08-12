import { eventBus } from "./EventBus.js";
import { getStats } from "./PlayerStats.js";

// Story groups - collections of related fragments
export const STORY_GROUPS = {
  ENGINEERING_LOGS: {
    id: "ENGINEERING_LOGS",
    name: "Engineering Department Logs",
    icon: "⚙️",
    fragments: ["ENGINEERING_TERMINAL_01", "ENGINEERING_TERMINAL_02", "ENGINEERING_PERSONAL"]
  },
  MEDICAL_REPORTS: {
    id: "MEDICAL_REPORTS", 
    name: "Medical Bay Reports",
    icon: "🧊",
    fragments: ["CRYO_CHAMBER_LOG", "MEDICAL_EMERGENCY", "QUARANTINE_PROTOCOL"]
  },
  SYSTEM_DIAGNOSTICS: {
    id: "SYSTEM_DIAGNOSTICS",
    name: "System Diagnostic Logs", 
    icon: "🤖",
    fragments: ["DRONE_POD_MAINTENANCE", "AI_ANOMALY", "SYSTEM_CORRUPTION"]
  },
  REVELATION_MEMORIES: {
    id: "REVELATION_MEMORIES",
    name: "Core Memory Fragments",
    icon: "🦾",
    fragments: ["ASSEMBLY_ARM_MEMORY", "ORIGIN_TRUTH", "FINAL_MESSAGE"]
  },
  PERSONAL_LOGS: {
    id: "PERSONAL_LOGS",
    name: "Crew Personal Logs",
    icon: "👤", 
    fragments: ["CAPTAIN_FINAL", "ENGINEER_PERSONAL", "DOCTOR_CONFESSION"]
  }
};

class StorySystem {
  constructor() {
    this.discoveredFragments = new Set();
    this.discoveredGroups = new Map();
    this.journalEntries = new Map(); // Store discovered fragments with metadata
    this.currentModal = null;
    this.storyFragments = null;
    this.loadPromise = null;
    this.registeredObjects = new Set(); // Track all objects with story content
    this.setupEventListeners();
    this.setupModalElements();
  }

  async loadStoryFragments() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = fetch('./js/modules/storyFragments.json')
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
      throw new Error('Story fragments not loaded yet. Call loadStoryFragments() first.');
    }
    return this.storyFragments;
  }

  // Register an object that has story content
  registerStoryObject(gameObject) {
    this.registeredObjects.add(gameObject);
  }

  // Unregister an object (for cleanup)
  unregisterStoryObject(gameObject) {
    this.registeredObjects.delete(gameObject);
  }

  // Remove a specific fragment from all registered objects
  removeFragmentFromAllObjects(fragmentId) {
    for (const obj of this.registeredObjects) {
      if (obj.removeStoryFragment) {
        obj.removeStoryFragment(fragmentId);
      }
    }
  }

  setupEventListeners() {
    // Listen for story discovery events
    eventBus.on("story-discovery", (data) => {
      this.showStoryModal(data.fragmentId);
    });

    // Listen for story modal requests
    eventBus.on("show-story", (fragmentId) => {
      this.showStoryModal(fragmentId);
    });

    // Listen for journal requests
    eventBus.on("open-journal", () => {
      this.showJournal();
    });

    // Setup keyboard listener for L key
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "l" && !this.isModalOpen()) {
        this.showJournal();
      }
    });
  }

  isModalOpen() {
    const storyModal = document.getElementById("story-modal");
    const upgradeModal = document.getElementById("new-upgrade-modal");
    const journalModal = document.getElementById("journal-modal");
    
    return (storyModal && storyModal.classList.contains("active")) ||
           (upgradeModal && upgradeModal.classList.contains("active")) ||
           (journalModal && journalModal.classList.contains("active"));
  }

  setupModalElements() {
    this.modal = document.getElementById("story-modal");
    this.titleEl = document.getElementById("story-title");
    this.timestampEl = document.getElementById("story-timestamp");
    this.iconEl = document.getElementById("story-icon");
    this.textEl = document.getElementById("story-text");
    this.closeBtn = document.getElementById("close-story-btn");

    // Setup event listeners for modal buttons
    this.closeBtn.addEventListener("click", () => this.closeStoryModal());
    
    // Close modal when clicking outside
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeStoryModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("active")) {
        this.closeStoryModal();
      }
    });
  }

  checkRequirements(requirements) {
    if (!requirements || Object.keys(requirements).length === 0) {
      return true; // No requirements means always available
    }

    const playerStats = getStats();

    // Check discovered fragments requirement
    if (requirements.discoveredFragments) {
      const hasAllRequired = requirements.discoveredFragments.every(fragmentId => 
        this.discoveredFragments.has(fragmentId)
      );
      if (!hasAllRequired) return false;
    }

    // Check minimum discovered count
    if (requirements.minDiscoveredCount && 
        this.discoveredFragments.size < requirements.minDiscoveredCount) {
      return false;
    }

    // Check upgrade count requirements
    if (requirements.upgradeCount) {
      for (const [upgradeId, requiredCount] of Object.entries(requirements.upgradeCount)) {
        if (playerStats.getUpgradeCount(upgradeId) < requiredCount) {
          return false;
        }
      }
    }

    // Check completed groups requirement
    if (requirements.groupsCompleted) {
      const hasAllCompletedGroups = requirements.groupsCompleted.every(groupId => {
        const progress = this.getGroupProgress(groupId);
        return progress.complete;
      });
      if (!hasAllCompletedGroups) return false;
    }

    // Check group progress requirements
    if (requirements.groupProgress) {
      for (const [groupId, requiredProgress] of Object.entries(requirements.groupProgress)) {
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
      // Skip if already discovered
      if (this.discoveredFragments.has(fragmentId)) return false;
      
      const fragment = fragments[fragmentId];
      if (!fragment) return false;
      
      // Check if requirements are met
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

    // Check if this fragment has been seen
    if (this.discoveredFragments.has(fragmentId)) {
      eventBus.emit("game-message", "You've already accessed this information");
      return;
    }

    // Check requirements
    if (!this.checkRequirements(fragment.requirements)) {
      eventBus.emit("game-message", "Insufficient access credentials for this data");
      return;
    }

    // Mark as discovered and add to journal
    this.discoveredFragments.add(fragmentId);
    this.journalEntries.set(fragmentId, {
      fragment: fragment,
      discoveredAt: new Date(),
      order: this.journalEntries.size
    });
    this.currentModal = fragmentId;

    // Remove this fragment from all objects that have it
    this.removeFragmentFromAllObjects(fragmentId);

    // Update group progress
    if (fragment.group) {
      if (!this.discoveredGroups.has(fragment.group)) {
        this.discoveredGroups.set(fragment.group, []);
      }
      this.discoveredGroups.get(fragment.group).push(fragmentId);
    }
    
    // Populate modal content
    this.titleEl.textContent = fragment.title;
    this.timestampEl.textContent = fragment.timestamp;
    this.iconEl.textContent = fragment.icon;
    this.textEl.textContent = "";

    // Show modal
    this.modal.classList.add("active");

    // Emit message to game log with group context
    let message = `Story fragment discovered: ${fragment.title}`;
    if (fragment.group) {
      const groupProgress = this.discoveredGroups.get(fragment.group);
      const totalInGroup = STORY_GROUPS[fragment.group].fragments.length;
      message += ` (${groupProgress.length}/${totalInGroup} in series)`;
    }
    eventBus.emit("game-message", message);

    // Start typewriter effect
    this.typewriterEffect(fragment.text);
  }

  showJournal() {
    if (this.journalEntries.size === 0) {
      eventBus.emit("game-message", "No journal entries found");
      return;
    }

    // Create journal modal if it doesn't exist
    this.createJournalModal();
    
    // Populate journal content
    this.populateJournal();
    
    // Show journal modal
    const journalModal = document.getElementById("journal-modal");
    journalModal.classList.add("active");
  }

  createJournalModal() {
    let journalModal = document.getElementById("journal-modal");
    
    if (!journalModal) {
      journalModal = document.createElement("div");
      journalModal.id = "journal-modal";
      journalModal.className = "story-modal";
      journalModal.innerHTML = `
        <div class="story-content">
          <div class="story-header">
            <div class="story-icon">📖</div>
            <div class="story-meta">
              <h3 class="story-title">Personal Journal</h3>
              <p class="story-timestamp">Discovered Data Fragments</p>
            </div>
          </div>
          
          <div class="story-text" id="journal-content"></div>
          
          <div class="story-actions">
            <button class="btn" id="close-journal-btn">Close</button>
          </div>
        </div>
      `;
      
      document.getElementById("game-container").appendChild(journalModal);
      
      // Setup event listeners
      document.getElementById("close-journal-btn").addEventListener("click", () => {
        journalModal.classList.remove("active");
      });
      
      journalModal.addEventListener("click", (e) => {
        if (e.target === journalModal) {
          journalModal.classList.remove("active");
        }
      });
      
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && journalModal.classList.contains("active")) {
          journalModal.classList.remove("active");
        }
      });
    }
  }

  populateJournal() {
    const journalContent = document.getElementById("journal-content");
    const entries = Array.from(this.journalEntries.values())
      .sort((a, b) => a.order - b.order);
    
    let content = "";
    
    // Group entries by story group
    const groupedEntries = {};
    entries.forEach(entry => {
      const groupId = entry.fragment.group || "MISC";
      if (!groupedEntries[groupId]) {
        groupedEntries[groupId] = [];
      }
      groupedEntries[groupId].push(entry);
    });
    
    // Display entries by group
    Object.entries(groupedEntries).forEach(([groupId, groupEntries]) => {
      const group = STORY_GROUPS[groupId];
      const groupName = group ? group.name : "Miscellaneous";
      const groupIcon = group ? group.icon : "📄";
      
      content += `\n${groupIcon} ${groupName}\n${"=".repeat(groupName.length + 3)}\n\n`;
      
      groupEntries.forEach(entry => {
        const fragment = entry.fragment;
        content += `${fragment.icon} ${fragment.title}\n`;
        content += `${fragment.timestamp}\n\n`;
        content += `${fragment.text}\n\n`;
        content += `${"─".repeat(50)}\n\n`;
      });
    });
    
    journalContent.textContent = content;
  }

  closeStoryModal() {
    this.modal.classList.remove("active");
    this.currentModal = null;
    
    // Resume game (if paused)
    eventBus.emit("game-resumed");
  }

  typewriterEffect(text) {
    let i = 0;
    const speed = 30; // milliseconds per character
    
    const typeInterval = setInterval(() => {
      this.textEl.textContent += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(typeInterval);
      }
    }, speed);
  }

  // Public methods for checking story state
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
      complete: discoveredInGroup === group.fragments.length
    };
  }

  getAllGroupProgress() {
    return Object.keys(STORY_GROUPS).map(groupId => ({
      groupId,
      name: STORY_GROUPS[groupId].name,
      icon: STORY_GROUPS[groupId].icon,
      ...this.getGroupProgress(groupId)
    }));
  }

  // Request a specific story from a group (for objects to use)
  requestStoryFromGroup(groupId) {
    const availableFragments = this.getAvailableFragmentsInGroup(groupId);
    
    if (availableFragments.length === 0) {
      return null; // No available fragments in group
    }
    
    // Return first available fragment that meets requirements
    return availableFragments[0];
  }

  getJournalEntryCount() {
    return this.journalEntries.size;
  }
}

// Create singleton instance
const storySystem = new StorySystem();
export { storySystem };