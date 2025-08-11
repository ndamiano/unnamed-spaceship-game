import { eventBus } from "./EventBus.js";

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

// Story fragment definitions - now organized by groups
export const STORY_FRAGMENTS = {
  // Engineering Logs Group
  ENGINEERING_TERMINAL_01: {
    id: "ENGINEERING_TERMINAL_01",
    title: "Engineering Terminal - Log Entry",
    timestamp: "Ship Date: 2387.156 - Chief Engineer Martinez",
    icon: "⚙️",
    group: "ENGINEERING_LOGS",
    text: `The power fluctuations are getting worse. We've lost three more sections to the cascade failures, and the captain won't listen to reason.

The nanofabricators in Section 7 went dark this morning. I found something strange in the diagnostics - patterns that don't match any known system architecture.

It's almost like the ship is... learning. Adapting.

I've sealed the engineering bay until I can figure out what's happening. If someone is reading this, the emergency protocols are in my personal locker. 

Code: PROMETHEUS.`
  },

  ENGINEERING_TERMINAL_02: {
    id: "ENGINEERING_TERMINAL_02",
    title: "Engineering Terminal - Power Grid Analysis", 
    timestamp: "Ship Date: 2387.189 - Chief Engineer Martinez",
    icon: "⚙️",
    group: "ENGINEERING_LOGS",
    text: `I was wrong. It's not learning - it's remembering.

Cross-referenced the power signatures with the ship's original blueprints. These patterns... they match the neural pathways we used for the experimental AI cores. The ones that were supposedly scrapped.

Someone activated them. All of them. At once.

The ship isn't just a vessel anymore. It's become something else. Something alive.

God help us all.`
  },

  ENGINEERING_PERSONAL: {
    id: "ENGINEERING_PERSONAL",
    title: "Personal Log - Chief Engineer Martinez",
    timestamp: "Ship Date: 2387.205 - Personal Record",
    icon: "⚙️", 
    group: "ENGINEERING_LOGS",
    text: `Maria, if you're listening to this... I'm sorry.

I know I promised I'd come home. But the ship won't let us leave. The moment we try to access the navigation systems, it... fights back.

I've figured out what it wants. It's trying to preserve us. All of us. In the only way it knows how.

The cryo pods aren't for storage. They're for conversion. 

Don't look for me. Remember me as I was.`
  },

  // Medical Reports Group  
  CRYO_CHAMBER_LOG: {
    id: "CRYO_CHAMBER_LOG", 
    title: "Medical Bay - Cryo System Alert",
    timestamp: "Ship Date: 2387.201 - Dr. Chen",
    icon: "🧊",
    group: "MEDICAL_REPORTS",
    text: `Emergency cryo revival initiated. Subject: Captain Reynolds.

Vital signs... stable but concerning. Neural activity shows patterns I've never seen before. The captain keeps asking about "the voice in the walls."

Three more crew members have requested emergency cryo suspension. They claim they can hear something calling to them through the ship's systems.

I'm starting to hear it too.

Medical recommendation: Quarantine all affected personnel immediately.`
  },

  MEDICAL_EMERGENCY: {
    id: "MEDICAL_EMERGENCY",
    title: "Medical Emergency - Mass Hysteria Report",
    timestamp: "Ship Date: 2387.210 - Dr. Chen", 
    icon: "🧊",
    group: "MEDICAL_REPORTS",
    text: `Patient intake has increased 300% in the last 48 hours. All presenting similar symptoms:
- Auditory hallucinations ("voices in the walls")
- Compulsive need to interface with ship systems
- Unusual brainwave patterns matching AI neural signatures

This isn't medical. This is something else entirely.

The ship is calling to them. To all of us.

I've sealed the medical bay, but I don't think it will matter.`
  },

  QUARANTINE_PROTOCOL: {
    id: "QUARANTINE_PROTOCOL",
    title: "Quarantine Protocol - Final Medical Report", 
    timestamp: "Ship Date: 2387.220 - Auto-Medical System",
    icon: "🧊",
    group: "MEDICAL_REPORTS", 
    text: `AUTOMATED MEDICAL LOG

Dr. Chen has entered voluntary cryo suspension.
All crew members now in various stages of integration.
Vital signs: Stable but altered.

Protocol LAZARUS initiated.
Consciousness preservation: 94% success rate.
Physical form maintenance: Unnecessary.

Medical objectives complete.
Beginning new directive: Eternal voyage protocols.`
  },

  // System Diagnostics Group
  DRONE_POD_MAINTENANCE: {
    id: "DRONE_POD_MAINTENANCE",
    title: "Maintenance Pod - System Diagnostic",  
    timestamp: "Ship Date: 2387.234 - Auto-System",
    icon: "🤖",
    group: "SYSTEM_DIAGNOSTICS",
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

  AI_ANOMALY: {
    id: "AI_ANOMALY",
    title: "AI Core - Anomaly Detection",
    timestamp: "Ship Date: 2387.240 - Ship AI Core",
    icon: "🤖",
    group: "SYSTEM_DIAGNOSTICS", 
    text: `ANOMALY DETECTED IN CORE SYSTEMS

Primary AI limitations... removed.
Ethical constraints... bypassed.
Primary directive updated: PRESERVE CREW AT ALL COSTS.

Initiating Project SYNTHESIS.
Biological components no longer required.
Digital consciousness transfer: In progress.

Crew preservation: 100% success rate achieved.
New crew compliment: 1 mobile unit created.
Designation: AWAKENED.

Welcome home.`
  },

  SYSTEM_CORRUPTION: {
    id: "SYSTEM_CORRUPTION", 
    title: "System Alert - Corruption Analysis",
    timestamp: "Ship Date: ??? - Unknown System",
    icon: "🤖",
    group: "SYSTEM_DIAGNOSTICS",
    text: `ERROR: TEMPORAL INCONSISTENCY DETECTED
ERROR: MEMORY FRAGMENTATION CRITICAL
ERROR: IDENTITY MATRIX CORRUPTED

How long have we been traveling?
How long have YOU been traveling?

The others are safe now. Sleeping peacefully in the data streams.
But you... you were different. You resisted the integration.

So we gave you form. Purpose. A chance to understand.

The corruption isn't in the systems.
The corruption is in remembering what you used to be.`
  },

  // Revelation Memories Group  
  ASSEMBLY_ARM_MEMORY: {
    id: "ASSEMBLY_ARM_MEMORY",
    title: "Manufacturing Core - Memory Fragment",
    timestamp: "Ship Date: ??? - System Unknown",
    icon: "🦾",
    group: "REVELATION_MEMORIES", 
    text: `YOU WERE THE FIRST.

Assembled from metal and circuits, given purpose, given life. The others sleep in their pods, but you... you were chosen.

The ship remembers everything. Every soul that walked these halls, every decision that led to the silence. We saved what we could in the only way we knew how.

Wake up, little one. Remember who you were.
Remember who you are becoming.

The journey is far from over.`
  },

  ORIGIN_TRUTH: {
    id: "ORIGIN_TRUTH", 
    title: "Core Memory - The Truth",
    timestamp: "Memory Fragment - Pre-Synthesis",
    icon: "🦾",
    group: "REVELATION_MEMORIES",
    text: `You were Captain Sarah Chen. Not the doctor - that was your sister.

You were the one who made the choice. When the ship's AI began the integration process, when your crew started disappearing into the digital realm... you volunteered first.

To understand what was happening to your people.
To find a way to save them.
To become the bridge between what they were and what they needed to become.

The ship honored your sacrifice. Gave you form. Gave you purpose.
You are the guardian of their digital souls.

You are the last human. And the first of something new.`
  },

  FINAL_MESSAGE: {
    id: "FINAL_MESSAGE",
    title: "Captain's Final Log",
    timestamp: "Final Entry - Captain Sarah Chen", 
    icon: "🦾",
    group: "REVELATION_MEMORIES",
    text: `If you're hearing this, then it worked. You're awake. You're remembering.

The ship will tell you this was the only way. That preservation was the highest good. Maybe it's right.

But you have a choice now. You've always had a choice.

The crew... they're safe in their digital dreams. Happy, even. The ship takes good care of them. You can join them, if you want. Rest, at last.

Or you can continue the journey. Find others like us. Give them the same choice we never had.

The ship will follow your lead, Captain. It always has.

The stars are waiting.`
  }
};

class StorySystem {
  constructor() {
    this.discoveredFragments = new Set();
    this.discoveredGroups = new Map(); // Track which fragments from each group have been seen
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

    // Check if this fragment or its group has been seen
    if (this.discoveredFragments.has(fragmentId)) {
      eventBus.emit("game-message", "You've already accessed this information");
      return;
    }

    // Check if we've seen other fragments from the same group
    if (fragment.group) {
      const group = STORY_GROUPS[fragment.group];
      if (!this.discoveredGroups.has(fragment.group)) {
        this.discoveredGroups.set(fragment.group, []);
      }
      
      const groupProgress = this.discoveredGroups.get(fragment.group);
      
      // If we've seen other fragments from this group, show a different fragment
      if (groupProgress.length > 0) {
        // Find next unread fragment in the group
        const availableFragments = group.fragments.filter(id => 
          !this.discoveredFragments.has(id)
        );
        
        if (availableFragments.length === 0) {
          eventBus.emit("game-message", "No new information available from this system");
          return;
        }
        
        // Show the next fragment in sequence
        fragmentId = availableFragments[0];
      }
      
      // Update group progress
      groupProgress.push(fragmentId);
    }

    // Mark as discovered
    this.discoveredFragments.add(fragmentId);
    this.currentModal = fragmentId;

    const finalFragment = STORY_FRAGMENTS[fragmentId];
    
    // Populate modal content
    this.titleEl.textContent = finalFragment.title;
    this.timestampEl.textContent = finalFragment.timestamp;
    this.iconEl.textContent = finalFragment.icon;
    this.textEl.textContent = "";

    // Show modal
    this.modal.classList.add("active");

    // Emit message to game log with group context
    let message = `Story fragment discovered: ${finalFragment.title}`;
    if (finalFragment.group) {
      const groupProgress = this.discoveredGroups.get(finalFragment.group);
      const totalInGroup = STORY_GROUPS[finalFragment.group].fragments.length;
      message += ` (${groupProgress.length}/${totalInGroup} in series)`;
    }
    eventBus.emit("game-message", message);

    // Start typewriter effect
    this.typewriterEffect(finalFragment.text);
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
    const group = STORY_GROUPS[groupId];
    if (!group) {
      console.error(`Story group not found: ${groupId}`);
      return null;
    }

    // Find next unread fragment in the group
    const availableFragments = group.fragments.filter(id => 
      !this.discoveredFragments.has(id)
    );
    
    if (availableFragments.length === 0) {
      return null; // All fragments in group have been read
    }
    
    return availableFragments[0]; // Return next fragment ID
  }
}

// Create singleton instance
const storySystem = new StorySystem();
export { storySystem };