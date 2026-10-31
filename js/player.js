/**
 * ANTIGRAV: VECTOR SURGE - Player Entity & Rig System
 * Multi-skin support, kinetic tilt, acrobatic flip somersaults,
 * particle jet exhaust, and ability handling.
 */

const SKINS = {
  aero_runner: {
    id: 'aero_runner',
    name: 'AERO RUNNER',
    desc: 'Agile cyber runner with dual magnet-boots and kinetic jetpack',
    cost: 0,
    unlocked: true,
    color: '#00f3ff',
    trailColor: '#00f3ff',
    perk: 'Standard rig'
  },
  quantum_mech: {
    id: 'quantum_mech',
    name: 'QUANTUM MECH',
    desc: 'Heavy reinforced chassis with rapid pulse capacitors',
    cost: 150,
    unlocked: false,
    color: '#9d00ff',
    trailColor: '#9d00ff',
    perk: '+15% Pulse Recharge'
  },
  photon_drone: {
    id: 'photon_drone',
    name: 'PHOTON DRONE',
    desc: 'Autonomous grav-pod with gyro stabilizers and twin plasma jets',
    cost: 300,
    unlocked: false,
    color: '#ffe600',
    trailColor: '#ffe600',
    perk: '+10% Graze Bonus'
  },
  void_glider: {
    id: 'void_glider',
    name: 'VOID GLIDER',
    desc: 'Aerodynamic delta wing with dual ion contrails',
    cost: 500,
    unlocked: false,
    color: '#ff007f',
    trailColor: '#ff007f',
    perk: 'Smooth apex float'
  },
  singularity_core: {
    id: 'singularity_core',
    name: 'SINGULARITY CORE',
    desc: 'Sentient anti-gravity energy entity forged in a micro black hole',
    cost: 800,
    unlocked: false,
    color: '#00ff66',
    trailColor: '#00ff66',
    perk: 'Magnetic Shard Attraction'
  }
};

class Player {
  constructor() {
    this.x = 220;
    this.y = 360;
    this.targetX = 220;
    this.vx = 0;
    this.vy = 0;
    this.radius = 18;
    this.width = 36;
    this.height = 36;

    this.gravityDir = 1; // 1 = down, -1 = up
    this.isGrounded = false;
    this.isOnCeiling = false;

    // Flip acrobatic somersault
    this.rotation = 0;
    this.targetRotation = 0;
    this.flipSpin = 0;

    // Running animation cycle
    this.runCycle = 0;

    // Pulse Ability (0 to 100)
    this.pulseEnergy = 100;
    this.pulseMax = 100;
    this.pulseChargeRate = 22; // charges to 100 in ~4.5s
    this.pulseCooldown = 0;

    // Active Powerups
    this.powerups = {}; // { type: remainingTime }
    this.hasShield = false;
    this.hasTimeSlow = false;
    this.hasDoubleScore = false;
    this.hasGravStabilizer = false;
    this.isOverdrive = false;
    this.hasMagnetImmunity = false;

    // Afterimages for Overdrive
    this.ghosts = [];

    // Selected Rig Skin
    this.skinId = localStorage.getItem('antigrav_skin') || 'aero_runner';
    this.skin = SKINS[this.skinId] || SKINS.aero_runner;

    // Shield animation
    this.shieldAngle = 0;
  }

  setSkin(skinId) {
    if (SKINS[skinId]) {
      this.skinId = skinId;
      this.skin = SKINS[skinId];
      localStorage.setItem('antigrav_skin', skinId);
    }
  }

  reset(startX = 220, startY = 360) {
    this.x = startX;
    this.y = startY;
    this.targetX = startX;
    this.vx = 0;
    this.vy = 0;
    this.gravityDir = 1;
    this.isGrounded = false;
    this.isOnCeiling = false;
    this.rotation = 0;
    this.targetRotation = 0;
    this.flipSpin = 0;
    this.runCycle = 0;
    this.pulseEnergy = 100;
    this.pulseCooldown = 0;
    this.powerups = {};
    this.hasShield = false;
    this.hasTimeSlow = false;
    this.hasDoubleScore = false;
    this.hasGravStabilizer = false;
    this.isOverdrive = false;
    this.hasMagnetImmunity = false;
    this.ghosts = [];
  }

  flipGravity() {
    this.gravityDir *= -1;
    this.flipSpin = this.gravityDir === -1 ? -Math.PI : Math.PI;
    this.isGrounded = false;
    this.isOnCeiling = false;

    // Give subtle kinetic impulse in new gravity direction
    this.vy = this.gravityDir * Math.max(Math.abs(this.vy) * 0.4, 250);

    // Audio SFX
    soundEngine.playFlip(this.gravityDir === -1);

    // Flip shock particles
    if (window.game && window.game.particles) {
      window.game.particles.emitSparks(this.x, this.y, this.gravityDir, 8, this.skin.color);
    }
  }

  canPulse() {
    return this.pulseEnergy >= 100 && this.pulseCooldown <= 0;
  }

