import { BaseRoom } from './base-room.js';
import GameObject from '../../entities/objects/game-object.js';

export class SecurityRoom extends BaseRoom {
  constructor(x, y) {
    super(x, y);

    this.width = 5;
    this.height = 6;

    this.addPotentialDoor(2, 0, 'top');
    this.addPotentialDoor(2, this.height - 1, 'bottom');
    this.addPotentialDoor(0, 1, 'left');
    this.addPotentialDoor(0, 2, 'left');
    this.addPotentialDoor(0, 3, 'left');
    this.addPotentialDoor(this.width - 1, 1, 'right');
    this.addPotentialDoor(this.width - 1, 2, 'right');
    this.addPotentialDoor(this.width - 1, 3, 'right');

    // Observation Deck on the top row
    this.addObject(new GameObject(0, 0, 'observationDeck'), 0, 0);
    this.addObject(new GameObject(0, 0, 'observationDeck'), 4, 0);

    // Security Terminal gets system diagnostics or personal logs
    this.addObject(new GameObject(0, 0, 'securityTerminal'), 2, 2);

    // Droid cradle and backup power
    this.addObject(new GameObject(0, 0, 'combatDroidCradle'), 1, 4);
    this.addObject(new GameObject(0, 0, 'combatDroidCradle').flip(), 3, 4);
    this.addObject(new GameObject(0, 0, 'powerCell'), 3, 5);

    // Add a terminal for security logs
    this.addObject(new GameObject(0, 0, 'terminal'), 1, 1);
  }
}
