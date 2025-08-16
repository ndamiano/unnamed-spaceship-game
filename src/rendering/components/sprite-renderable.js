import { Renderable } from './renderable.js';

export class SpriteRenderable extends Renderable {
  constructor(x, y, spritePath, options = {}) {
    super(x, y, options.layer || 0);

    this.spritePath = spritePath;
    this.sprite = null;
    this.width = options.width || 100;
    this.height = options.height || 100;
    this.flipX = options.flipX || false;
    this.flipY = options.flipY || false;

    // Offset for sprite positioning
    this.offsetX = options.offsetX || 0;
    this.offsetY = options.offsetY || 0;
  }

  setSprite(sprite) {
    this.sprite = sprite;
    if (sprite) {
      this.width = this.width || sprite.width;
      this.height = this.height || sprite.height;
    }
  }

  getBounds() {
    return {
      x: this.x + this.offsetX,
      y: this.y + this.offsetY,
      width: this.width,
      height: this.height,
    };
  }

  render(renderer, camera) {
    if (!this.sprite || !this.isVisible(camera)) return;

    const renderX = this.x + this.offsetX;
    const renderY = this.y + this.offsetY;

    renderer.drawSprite(this.sprite, renderX, renderY, {
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      alpha: this.alpha,
      flipX: this.flipX,
      flipY: this.flipY,
    });
  }
}