  triggerPulse() {
    if (!this.canPulse()) return false;

    this.pulseEnergy = 0;
    this.pulseCooldown = 0.5;

    // Play shockwave sound
    soundEngine.playPulse();

    // Shockwave particle ring
    if (window.game && window.game.particles) {
      window.game.particles.emitShockwave(this.x, this.y, 240, '#9d00ff');
      window.game.particles.emitShockwave(this.x, this.y, 160, '#00f3ff');
      window.game.particles.addFloatingText(this.x, this.y - 30, 'GRAV PULSE!', '#9d00ff', 16);
    }

    // Trigger obstacle destruction / push in game loop
    if (window.game) {
      window.game.onPlayerPulse(this.x, this.y, 240);
    }

    return true;
  }

  activatePowerup(type) {
    const pInfo = POWERUP_TYPES[type];
    if (!pInfo) return;

    this.powerups[type] = pInfo.duration;

    if (type === 'shield') this.hasShield = true;
    if (type === 'time_slow') {
      this.hasTimeSlow = true;
      soundEngine.setPitchMod(0.7);
    }
    if (type === 'double_score') this.hasDoubleScore = true;
    if (type === 'grav_stabilizer') this.hasGravStabilizer = true;
    if (type === 'overdrive') this.isOverdrive = true;
    if (type === 'magnet_immunity') this.hasMagnetImmunity = true;

    soundEngine.playPowerup();
  }

  update(dt, speedFactor = 1) {
    // Pulse charge rate perk
    const rechargeMultiplier = this.skinId === 'quantum_mech' ? 1.25 : 1.0;
    if (this.pulseEnergy < this.pulseMax) {
      this.pulseEnergy = Math.min(this.pulseMax, this.pulseEnergy + this.pulseChargeRate * rechargeMultiplier * dt);
    }
    if (this.pulseCooldown > 0) {
      this.pulseCooldown -= dt;
    }

    // Update active powerup timers
    for (const type in this.powerups) {
      this.powerups[type] -= dt;
      if (this.powerups[type] <= 0) {
        delete this.powerups[type];
        if (type === 'shield') this.hasShield = false;
        if (type === 'time_slow') {
          this.hasTimeSlow = false;
          soundEngine.setPitchMod(1.0);
        }
        if (type === 'double_score') this.hasDoubleScore = false;
        if (type === 'grav_stabilizer') this.hasGravStabilizer = false;
        if (type === 'overdrive') this.isOverdrive = false;
        if (type === 'magnet_immunity') this.hasMagnetImmunity = false;
      }
    }

    // Overdrive invincible auto-speed / trail
    if (this.isOverdrive) {
      if (Math.random() < 0.4 && window.game && window.game.particles) {
        window.game.particles.emitShockwave(this.x, this.y, 70, '#ff007f');
      }
    }

    // Stabilizer: limit extreme vertical velocities
    if (this.hasGravStabilizer) {
      this.vy = Math.max(-450, Math.min(450, this.vy));
    }

    // Position integration
    this.y += this.vy * dt;

    // Horizontal smooth return to default slot
    this.vx *= Math.pow(0.8, dt * 60);
    this.x += this.vx * dt;
    this.x += (this.targetX - this.x) * 4 * dt;

    // Rotation & acrobatic flip animation
    if (this.flipSpin !== 0) {
      const spinSpeed = 16;
      if (this.flipSpin > 0) {
        this.flipSpin = Math.max(0, this.flipSpin - spinSpeed * dt);
      } else {
        this.flipSpin = Math.min(0, this.flipSpin + spinSpeed * dt);
      }
    }

    // Dynamic tilt based on vertical velocity
    const targetTilt = (this.vy / 1100) * 0.45;
    const baseRot = this.gravityDir === -1 ? Math.PI : 0;
    this.rotation = baseRot + targetTilt + this.flipSpin;

    // Running cycle on floor or ceiling
    if (this.isGrounded || this.isOnCeiling) {
      this.runCycle += dt * 14 * speedFactor;

      // Emit sparks from magnetic running boots!
      if (Math.random() < 0.35 && window.game && window.game.particles) {
        const contactY = this.isGrounded ? this.y + this.height / 2 : this.y - this.height / 2;
        window.game.particles.emitSparks(this.x - 10, contactY, this.isGrounded ? -1 : 1, 2, '#00f3ff');
      }
    } else {
      // In flight: emit jetpack exhaust trail
      if (Math.random() < 0.8 && window.game && window.game.particles) {
        window.game.particles.emitTrail(
          this.x - 16,
          this.y + (this.gravityDir === 1 ? -6 : 6),
          this.skin.trailColor,
          3.5
        );
      }
    }

    // Ghost afterimages for overdrive or high speed
    if (this.isOverdrive || Math.abs(this.vy) > 800) {
      this.ghosts.push({
        x: this.x,
        y: this.y,
        rotation: this.rotation,
        alpha: 0.6,
        color: this.isOverdrive ? '#ff007f' : this.skin.color
      });
    }

    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const g = this.ghosts[i];
      g.alpha -= dt * 3.5;
      if (g.alpha <= 0) {
        this.ghosts.splice(i, 1);
      }
    }

