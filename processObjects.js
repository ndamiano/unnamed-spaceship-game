import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const objectsDir = path.join(__dirname, 'js', 'modules', 'objects');
const outputFile = path.join(objectsDir, 'gameObjects.json');

// Read current gameObjects.json
let gameObjects = {};
try {
  gameObjects = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
} catch (err) {
  console.error('Error reading gameObjects.json:', err);
  process.exit(1);
}

// Get all object files to process
const files = fs.readdirSync(objectsDir)
  .filter(file => file.endsWith('.js') && 
         !['GameObject.js', 'GameObjectLoader.js', 'index.js'].includes(file));

files.forEach(file => {
  const className = path.basename(file, '.js');
  const filePath = path.join(objectsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Infer name from filename (convert camelCase to kebab-case)
  const name = className
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();

  // Check if already exists in gameObjects
  const key = className.charAt(0).toLowerCase() + className.slice(1);
  if (gameObjects[key]) {
    console.log(`Skipping ${file} - already exists in gameObjects.json`);
    return;
  }

  // Create new object entry
  gameObjects[key] = {
    name,
    passable: false,
    blocksLineOfSight: false,
    asset: `${name}-100x100.png`
  };

  // Try to extract additional properties from file content
  const nameMatch = content.match(/this\.name\s*=\s*["']([^"']+)["']/);
  if (nameMatch) {
    gameObjects[key].name = nameMatch[1];
  }

  console.log(`Processed ${file} -> ${key}`);
});

// Write updated gameObjects.json
fs.writeFileSync(outputFile, JSON.stringify(gameObjects, null, 2));
console.log('Updated gameObjects.json');

// Delete processed files
files.forEach(file => {
  fs.unlinkSync(path.join(objectsDir, file));
  console.log(`Deleted ${file}`);
});
