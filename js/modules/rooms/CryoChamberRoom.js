import { BaseRoom } from './BaseRoom.js';
import GameObject from '../objects/GameObject.js';

export class CryoChamberRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 6;
    this.height = 5;

    this.addPotentialDoor(0, 2, 'left');
    this.addPotentialDoor(this.width - 1, 2, 'right');

    // All cryo tubes in this room share medical stories
    this.addObject(new GameObject(0, 0, 'cryogenicTube'), 1, 0);
    this.addObject(new GameObject(0, 0, 'cryogenicTube'), 2, 0);
    this.addObject(new GameObject(0, 0, 'cryogenicTube'), 3, 0);
    this.addObject(new GameObject(0, 0, 'cryogenicTube'), 4, 0);

    this.addObject(new GameObject(0, 0, 'cryogenicTube'), 1, 4);
    this.addObject(new GameObject(0, 0, 'cryogenicTube'), 2, 4);
    this.addObject(new GameObject(0, 0, 'cryogenicTube'), 3, 4);
    this.addObject(new GameObject(0, 0, 'cryogenicTube'), 4, 4);

    // Hygiene station might have personal logs
    this.addObject(new GameObject(0, 0, 'hygienePod'), 0, 3);

    // Terminal gets medical reports
    this.addObject(new GameObject(0, 0, 'terminal'), 5, 1);
  }
}
