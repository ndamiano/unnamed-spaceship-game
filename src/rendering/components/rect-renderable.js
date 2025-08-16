import { Renderable } from './renderable.js';

export class RectRenderable extends Renderable {
  constructor(x, y, width, height, color, options = {}) {
    super(x, y, options.layer || 0);

    this.width = width;
    this.height = height;
    this.color = color;
    this.filled = options.filled !== false; // default to filled
    this.borderColor = options.borderColor;
    this.borderWidth = options.borderWidth || 1;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  render(renderer, camera) {
    if (!this.isVisible(camera)) return;

    if (this.filled) {
      renderer.drawRect(this.x, this.y, this.width, this.height, this.color);
    }

    if (this.borderColor) {
      // Draw border (this would need a stroke rect method in renderer)
      renderer.drawRect(
        this.x,
        this.y,
        this.width,
        this.borderWidth,
        this.borderColor
      );
      renderer.drawRect(
        this.x,
        this.y + this.height - this.borderWidth,
        this.width,
        this.borderWidth,
        this.borderColor
      );
      renderer.drawRect(
        this.x,
        this.y,
        this.borderWidth,
        this.height,
        this.borderColor
      );
      renderer.drawRect(
        this.x + this.width - this.borderWidth,
        this.y,
        this.borderWidth,
        this.height,
        this.borderColor
      );
    }
  }
}
