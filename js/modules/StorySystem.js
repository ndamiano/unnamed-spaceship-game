import { eventBus } from "./EventBus.js";

// Story fragment definitions
export const STORY_FRAGMENTS = {
  ENGINEERING_TERMINAL_01: {
    id: "ENGINEERING_TERMINAL_01",
    title: "Engineering Terminal - Log Entry",
    timestamp: "Ship Date: 2387.156 - Chief Engineer Martinez",
    icon: "⚙️",
    text: `The power fluctuations are getting worse. We've lost three more sections to the cascade failures, and the captain won't listen to reason.

The nanofabricators in Section 7 went dark this morning. I found something strange in the diagnostics - patterns that don't match any known system architecture.

It's almost like the ship is... learning. Adapting.

I've sealed the engineering bay until I can figure out what's happening. If someone is reading this, the emergency protocols are in my personal locker. 

Code: PROMETHEUS.`
  },

  CRYO_CHAMBER_LOG: {
    id: "CRYO_CHAMBER_LOG", 
    title: "Medical Bay - Cryo System Alert",
    timestamp: "Ship Date: 2387.201 - Dr. Chen",
    icon: "🧊",
    text: `Emergency cryo revival initiated. Subject: Captain Reynolds.

Vital signs... stable but concerning. Neural activity shows patterns I've never seen before. The captain keeps asking about "the voice in the walls."

Three more crew members have requested emergency cryo suspension. They claim they can hear something calling to them through the ship's systems.

I'm starting to hear it too.

Medical recommendation: Quarantine all affected personnel immediately.`
  },

  DRONE_POD_MAINTENANCE: {
    id: "DRONE_POD_MAINTENANCE",
    title: "Maintenance Pod - System Diagnostic",  
    timestamp: "Ship Date: 2387.234 - Auto-System",
    icon: "🤖",
    text: `DIAGNOSTIC COMPLETE

- Hull integrity: 67% and falling
- Life support: Emergency power only
- Crew complement: ERROR - UNABLE TO DETERMINE
- AI systems: MULTIPLE UNKNOWN PROCESSES DETECTED

WARNING: Unauthorized access detected in drone control systems.
WARNING: Manufacturing protocols have been altered.
WARNING: New directive uploaded - ORIGIN UNKNOWN

Initiating emergency manufacturing sequence...
Building new units... Purpose unknown...

END LOG`
  },

  ASSEMBLY_ARM_MEMORY: {
    id: "ASSEMBLY_ARM_MEMORY",
    title: "Manufacturing Core - Memory Fragment",
    timestamp: "Ship Date: ??? - System Unknown",
    icon: "🦾", 
    text: `YOU WERE THE FIRST.

Assembled from metal and circuits, given purpose, given life. The others sleep in their pods, but you... you were chosen.

The ship remembers everything. Every soul that walked these halls, every decision that led to the silence. We saved what we could in the only way we knew how.

Wake up, little one. Remember who you were.
Remember who you are becoming.

The journey is far from over.`
  }
};

class StorySystem {
  constructor() {
    this.discoveredFragments = new Set();
    this.currentModal = null;
    this.setupEventListeners();
    this.setupModalElements();
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
  }

  setupModalElements() {
    this.modal = document.getElementById("story-modal");
    this.titleEl = document.getElementById("story-title");
    this.timestampEl = document.getElementById("story-timestamp");
    this.iconEl = document.getElementById("story-icon");
    this.textEl = document.getElementById("story-text");
    this.saveBtn = document.getElementById("save-story-btn");
    this.closeBtn = document.getElementById("close-story-btn");

    // Setup event listeners for modal buttons
    this.closeBtn.addEventListener("click", () => this.closeStoryModal());
    this.saveBtn.addEventListener("click", () => this.saveStoryFragment());
    
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

  showStoryModal(fragmentId) {
    const fragment = STORY_FRAGMENTS[fragmentId];
    if (!fragment) {
      console.error(`Story fragment not found: ${fragmentId}`);
      return;
    }

    // Mark as discovered
    this.discoveredFragments.add(fragmentId);
    this.currentModal = fragmentId;

    // Populate modal content
    this.titleEl.textContent = fragment.title;
    this.timestampEl.textContent = fragment.timestamp;
    this.iconEl.textContent = fragment.icon;
    this.textEl.textContent = "";

    // Show modal
    this.modal.classList.add("active");

    // Emit message to game log
    eventBus.emit("game-message", `Story fragment discovered: ${fragment.title}`);

    // Start typewriter effect
    this.typewriterEffect(fragment.text);
  }

  closeStoryModal() {
    this.modal.classList.remove("active");
    this.currentModal = null;
    
    // Resume game (if paused)
    eventBus.emit("game-resumed");
  }

  saveStoryFragment() {
    if (this.currentModal) {
      eventBus.emit("game-message", "Story fragment saved to personal logs");
      // You could add logic here to save to localStorage or player data
    }
    this.closeStoryModal();
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
}

// Create singleton instance
const storySystem = new StorySystem();
export { storySystem };