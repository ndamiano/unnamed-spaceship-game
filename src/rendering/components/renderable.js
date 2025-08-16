export class Renderable {
  constructor(x, y, layer = 0) {
    this.x = x;
    this.y = y;
    this.layer = layer;
    this.visible = true;
    this.alpha = 1;
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
  }

  // Abstract method - must be implemented by subclasses
  render(_renderer, _camera) {
    throw new Error('Renderable.render() must be implemented by subclass');
  }

  // Get bounding box for culling
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: 0,
      height: 0,
    };
  }

  // Check if this renderable is visible to the camera
  isVisible(camera) {
    if (!this.visible) return false;

    const bounds = this.getBounds();

    return camera.isInView(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  // Transform methods
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setScale(scaleX, scaleY = scaleX) {
    this.scaleX = scaleX;
    this.scaleY = scaleY;
  }

  setRotation(rotation) {
    this.rotation = rotation;
  }

  setAlpha(alpha) {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  show() {
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }
}
