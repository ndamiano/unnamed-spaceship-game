#!/usr/bin/env node

/**
 * Digital Conquest Project Reorganization Script
 *
 * This script helps migrate files from the current structure
 * to the new organized structure.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// File migrations mapping: [currentPath, newPath, updateImports]
const fileMigrations = [
  // Core game files
  ['js/modules/Game.js', 'src/core/game.js', true],
  ['js/modules/EventBus.js', 'src/core/event-bus.js', true],
  ['js/modules/InputHandler.js', 'src/core/input-handler.js', true],
  ['js/modules/Config.js', 'src/config/game-config.js', true],
  ['main.js', 'src/main.js', true],

  // Player entity
  ['js/modules/Player.js', 'src/entities/player/player.js', true],
  ['js/modules/PlayerStats.js', 'src/entities/player/player-stats.js', true],

  // Game objects
  [
    'js/modules/objects/GameObject.js',
    'src/entities/objects/game-object.js',
    true,
  ],
  [
    'js/modules/objects/GameObjectLoader.js',
    'src/entities/objects/game-object-loader.js',
    true,
  ],
  [
    'js/modules/objects/gameObjects.json',
    'src/config/game-objects.json',
    false,
  ],

  // World generation
  ['js/modules/ship/Ship.js', 'src/world/ship/ship.js', true],
  ['js/modules/ship/ShipMap.js', 'src/world/ship/ship-map.js', true],
  ['js/modules/ship/RoomQueue.js', 'src/world/ship/room-queue.js', true],

  // Tiles
  ['js/modules/Tile.js', 'src/world/tiles/tile.js', true],
  ['js/modules/tiles/Floor.js', 'src/world/tiles/floor.js', true],
  ['js/modules/tiles/WallSegment.js', 'src/world/tiles/wall-segment.js', true],
  ['js/modules/tiles/Door.js', 'src/world/tiles/door.js', true],

  // Rooms
  ['js/modules/rooms/BaseRoom.js', 'src/world/rooms/base-room.js', true],
  ['js/modules/rooms/SpawnRoom.js', 'src/world/rooms/spawn-room.js', true],
  ['js/modules/rooms/FinishRoom.js', 'src/world/rooms/finish-room.js', true],
  [
    'js/modules/rooms/CryoChamberRoom.js',
    'src/world/rooms/cryo-chamber-room.js',
    true,
  ],
  [
    'js/modules/rooms/DroneHangarRoom.js',
    'src/world/rooms/drone-hangar-room.js',
    true,
  ],
  [
    'js/modules/rooms/EngineeringBayRoom.js',
    'src/world/rooms/engineering-bay-room.js',
    true,
  ],
  ['js/modules/rooms/FarmRoom.js', 'src/world/rooms/farm-room.js', true],
  [
    'js/modules/rooms/HolographicsLabRoom.js',
    'src/world/rooms/holographics-lab-room.js',
    true,
  ],
  [
    'js/modules/rooms/SecurityRoom.js',
    'src/world/rooms/security-room.js',
    true,
  ],
  [
    'js/modules/rooms/XenobotanyRoom.js',
    'src/world/rooms/xenobotany-room.js',
    true,
  ],
  ['js/modules/rooms/index.js', 'src/world/rooms/index.js', true],

  // Systems
  ['js/modules/StorySystem.js', 'src/systems/story/story-system.js', true],
  ['js/modules/storyFragments.json', 'src/config/story-fragments.json', false],
  [
    'js/modules/UpgradeSystem.js',
    'src/systems/upgrades/upgrade-system.js',
    true,
  ],
  [
    'js/modules/resources.js',
    'src/systems/resources/resource-manager.js',
    true,
  ],

  // Save system
  [
    'js/modules/save/GameStateManager.js',
    'src/systems/save/game-state-manager.js',
    true,
  ],
  [
    'js/modules/save/SaveCompression.js',
    'src/systems/save/save-compression.js',
    true,
  ],
  [
    'js/modules/save/SaveManagerUI.js',
    'src/systems/save/save-manager-ui.js',
    true,
  ],

  // UI
  ['js/modules/UserInterface.js', 'src/ui/user-interface.js', true],

  // Utils
  ['js/modules/Utils.js', 'src/utils/directions.js', true], // Will need splitting
  ['js/modules/index.js', 'src/utils/index.js', true],

  // Styles
  ['game.css', 'styles/game.css', false],
];

// Create directory structure
const directories = [
  'src',
  'src/config',
  'src/core',
  'src/entities',
  'src/entities/player',
  'src/entities/objects',
  'src/world',
  'src/world/ship',
  'src/world/tiles',
  'src/world/rooms',
  'src/systems',
  'src/systems/story',
  'src/systems/resources',
  'src/systems/upgrades',
  'src/systems/save',
  'src/ui',
  'src/ui/modals',
  'src/ui/components',
  'src/utils',
  'styles',
  'styles/components',
  'assets',
  'assets/images',
  'assets/images/tiles',
  'assets/images/objects',
  'tests',
  'tests/unit',
  'tests/integration',
];

function createDirectories() {
  console.log('Creating directory structure...');

  directories.forEach(dir => {
    const fullPath = path.join(__dirname, dir);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created: ${dir}`);
    }
  });
}

function updateImportPaths(content, oldPath, newPath) {
  // This is a basic implementation - you might need to adjust for your specific import patterns

  // Update relative imports
  let updatedContent = content;

  // Common import patterns to update
  const importPatterns = [
    // EventBus
    {
      old: /from ['"]\.\/EventBus\.js['"]/g,
      new: "from '../core/event-bus.js'",
    },
    {
      old: /from ['"]\.\.\/EventBus\.js['"]/g,
      new: "from '../../core/event-bus.js'",
    },

    // Player imports
    {
      old: /from ['"]\.\/Player\.js['"]/g,
      new: "from '../entities/player/player.js'",
    },
    {
      old: /from ['"]\.\/PlayerStats\.js['"]/g,
      new: "from '../entities/player/player-stats.js'",
    },

    // GameObject imports
    {
      old: /from ['"]\.\.\/objects\/GameObject\.js['"]/g,
      new: "from '../../entities/objects/game-object.js'",
    },

    // Ship imports
    {
      old: /from ['"]\.\/ship\/Ship\.js['"]/g,
      new: "from '../world/ship/ship.js'",
    },

    // Room imports
    {
      old: /from ['"]\.\.\/rooms\/index\.js['"]/g,
      new: "from '../../world/rooms/index.js'",
    },

    // Utils imports
    {
      old: /from ['"]\.\/Utils\.js['"]/g,
      new: "from '../utils/directions.js'",
    },

    // Tiles imports
    {
      old: /from ['"]\.\.\/Tile\.js['"]/g,
      new: "from '../tile.js'",
    },
  ];

  importPatterns.forEach(pattern => {
    updatedContent = updatedContent.replace(pattern.old, pattern.new);
  });

  return updatedContent;
}

function migrateFile(currentPath, newPath, shouldUpdateImports) {
  const fullCurrentPath = path.join(__dirname, currentPath);
  const fullNewPath = path.join(__dirname, newPath);

  if (!fs.existsSync(fullCurrentPath)) {
    console.log(`Warning: ${currentPath} does not exist, skipping...`);

    return;
  }

  try {
    let content = fs.readFileSync(fullCurrentPath, 'utf8');

    if (shouldUpdateImports) {
      content = updateImportPaths(content, currentPath, newPath);
    }

    // Ensure the directory exists
    const newDir = path.dirname(fullNewPath);

    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }

    fs.writeFileSync(fullNewPath, content);
    console.log(`Migrated: ${currentPath} → ${newPath}`);
  } catch (error) {
    console.error(`Error migrating ${currentPath}:`, error.message);
  }
}

function updateHTMLFiles() {
  console.log('Updating HTML file references...');

  // Update game.html
  const gameHtmlPath = path.join(__dirname, 'game.html');

  if (fs.existsSync(gameHtmlPath)) {
    let content = fs.readFileSync(gameHtmlPath, 'utf8');

    // Update CSS reference
    content = content.replace('href="game.css"', 'href="styles/game.css"');

    // Update main.js reference
    content = content.replace('src="main.js"', 'src="src/main.js"');

    fs.writeFileSync(gameHtmlPath, content);
    console.log('Updated game.html references');
  }

  // Update start.html imports
  const startHtmlPath = path.join(__dirname, 'start.html');

  if (fs.existsSync(startHtmlPath)) {
    let content = fs.readFileSync(startHtmlPath, 'utf8');

    content = content.replace(
      './js/modules/save/GameStateManager.js',
      './src/systems/save/game-state-manager.js'
    );

    fs.writeFileSync(startHtmlPath, content);
    console.log('Updated start.html references');
  }
}

function createIndexFiles() {
  console.log('Creating index files...');

  // Create main utils index
  const utilsIndexContent = `// Utility exports
export { Directions } from './directions.js';
export { randomInt, getPossibleDoorPositions } from './math-utils.js';
`;

  fs.writeFileSync(
    path.join(__dirname, 'src/utils/index.js'),
    utilsIndexContent
  );

  // Create rooms index
  const roomsIndexContent = `// Room exports
export { BaseRoom } from './base-room.js';
export { SpawnRoom } from './spawn-room.js';
export { FinishRoom } from './finish-room.js';
export { CryoChamberRoom } from './cryo-chamber-room.js';
export { DroneHangarRoom } from './drone-hangar-room.js';
export { EngineeringBayRoom } from './engineering-bay-room.js';
export { FarmRoom } from './farm-room.js';
export { HolographicsLabRoom } from './holographics-lab-room.js';
export { SecurityRoom } from './security-room.js';
export { XenobotanyRoom } from './xenobotany-room.js';
`;

  fs.writeFileSync(
    path.join(__dirname, 'src/world/rooms/index.js'),
    roomsIndexContent
  );

  console.log('Created index files');
}

function splitUtilsFile() {
  console.log('Splitting Utils.js into focused modules...');

  const utilsPath = path.join(__dirname, 'js/modules/Utils.js');

  if (!fs.existsSync(utilsPath)) {
    console.log('Utils.js not found, skipping split...');

    return;
  }

  const content = fs.readFileSync(utilsPath, 'utf8');

  // Create directions.js
  const directionsContent = `export const Directions = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};
`;

  // Extract math utilities (you'll need to manually extract the functions)
  const mathUtilsContent = `export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getPossibleDoorPositions(targetRoom, rooms, maxHeight, maxWidth) {
  // Move the getPossibleDoorPositions function implementation here
  // This is too complex to auto-extract, so you'll need to copy it manually
  console.warn('getPossibleDoorPositions needs to be implemented in math-utils.js');
  return [];
}
`;

  fs.writeFileSync(
    path.join(__dirname, 'src/utils/directions.js'),
    directionsContent
  );
  fs.writeFileSync(
    path.join(__dirname, 'src/utils/math-utils.js'),
    mathUtilsContent
  );

  console.log('Created split utility files (manual completion required)');
}

function main() {
  console.log('Starting Digital Conquest project reorganization...\n');

  try {
    createDirectories();
    console.log('');

    // Migrate files
    console.log('Migrating files...');
    fileMigrations.forEach(([currentPath, newPath, updateImports]) => {
      migrateFile(currentPath, newPath, updateImports);
    });
    console.log('');

    splitUtilsFile();
    console.log('');

    createIndexFiles();
    console.log('');

    updateHTMLFiles();
    console.log('');

    console.log('Migration complete! 🎉');
    console.log('\nNext steps:');
    console.log(
      '1. Manually complete the Utils.js split (move getPossibleDoorPositions to math-utils.js)'
    );
    console.log(
      "2. Update any remaining import paths that weren't caught automatically"
    );
    console.log('3. Test the game to ensure everything still works');
    console.log(
      '4. Consider removing the old js/modules/ directory after verification'
    );
    console.log('5. Update your build/development scripts if any');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
main();
