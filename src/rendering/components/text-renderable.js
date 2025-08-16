import { Renderable } from './renderable.js';

export class TextRenderable extends Renderable {
  constructor(x, y, text, options = {}) {
    super(x, y, options.layer || 10); // Text renders on top by default

    this.text = text;
    this.font = options.font || '16px monospace';
    this.color = options.color || '#fff';
    this.align = options.align || 'left';
    this.baseline = options.baseline || 'top';
    this.maxWidth = options.maxWidth;

    // Text effects
    this.shadow = options.shadow || false;
    this.shadowColor = options.shadowColor || '#000';
    this.shadowOffset = options.shadowOffset || { x: 1, y: 1 };
  }

  setText(text) {
    this.text = text;
  }

  getBounds() {
    // This would need actual text measurement for accurate bounds
    // For now, estimate based on font size
    const fontSize = parseInt(this.font) || 16;

    return {
      x: this.x,
      y: this.y,
      width: this.text.length * fontSize * 0.6, // rough estimate
      height: fontSize,
    };
  }

  render(renderer, camera) {
    if (!this.isVisible(camera)) return;

    // Draw shadow if enabled
    if (this.shadow) {
      renderer.drawText(
        this.text,
        this.x + this.shadowOffset.x,
        this.y + this.shadowOffset.y,
        {
          font: this.font,
          color: this.shadowColor,
          align: this.align,
          baseline: this.baseline,
          maxWidth: this.maxWidth,
        }
      );
    }

    // Draw main text
    renderer.drawText(this.text, this.x, this.y, {
      font: this.font,
      color: this.color,
      align: this.align,
      baseline: this.baseline,
      maxWidth: this.maxWidth,
    });
  }
}