    // Shield rotation
    if (this.hasShield) {
      this.shieldAngle += dt * 3;
    }
  }

  draw(ctx) {
    ctx.save();

    // Draw afterimage ghosts
    for (let i = 0; i < this.ghosts.length; i++) {
      const g = this.ghosts[i];
      ctx.save();
      ctx.globalAlpha = g.alpha * 0.5;
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rotation);
      this.drawSkinModel(ctx, g.color, true);
      ctx.restore();
    }

    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Overdrive aura
    if (this.isOverdrive) {
      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ff007f';
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw active skin rig model
    this.drawSkinModel(ctx, this.skin.color, false);

    // Draw active shield barrier
    if (this.hasShield) {
      this.drawShield(ctx);
    }

    ctx.restore();
  }

  drawSkinModel(ctx, primaryColor, isGhost = false) {
    const sId = this.skinId;

    if (sId === 'quantum_mech') {
      this.drawQuantumMech(ctx, primaryColor, isGhost);
    } else if (sId === 'photon_drone') {
      this.drawPhotonDrone(ctx, primaryColor, isGhost);
    } else if (sId === 'void_glider') {
      this.drawVoidGlider(ctx, primaryColor, isGhost);
    } else if (sId === 'singularity_core') {
      this.drawSingularityCore(ctx, primaryColor, isGhost);
    } else {
      // Default: Aero Runner
      this.drawAeroRunner(ctx, primaryColor, isGhost);
    }
  }

  // 1. Aero Runner
  drawAeroRunner(ctx, color, isGhost) {
    const isRunning = this.isGrounded || this.isOnCeiling;
    const legSwing = isRunning ? Math.sin(this.runCycle) * 14 : 0;

    if (!isGhost) {
      ctx.shadowBlur = 14;
      ctx.shadowColor = color;
    }

    // Legs
    ctx.strokeStyle = '#222944';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Left leg
    ctx.beginPath();
    ctx.moveTo(-4, 4);
    ctx.lineTo(-4 - legSwing * 0.5, 12);
    ctx.lineTo(-4 + legSwing, 18);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(4 + legSwing * 0.5, 12);
    ctx.lineTo(4 - legSwing, 18);
    ctx.stroke();

    // Torso Chassis
    ctx.fillStyle = '#0e1428';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(10, -10);
    ctx.lineTo(8, 8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Jetpack on back
    ctx.fillStyle = '#1b223c';
    ctx.fillRect(-14, -8, 5, 14);

    // Cyber Visor / Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(2, -12, 7, 0, Math.PI * 2);
    ctx.fill();

    // Visor gleam
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, -14, 4, 3);
  }

  // 2. Quantum Mech
  drawQuantumMech(ctx, color, isGhost) {
    if (!isGhost) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = color;
    }

    // Armored outer shell
    ctx.fillStyle = '#121424';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(-14, -14);
    ctx.lineTo(14, -14);
    ctx.lineTo(16, 6);
    ctx.lineTo(0, 16);
    ctx.lineTo(-16, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing core reactor
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -2, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Photon Drone
  drawPhotonDrone(ctx, color, isGhost) {
    if (!isGhost) {
      ctx.shadowBlur = 16;
      ctx.shadowColor = color;
    }

    // Aerodynamic oval body
    ctx.fillStyle = '#101726';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Spinning Gyro Ring
    ctx.save();
    ctx.rotate(this.runCycle * 2);
    ctx.strokeStyle = 'rgba(255, 230, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Center optical sensor
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(6, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Void Glider
  drawVoidGlider(ctx, color, isGhost) {
    if (!isGhost) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
    }

    // Stealth Delta Wing
    ctx.fillStyle = '#0a0d18';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-14, -16);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dual Ion exhaust ports
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-14, -12, 3, 5);
    ctx.fillRect(-14, 7, 3, 5);
  }

  // 5. Singularity Core
  drawSingularityCore(ctx, color, isGhost) {
    if (!isGhost) {
      ctx.shadowBlur = 22;
      ctx.shadowColor = color;
    }

    // Orbital Energy Rings
    for (let r = 0; r < 2; r++) {
      ctx.save();
      ctx.rotate(this.runCycle * (r === 0 ? 1.5 : -1.8));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Core Orb
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawShield(ctx) {
    ctx.save();
    ctx.rotate(this.shieldAngle);
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff66';
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2.5;

    // Hexagonal Aegis Barrier
    ctx.beginPath();
    const sides = 6;
    const r = this.radius + 12;
    for (let i = 0; i < sides; i++) {
      const a = (i * Math.PI * 2) / sides;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Node dots
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < sides; i++) {
      const a = (i * Math.PI * 2) / sides;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

