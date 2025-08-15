import { BaseRoom } from './base-room.js';
import GameObject from '../../entities/objects/game-object.js';

export class SpawnRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 5;
    this.height = 5;

    // Right walls (this.width, positive y to go down)
    this.addPotentialDoor(this.width - 1, 1, 'right');
    this.addPotentialDoor(this.width - 1, 2, 'right');
    // Left walls (-1, positive y to go down)
    this.addPotentialDoor(0, 1, 'left');
    this.addPotentialDoor(0, 2, 'left');
    // Top Walls (positive x to go right, -1)
    this.addPotentialDoor(1, 0, 'top');
    this.addPotentialDoor(2, 0, 'top');
    // Bottom Walls (positive x to go right, this.height)
    this.addPotentialDoor(1, this.height - 1, 'bottom');
    this.addPotentialDoor(2, this.height - 1, 'bottom');

    // Create a special terminal with guaranteed story for spawn room
    const guaranteedTerminal = new GameObject(0, 0, 'terminal');

    // Override the config to guarantee story
    guaranteedTerminal.guaranteedStory = true;
    guaranteedTerminal.storyChance = 1.0;
    this.addObject(guaranteedTerminal, 4, 0);

    this.addObject(new GameObject(0, 0, 'dronePod'), 0, 0);
    this.addObject(new GameObject(0, 0, 'assemblyArm'), 0, 4);
    this.addObject(new GameObject(0, 0, 'assemblyArm').flip(), 4, 4);
  }
}
