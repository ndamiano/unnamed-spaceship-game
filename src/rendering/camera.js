export class Camera {
  constructor(
    x = 0,
    y = 0,
    zoom = 1,
    viewportWidth = 800,
    viewportHeight = 600
  ) {
    this.x = x;
    this.y = y;
    this.zoom = zoom;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    // Follow target settings
    this.followTarget = null;
    this.followOffset = { x: 0, y: 0 };
    this.followLerp = 0.1; // Smooth following

    // Bounds (optional)
    this.bounds = null;

    // Shake effect
    this.shake = { x: 0, y: 0, intensity: 0, duration: 0 };
  }

  // Position methods
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  move(deltaX, deltaY) {
    this.setPosition(this.x + deltaX, this.y + deltaY);
  }

  // Zoom methods
  setZoom(zoom) {
    this.zoom = Math.max(0.1, Math.min(zoom, 5)); // Clamp zoom
  }

  zoomIn(factor = 1.1) {
    this.setZoom(this.zoom * factor);
  }

  zoomOut(factor = 0.9) {
    this.setZoom(this.zoom * factor);
  }

  // Follow system
  follow(target, offsetX = 0, offsetY = 0, lerp = 0.1) {
    this.followTarget = target;
    this.followOffset.x = offsetX;
    this.followOffset.y = offsetY;
    this.followLerp = lerp;
  }

  stopFollowing() {
    this.followTarget = null;
  }

  update(deltaTime) {
    // Update follow target
    if (this.followTarget) {
      const targetX = this.followTarget.x + this.followOffset.x;
      const targetY = this.followTarget.y + this.followOffset.y;

      // Smooth lerp to target
      this.x += (targetX - this.x) * this.followLerp;
      this.y += (targetY - this.y) * this.followLerp;
    }

    // Apply bounds if set
    if (this.bounds) {
      this.x = Math.max(this.bounds.minX, Math.min(this.x, this.bounds.maxX));
      this.y = Math.max(this.bounds.minY, Math.min(this.y, this.bounds.maxY));
    }

    // Update shake effect
    if (this.shake.duration > 0) {
      this.shake.duration -= deltaTime;
      this.shake.x = (Math.random() - 0.5) * this.shake.intensity;
      this.shake.y = (Math.random() - 0.5) * this.shake.intensity;
    } else {
      this.shake.x = 0;
      this.shake.y = 0;
    }
  }

  // Coordinate transformation
  worldToScreen(worldX, worldY) {
    const screenX =
      (worldX - this.x + this.shake.x) * this.zoom + this.viewportWidth / 2;
    const screenY =
      (worldY - this.y + this.shake.y) * this.zoom + this.viewportHeight / 2;

    return { x: screenX, y: screenY };
  }

  screenToWorld(screenX, screenY) {
    const worldX =
      (screenX - this.viewportWidth / 2) / this.zoom + this.x - this.shake.x;
    const worldY =
      (screenY - this.viewportHeight / 2) / this.zoom + this.y - this.shake.y;

    return { x: worldX, y: worldY };
  }

  // Viewport and culling
  getViewBounds() {
    const halfWidth = this.viewportWidth / 2 / this.zoom;
    const halfHeight = this.viewportHeight / 2 / this.zoom;

    return {
      x: this.x - halfWidth,
      y: this.y - halfHeight,
      width: halfWidth * 2,
      height: halfHeight * 2,
      left: this.x - halfWidth,
      right: this.x + halfWidth,
      top: this.y - halfHeight,
      bottom: this.y + halfHeight,
    };
  }

  isInView(x, y, width = 0, height = 0) {
    const bounds = this.getViewBounds();

    return !(
      x + width < bounds.left ||
      x > bounds.right ||
      y + height < bounds.top ||
      y > bounds.bottom
    );
  }

  // Apply transform to canvas context
  applyTransform(ctx) {
    // Center the viewport
    ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);

    // Apply zoom
    ctx.scale(this.zoom, this.zoom);

    // Apply camera position and shake
    ctx.translate(-this.x + this.shake.x, -this.y + this.shake.y);
  }

  // Camera bounds
  setBounds(minX, minY, maxX, maxY) {
    this.bounds = { minX, minY, maxX, maxY };
  }

  removeBounds() {
    this.bounds = null;
  }

  // Effects
  shake(intensity = 10, duration = 500) {
    this.shake.intensity = intensity;
    this.shake.duration = duration;
  }

  // Utilities
  centerOn(x, y) {
    this.setPosition(x, y);
  }

  panTo(x, y, _duration = 1000) {
    // TODO: Implement smooth panning animation
    // For now, just set position
    this.setPosition(x, y);
  }

  // Debug
  getDebugInfo() {
    const bounds = this.getViewBounds();

    return {
      position: { x: this.x, y: this.y },
      zoom: this.zoom,
      bounds: bounds,
      followTarget: this.followTarget ? 'yes' : 'no',
      shake: this.shake.duration > 0 ? 'active' : 'none',
    };
  }
}
