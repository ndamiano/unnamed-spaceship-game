class BaseRoom {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 4;
    this.doors = [];
    this.objects = [];
    this.weight = 10;
  }

  getWidth() {
    return this.width;
  }
  getHeight() {
    return this.height;
  }

  setX(x) {
    this.x = x;
    this.updateObjectPositions();
  }

  setY(y) {
    this.y = y;
    this.updateObjectPositions();
  }

  addDoor(door) {
    this.doors.push(door);
  }

  getDoors() {
    return this.doors;
  }

  hasDoor(x, y) {
    return this.doors.some((door) => door.x === x && door.y === y);
  }

  removeDoor(x, y) {
    this.doors = this.doors.filter((door) => !(door.x === x && door.y === y));
  }

  generateObjects() {
    return this.objects;
  }

  addObject(object, offsetX, offsetY) {
    object._offsetX = offsetX;
    object._offsetY = offsetY;
    object.x = this.x + offsetX;
    object.y = this.y + offsetY;
    this.objects.push(object);
  }

  updateObjectPositions() {
    for (const obj of this.objects) {
      obj.x = this.x + obj._offsetX;
      obj.y = this.y + obj._offsetY;
    }
  }

  contains(x, y) {
    return (
      x >= this.x &&
      x < this.x + this.width &&
      y >= this.y &&
      y < this.y + this.height
    );
  }
}

export { BaseRoom };
