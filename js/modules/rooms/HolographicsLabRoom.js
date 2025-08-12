import { BaseRoom } from './BaseRoom.js';
import GameObject from '../objects/GameObject.js';

export class HolographicsLabRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 5;
    this.height = 5;

    this.addPotentialDoor(2, 0, 'top');
    this.addPotentialDoor(2, this.height - 1, 'bottom');

    this.addObject(new GameObject(0, 0, 'hologramProjector'), 1, 1);
    this.addObject(new GameObject(0, 0, 'hologramProjector'), 3, 1);
    this.addObject(new GameObject(0, 0, 'commsRelayStation'), 2, 2);
    this.addObject(new GameObject(0, 0, 'terminal'), 2, 3);
  }
}
