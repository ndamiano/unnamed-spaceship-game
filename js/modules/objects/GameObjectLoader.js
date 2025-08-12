export class GameObjectLoader {
  constructor() {
    this.gameObjects = null;
    this.loadPromise = null;
  }

  async loadGameObjects() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = fetch('./js/modules/objects/gameObjects.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        this.gameObjects = data;
        return data;
      })
      .catch(error => {
        console.error('Failed to load game objects:', error);
        throw error;
      });

    return this.loadPromise;
  }

  getGameObjects() {
    if (!this.gameObjects) {
      throw new Error('Game objects not loaded yet. Call loadGameObjects() first.');
    }
    return this.gameObjects;
  }

  getObjectConfig(objectType) {
    const objects = this.getGameObjects();
    return objects[objectType] || null;
  }
}

// Create singleton instance
export const gameObjectLoader = new GameObjectLoader();
await gameObjectLoader.loadGameObjects();