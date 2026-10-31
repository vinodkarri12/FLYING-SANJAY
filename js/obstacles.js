/**
 * ANTIGRAV: VECTOR SURGE - Procedural Obstacles Engine
 * Rotating Gravity Gates, Moving Laser Walls, Floating Platforms,
 * Magnetic Barriers, Energy Storms, and Gravity Singularity Vortexes.
 */

class ObstacleBase {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.active = false;
    this.grazed = false;
    this.destroyed = false;
    this.type = 'base';
    this.width = 40;
    this.height = 40;
    this.animTime = 0;
  }

  update(dt, worldSpeed = 400) {
    this.animTime += dt;
    this.x -= worldSpeed * dt;
    return this.x > -200; // retain until well off-screen
  }

  // Override in sub-classes
  checkCollision(player) {
    return false;
  }

  checkGraze(player) {
    if (this.grazed || this.destroyed) return false;
    // Check if close enough to trigger graze bonus
    const distSq = (this.x - player.x) * (this.x - player.x) + (this.y - player.y) * (this.y - player.y);
    const grazeDist = (this.width / 2 + player.radius + 32);
    if (distSq < grazeDist * grazeDist) {
      this.grazed = true;
      return true;
    }
    return false;
  }

  onPulseHit(pulseX, pulseY, radius) {
    const dx = this.x - pulseX;
    const dy = this.y - pulseY;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < radius + this.width / 2) {
      this.destroyed = true;
      return true;
    }
    return false;
  }

  draw(ctx) {}
}

// 1. ROTATING GRAVITY GATE
class RotatingGate extends ObstacleBase {
  constructor() {
    super();
    this.type = 'gate';
    this.armCount = 3;
    this.armLength = 110;
    this.angle = 0;
    this.rotSpeed = 1.8; // rad/s
    this.beamThickness = 12;
  }

  init(x, y, armCount = 3, rotSpeed = 1.8, armLength = 110) {
    this.reset();
    this.x = x;
    this.y = y;
    this.armCount = armCount;
    this.rotSpeed = rotSpeed;
    this.armLength = armLength;
    this.angle = Math.random() * Math.PI * 2;
    this.width = armLength * 2;
    this.height = armLength * 2;
    this.active = true;
  }

  update(dt, worldSpeed = 400) {
    this.angle += this.rotSpeed * dt;
    return super.update(dt, worldSpeed);
  }

