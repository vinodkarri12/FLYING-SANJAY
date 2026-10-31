/**
 * ANTIGRAV: VECTOR SURGE - Physics & Anti-Gravity Engine
 * Handles gravity polarity, kinetic momentum, apex hang-time, magnetic force vectors,
 * and zero-gravity tunnels.
 */

class PhysicsEngine {
  constructor() {
    this.gravityMagnitude = 2200; // px/s^2
    this.gravityDir = 1; // 1 = downward, -1 = upward
    this.terminalVelocity = 1100;
    this.apexFloatThreshold = 90; // px/s
    this.apexFloatFactor = 0.45; // reduces gravity at the peak for fluid float
    this.inZeroG = false;
    this.inReverseChamber = false;
    this.ceilingY = 60;
    this.floorY = 660; // will adjust to canvas height
  }

  setBoundaries(top, bottom) {
    this.ceilingY = top;
    this.floorY = bottom;
  }

  flipGravity() {
    this.gravityDir *= -1;
    return this.gravityDir;
  }

  applyGravity(player, dt) {
    if (this.inZeroG) {
      // Zero-G tunnel: weightless drift with gentle momentum dampening
      player.vy *= Math.pow(0.85, dt * 60);
      return;
    }

    let effGravity = this.gravityMagnitude * this.gravityDir;

    // Apex float mechanics: hang-time at the peak of the parabola
    if (Math.abs(player.vy) < this.apexFloatThreshold) {
      const floatFactor = player.skinId === 'void_glider' ? 0.3 : this.apexFloatFactor;
      effGravity *= floatFactor;
    }

    // Apply acceleration
    player.vy += effGravity * dt;

    // Clamp terminal velocity
    if (player.vy > this.terminalVelocity) player.vy = this.terminalVelocity;
    if (player.vy < -this.terminalVelocity) player.vy = -this.terminalVelocity;
  }

  applyMagneticFields(player, magneticZones, dt) {
    if (player.hasMagnetImmunity) return;

    for (let i = 0; i < magneticZones.length; i++) {
      const zone = magneticZones[i];
      if (!zone.active) continue;

      // Check if player is inside or within influence of magnetic zone
      const dx = zone.x - player.x;
      const dy = zone.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < zone.radius) {
        // Compute force
        const forceIntensity = (1 - dist / zone.radius) * zone.strength;
        const normX = dx / (dist || 1);
        const normY = dy / (dist || 1);

        const mType = zone.magnetType || zone.type;
        if (mType === 'attract') {
          player.vx += normX * forceIntensity * dt;
          player.vy += normY * forceIntensity * dt;
        } else if (mType === 'repel') {
          player.vx -= normX * forceIntensity * dt;
          player.vy -= normY * forceIntensity * dt;
        } else if (mType === 'vertical_pull') {
          // Pulls up or down
          player.vy += zone.direction * forceIntensity * dt;
        }

        // Emit magnetic flux trail
        if (Math.random() < 0.3 && window.game && window.game.particles) {
          window.game.particles.emitTrail(
            player.x + (Math.random() - 0.5) * 20,
            player.y + (Math.random() - 0.5) * 20,
            mType === 'attract' ? '#00f3ff' : '#ff007f',
            2
          );
        }
      }
    }
  }

  resolveBoundaryCollisions(player, onSurfaceHit) {
    let grounded = false;
    let onCeiling = false;

    // Floor collision
    if (player.y + player.height / 2 >= this.floorY) {
      player.y = this.floorY - player.height / 2;
      if (player.vy > 0) {
        if (onSurfaceHit && player.vy > 100) onSurfaceHit(false, player.vy);
        player.vy = 0;
      }
      grounded = true;
    }

    // Ceiling collision
    if (player.y - player.height / 2 <= this.ceilingY) {
      player.y = this.ceilingY + player.height / 2;
      if (player.vy < 0) {
        if (onSurfaceHit && player.vy < -100) onSurfaceHit(true, player.vy);
        player.vy = 0;
      }
      onCeiling = true;
    }

    player.isGrounded = grounded;
    player.isOnCeiling = onCeiling;
  }
}
