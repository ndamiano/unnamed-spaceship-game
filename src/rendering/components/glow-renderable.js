import { Renderable } from './renderable.js';

export class GlowRenderable extends Renderable {
  constructor(x, y, size, color, intensity = 1) {
    super(x, y, -1); // Glow effects render behind other objects

    this.size = size;
    this.color = color;
    this.intensity = intensity;
    this.pulsing = false;
    this.pulseSpeed = 1;
    this.pulseMin = 0.5;
    this.pulseMax = 1.5;
    this.pulseTime = 0;
  }

  setBounds() {
    return {
      x: this.x - this.size * 0.6,
      y: this.y - this.size * 0.6,
      width: this.size * 1.2,
      height: this.size * 1.2,
    };
  }

  enablePulsing(speed = 1, min = 0.5, max = 1.5) {
    this.pulsing = true;
    this.pulseSpeed = speed;
    this.pulseMin = min;
    this.pulseMax = max;
  }

  disablePulsing() {
    this.pulsing = false;
    this.intensity = 1;
  }

  update(deltaTime) {
    if (this.pulsing) {
      this.pulseTime += deltaTime * this.pulseSpeed;
      const pulse = Math.sin(this.pulseTime) * 0.5 + 0.5; // 0 to 1

      this.intensity = this.pulseMin + (this.pulseMax - this.pulseMin) * pulse;
    }
  }

  render(renderer, camera) {
    if (!this.isVisible(camera)) return;

    renderer.drawGlow(this.x, this.y, this.size, this.color, this.intensity);
  }
}