  checkCollision(player) {
    if (this.destroyed) return false;
    // Check collision against each rotating arm segment
    for (let i = 0; i < this.armCount; i++) {
      const armAngle = this.angle + (i * Math.PI * 2 / this.armCount);
      const endX = this.x + Math.cos(armAngle) * this.armLength;
      const endY = this.y + Math.sin(armAngle) * this.armLength;

      // Distance from player center to line segment (this.x, this.y) -> (endX, endY)
      const dist = this.distToSegment(player.x, player.y, this.x, this.y, endX, endY);
      if (dist < player.radius + this.beamThickness * 0.5) {
        return true;
      }
    }
    return false;
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  draw(ctx) {
    if (!this.active || this.destroyed) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Glowing Pivot Core
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f3ff';
    ctx.fillStyle = '#0a1020';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Laser Arms
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 18;
    for (let i = 0; i < this.armCount; i++) {
      const armAngle = this.angle + (i * Math.PI * 2 / this.armCount);
      const ex = Math.cos(armAngle) * this.armLength;
      const ey = Math.sin(armAngle) * this.armLength;

      // Outer glow beam
      ctx.strokeStyle = 'rgba(255, 0, 127, 0.7)';
      ctx.lineWidth = this.beamThickness;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Inner intense core beam
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Emitter cap
      ctx.fillStyle = '#ffe600';
      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// 2. MOVING LASER WALL
class LaserWall extends ObstacleBase {
  constructor() {
    super();
    this.type = 'laser_wall';
    this.beamY = 0;
    this.sweepMin = 100;
    this.sweepMax = 620;
    this.sweepSpeed = 220; // px/s
    this.sweepDir = 1;
    this.thickness = 14;
    this.pulsing = false;
  }

  init(x, sweepMin = 120, sweepMax = 600, sweepSpeed = 200) {
    this.reset();
    this.x = x;
    this.sweepMin = sweepMin;
    this.sweepMax = sweepMax;
    this.sweepSpeed = sweepSpeed;
    this.beamY = sweepMin + Math.random() * (sweepMax - sweepMin);
    this.sweepDir = Math.random() > 0.5 ? 1 : -1;
    this.width = 30;
    this.height = sweepMax - sweepMin;
    this.active = true;
  }

  update(dt, worldSpeed = 400) {
    this.beamY += this.sweepSpeed * this.sweepDir * dt;
    if (this.beamY > this.sweepMax) {
      this.beamY = this.sweepMax;
      this.sweepDir = -1;
    } else if (this.beamY < this.sweepMin) {
      this.beamY = this.sweepMin;
      this.sweepDir = 1;
    }
    this.y = this.beamY;
    return super.update(dt, worldSpeed);
  }

  checkCollision(player) {
    if (this.destroyed) return false;
    // Check horizontal laser segment near player
    const inX = Math.abs(player.x - this.x) < (player.radius + this.thickness * 0.5);
    const inY = Math.abs(player.y - this.beamY) < (player.radius + this.thickness * 0.5);
    return inX && inY;
  }

  draw(ctx) {
    if (!this.active || this.destroyed) return;
    ctx.save();

    // Top & Bottom Laser Emitter Pylons
    ctx.fillStyle = '#101528';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;

    // Top Pylon
    ctx.fillRect(this.x - 14, this.sweepMin - 20, 28, 20);
    ctx.strokeRect(this.x - 14, this.sweepMin - 20, 28, 20);

    // Bottom Pylon
    ctx.fillRect(this.x - 14, this.sweepMax, 28, 20);
    ctx.strokeRect(this.x - 14, this.sweepMax, 28, 20);

    // Rail Guide Line
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(this.x, this.sweepMin);
    ctx.lineTo(this.x, this.sweepMax);
    ctx.stroke();
    ctx.setLineDash([]);

    // Moving Laser Projector Node
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff007f';
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(this.x, this.beamY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal Laser Beam
    const beamLen = 90;
    const grad = ctx.createLinearGradient(this.x - beamLen, this.beamY, this.x + beamLen, this.beamY);
    grad.addColorStop(0, 'rgba(255, 0, 127, 0)');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(1, 'rgba(255, 0, 127, 0)');

    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    ctx.moveTo(this.x - beamLen, this.beamY);
    ctx.lineTo(this.x + beamLen, this.beamY);
    ctx.stroke();

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x - beamLen, this.beamY);
    ctx.lineTo(this.x + beamLen, this.beamY);
    ctx.stroke();

    ctx.restore();
  }
}

// 3. FLOATING ANTI-GRAV PLATFORM
class FloatingPlatform extends ObstacleBase {
  constructor() {
    super();
    this.type = 'platform';
    this.hasSpikesTop = false;
    this.hasSpikesBottom = false;
  }

  init(x, y, width = 160, height = 28, hasSpikesTop = false, hasSpikesBottom = false) {
    this.reset();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.hasSpikesTop = hasSpikesTop;
    this.hasSpikesBottom = hasSpikesBottom;
    this.active = true;
  }

  checkCollision(player) {
    if (this.destroyed) return false;
    // Bounding box collision
    const halfW = this.width / 2;
    const halfH = this.height / 2;

    const inX = (player.x + player.radius > this.x - halfW) && (player.x - player.radius < this.x + halfW);
    const inY = (player.y + player.radius > this.y - halfH) && (player.y - player.radius < this.y + halfH);

    if (inX && inY) {
      // If platform has spikes on colliding side, lethal hit!
      if (this.hasSpikesTop && player.y < this.y) return true;
      if (this.hasSpikesBottom && player.y > this.y) return true;

      // Safe landing / ceiling slide behavior:
      if (player.vy > 0 && player.y < this.y) {
        player.y = this.y - halfH - player.radius;
        player.vy = 0;
        player.isGrounded = true;
      } else if (player.vy < 0 && player.y > this.y) {
        player.y = this.y + halfH + player.radius;
        player.vy = 0;
        player.isOnCeiling = true;
      }
    }
    return false;
  }

  draw(ctx) {
    if (!this.active || this.destroyed) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    const halfW = this.width / 2;
    const halfH = this.height / 2;

    // Platform Metallic Body
    ctx.fillStyle = '#0f1426';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f3ff';

    ctx.fillRect(-halfW, -halfH, this.width, this.height);
    ctx.strokeRect(-halfW, -halfH, this.width, this.height);

    // Center Energy Core
    ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.fillRect(-halfW + 10, -3, this.width - 20, 6);

    // Hazard Spikes (if present)
    if (this.hasSpikesTop) {
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      for (let sx = -halfW + 10; sx < halfW - 10; sx += 20) {
        ctx.beginPath();
        ctx.moveTo(sx, -halfH);
        ctx.lineTo(sx + 10, -halfH - 14);
        ctx.lineTo(sx + 20, -halfH);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (this.hasSpikesBottom) {
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      for (let sx = -halfW + 10; sx < halfW - 10; sx += 20) {
        ctx.beginPath();
        ctx.moveTo(sx, halfH);
        ctx.lineTo(sx + 10, halfH + 14);
        ctx.lineTo(sx + 20, halfH);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

// 4. MAGNETIC ANOMALY BARRIER
class MagneticBarrier extends ObstacleBase {
  constructor() {
    super();
    this.type = 'magnetic_barrier';
    this.magnetType = 'attract'; // 'attract' or 'repel'
    this.strength = 1400;
    this.radius = 160;
  }

  init(x, y, magnetType = 'attract', strength = 1400, radius = 160) {
    this.reset();
    this.x = x;
    this.y = y;
    this.magnetType = magnetType;
    this.strength = strength;
    this.radius = radius;
    this.width = radius * 2;
    this.height = radius * 2;
    this.active = true;
  }

  checkCollision(player) {
    if (this.destroyed) return false;
    // Direct contact with inner core is lethal
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return (dx * dx + dy * dy) < (24 + player.radius) * (24 + player.radius);
  }

  draw(ctx) {
    if (!this.active || this.destroyed) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    const isAttract = this.magnetType === 'attract';
    const color = isAttract ? '#00f3ff' : '#ff007f';

    // Pulsing field concentric circles
    const pulse = (this.animTime * 1.5) % 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;

    for (let r = 0; r < 3; r++) {
      const curRadius = ((pulse + r / 3) % 1) * this.radius;
      ctx.globalAlpha = 1 - (curRadius / this.radius);
      ctx.beginPath();
      ctx.arc(0, 0, curRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;

    // Center Magnetic Core
    ctx.fillStyle = '#0b0f1e';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Magnet Polarity Symbol (+ or -)
    ctx.fillStyle = color;
    ctx.font = '800 18px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isAttract ? '+' : '−', 0, 1);

    ctx.restore();
  }
}

// 5. ENERGY STORM
class EnergyStorm extends ObstacleBase {
  constructor() {
    super();
    this.type = 'energy_storm';
    this.radius = 70;
    this.sparkTimer = 0;
  }

  init(x, y, radius = 75) {
    this.reset();
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.width = radius * 2;
    this.height = radius * 2;
    this.active = true;
  }

  checkCollision(player) {
    if (this.destroyed) return false;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return (dx * dx + dy * dy) < (this.radius * 0.8 + player.radius) * (this.radius * 0.8 + player.radius);
  }

  draw(ctx) {
    if (!this.active || this.destroyed) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffe600';
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 2;

    // Crackling plasma arcs
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2 / 8) + this.animTime * 3;
      const r = this.radius * (0.6 + Math.random() * 0.4);
      const ex = Math.cos(angle) * r;
      const ey = Math.sin(angle) * r;

      ctx.moveTo(0, 0);
      const midX = ex * 0.5 + (Math.random() - 0.5) * 20;
      const midY = ey * 0.5 + (Math.random() - 0.5) * 20;
      ctx.lineTo(midX, midY);
      ctx.lineTo(ex, ey);
    }
    ctx.stroke();

    // Dense charged cloud center
    ctx.fillStyle = 'rgba(255, 230, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// 6. GRAVITY VORTEX (SINGULARITY)
class GravityVortex extends ObstacleBase {
  constructor() {
    super();
    this.type = 'vortex';
    this.suctionRadius = 240;
    this.lethalRadius = 30;
    this.suctionStrength = 2200;
  }

  init(x, y, suctionRadius = 240) {
    this.reset();
    this.x = x;
    this.y = y;
    this.suctionRadius = suctionRadius;
    this.width = suctionRadius * 2;
    this.height = suctionRadius * 2;
    this.active = true;
    this.escaped = false;
  }

  update(dt, worldSpeed = 400) {
    // Singularity gravitational pull on player
    if (window.game && window.game.player && !this.destroyed) {
      const p = window.game.player;
      if (!p.hasMagnetImmunity) {
        const dx = this.x - p.x;
        const dy = this.y - p.y;
        const d = Math.hypot(dx, dy);

        if (d < this.suctionRadius && d > 10) {
          const pull = (1 - d / this.suctionRadius) * this.suctionStrength;
          p.vx += (dx / d) * pull * dt;
          p.vy += (dy / d) * pull * dt;

          // If safely pulled into orbit and bypassed
          if (p.x > this.x + 40 && !this.escaped) {
            this.escaped = true;
            window.game.ui.unlockAchievement('vortex_escape');
          }
        }
      }
    }
    return super.update(dt, worldSpeed);
  }

  checkCollision(player) {
    if (this.destroyed) return false;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return (dx * dx + dy * dy) < (this.lethalRadius + player.radius) * (this.lethalRadius + player.radius);
  }

  draw(ctx) {
    if (!this.active || this.destroyed) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Accretion disk swirl
    ctx.rotate(this.animTime * -4);
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#9d00ff';

    // Outer spiral tendrils
    ctx.strokeStyle = 'rgba(157, 0, 255, 0.4)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const aStart = i * Math.PI * 0.5;
      for (let step = 0; step < 20; step++) {
        const curA = aStart + step * 0.2;
        const curR = this.lethalRadius + step * 7;
        const tx = Math.cos(curA) * curR;
        const ty = Math.sin(curA) * curR;
        if (step === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.stroke();
    }

    // Black Hole Event Horizon
    ctx.fillStyle = '#000000';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, this.lethalRadius, 0, Math.PI * 2);
    ctx.fill();

    // Event Horizon Photosphere Rim
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.lethalRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
