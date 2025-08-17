/**
 * Resource configuration and utilities for the game
 */

// Available resource types
export const RESOURCE_TYPES = {
  NANITES: 'Nanites',
  SHIP_PARTS: 'Ship Parts',
  RESEARCH_POINTS: 'Research Points',
};

// Base structure for player resources
export const BASE_RESOURCES = {
  [RESOURCE_TYPES.NANITES]: 10000,
  [RESOURCE_TYPES.SHIP_PARTS]: 10000,
  [RESOURCE_TYPES.RESEARCH_POINTS]: 10000,
};

/**
 * Checks if resource set A has at least as much as resource set B for all resources
 * @param {Object} resourcesA First resource set to compare
 * @param {Object} resourcesB Second resource set to compare against
 * @returns {boolean} True if resourcesA >= resourcesB for all resource types
 */
export function hasMoreResources(resourcesA, resourcesB) {
  return Object.values(RESOURCE_TYPES).every(
    type => (resourcesA[type] || 0) >= (resourcesB[type] || 0)
  );
}

/**
 * Adds or subtracts resources from a base set
 * @param {Object} baseResources The resource set to modify
 * @param {Object} deltaResources Resources to add/subtract (use negative values to subtract)
 * @returns {Object} New resource set after modification
 */
export function modifyResources(baseResources, deltaResources) {
  const newResources = { ...baseResources };

  Object.values(RESOURCE_TYPES).forEach(type => {
    if (deltaResources[type] !== undefined) {
      newResources[type] += deltaResources[type];
      // Ensure resources don't go below 0
      newResources[type] = Math.max(0, newResources[type]);
    }
  });

  return newResources;
}

// Convenience methods
export const addResources = (base, delta) => modifyResources(base, delta);

export const subtractResources = (base, delta) => {
  const negativeDelta = Object.fromEntries(
    Object.entries(delta).map(([type, amount]) => [type, -amount])
  );

  return modifyResources(base, negativeDelta);
};
