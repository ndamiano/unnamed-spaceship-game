import { BaseRoom } from './base-room.js';
import GameObject from '../../entities/objects/game-object.js';

export class EngineeringBayRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 6;
    this.height = 5;

    this.addPotentialDoor(0, 2, 'left');
    this.addPotentialDoor(this.width - 1, 2, 'right');

    // AssemblyArms get revelation stories (major plot points)
    this.addObject(new GameObject(0, 0, 'assemblyArm'), 2, 1);
    this.addObject(new GameObject(0, 0, 'assemblyArm'), 3, 1);

    // Engineering equipment gets engineering logs
    this.addObject(new GameObject(0, 0, 'plasmaConduit'), 2, 3);
    this.addObject(new GameObject(0, 0, 'plasmaConduit'), 3, 3);
    this.addObject(new GameObject(0, 0, 'powerCell'), 1, 2);
    this.addObject(new GameObject(0, 0, 'accessPanel'), 4, 2);

    // Terminal in engineering room gets engineering stories
    this.addObject(new GameObject(0, 0, 'terminal'), 1, 1);
  }
}
