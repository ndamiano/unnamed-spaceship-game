export class Renderer {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;

    // Performance tracking
    this.drawCalls = 0;
    this.lastFrameTime = 0;

    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
    this.canvas.style.backgroundColor = '#000';

    // Set up high DPI support
    const dpr = window.devicePixelRatio || 1;

    if (dpr > 1) {
      this.canvas.width = this.config.canvasWidth * dpr;
      this.canvas.height = this.config.canvasHeight * dpr;
      this.canvas.style.width = this.config.canvasWidth + 'px';
      this.canvas.style.height = this.config.canvasHeight + 'px';
      this.ctx.scale(dpr, dpr);
    }
  }

  // Main render method
  render(scene, camera) {
    const startTime = performance.now();

    this.drawCalls = 0;

    // Clear canvas
    this.clear();

    // Apply camera transform
    this.ctx.save();
    camera.applyTransform(this.ctx);

    // Render scene
    scene.render(this, camera);

    // Restore context
    this.ctx.restore();

    // Track performance
    this.lastFrameTime = performance.now() - startTime;
  }

  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
    this.drawCalls++;
  }

  // Drawing primitives
  drawSprite(sprite, x, y, options = {}) {
    const {
      width = sprite.width,
      height = sprite.height,
      rotation = 0,
      alpha = 1,
      flipX = false,
      flipY = false,
    } = options;

    this.ctx.save();

    // Set alpha
    if (alpha !== 1) {
      this.ctx.globalAlpha = alpha;
    }

    // Apply transformations
    this.ctx.translate(x + width / 2, y + height / 2);

    if (rotation !== 0) {
      this.ctx.rotate(rotation);
    }

    if (flipX || flipY) {
      this.ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    }

    // Draw sprite
    this.ctx.drawImage(sprite, -width / 2, -height / 2, width, height);

    this.ctx.restore();
    this.drawCalls++;
  }

  drawRect(x, y, width, height, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
    this.drawCalls++;
  }

  drawCircle(x, y, radius, color, filled = true) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);

    if (filled) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.stroke();
    }

    this.drawCalls++;
  }

  // Effects
  drawGlow(x, y, size, color, intensity = 1) {
    this.ctx.save();

    const gradient = this.ctx.createRadialGradient(
      x,
      y,
      size * 0.25,
      x,
      y,
      size * 0.5
    );

    const alpha = Math.min(intensity, 1);

    gradient.addColorStop(
      0,
      color +
        Math.floor(alpha * 64)
          .toString(16)
          .padStart(2, '0')
    );
    gradient.addColorStop(
      0.7,
      color +
        Math.floor(alpha * 32)
          .toString(16)
          .padStart(2, '0')
    );
    gradient.addColorStop(1, color + '00');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - size * 0.6, y - size * 0.6, size * 1.2, size * 1.2);

    this.ctx.restore();
    this.drawCalls++;
  }

  drawText(text, x, y, options = {}) {
    const {
      font = '16px monospace',
      color = '#fff',
      align = 'left',
      baseline = 'top',
      maxWidth,
    } = options;

    this.ctx.save();
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;

    if (maxWidth) {
      this.ctx.fillText(text, x, y, maxWidth);
    } else {
      this.ctx.fillText(text, x, y);
    }

    this.ctx.restore();
    this.drawCalls++;
  }

  // Utilities
  measureText(text, font = '16px monospace') {
    this.ctx.save();
    this.ctx.font = font;
    const metrics = this.ctx.measureText(text);

    this.ctx.restore();

    return metrics;
  }

  // Performance info
  getPerformanceInfo() {
    return {
      drawCalls: this.drawCalls,
      lastFrameTime: this.lastFrameTime,
      fps: Math.round(1000 / this.lastFrameTime),
    };
  }

  // Debug rendering
  drawDebugInfo(camera) {
    const info = this.getPerformanceInfo();
    const bounds = camera.getViewBounds();

    this.drawText(`FPS: ${info.fps}`, 10, 10, { color: '#0f0' });
    this.drawText(`Draw Calls: ${info.drawCalls}`, 10, 30, { color: '#0f0' });
    this.drawText(`Frame Time: ${info.lastFrameTime.toFixed(2)}ms`, 10, 50, {
      color: '#0f0',
    });
    this.drawText(
      `Camera: ${bounds.x.toFixed(0)}, ${bounds.y.toFixed(0)}`,
      10,
      70,
      { color: '#0f0' }
    );
  }
}
