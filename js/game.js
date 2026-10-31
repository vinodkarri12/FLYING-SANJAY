/**
 * ANTIGRAV: VECTOR SURGE - Core Game Engine
 * Pure HTML5 Canvas, 60 FPS procedural runner, kinetic physics,
 * object pooling, and responsive multi-platform controls.
 */

class AntiGravGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Virtual internal resolution
    this.width = 1280;
    this.height = 720;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    // Boundary margins
    this.ceilingY = 64;
    this.floorY = 656;

    // Sub-systems
    this.physics = new PhysicsEngine();
    this.physics.setBoundaries(this.ceilingY, this.floorY);

    this.particles = new ParticleManager();
    this.background = new ParallaxBackground();
    this.player = new Player();
    this.ui = new UIManager(this);

    // Obstacle Pools
    this.gatePool = new ObjectPool(() => new RotatingGate(), 15);
    this.laserPool = new ObjectPool(() => new LaserWall(), 15);
    this.platformPool = new ObjectPool(() => new FloatingPlatform(), 15);
    this.magneticPool = new ObjectPool(() => new MagneticBarrier(), 15);
    this.stormPool = new ObjectPool(() => new EnergyStorm(), 10);
    this.vortexPool = new ObjectPool(() => new GravityVortex(), 10);

    // Power-up & Shard Pool
    this.powerupPool = new ObjectPool(() => new PowerUp(), 30);

    // Game State
    this.state = 'menu'; // 'menu', 'playing', 'paused', 'gameover'
    this.isPaused = false;
    this.isDailyRun = false;

    // Metrics
    this.score = 0;
    this.distance = 0;
    this.shardsCollected = 0;
    this.grazesCount = 0;
    this.flipsCount = 0;
    this.hazardsDestroyed = 0;

    // Combo system
    this.comboMult = 1;
    this.comboTimer = 0;
    this.comboMaxTime = 3.5;

    // World Speed & Difficulty Progression
    this.baseSpeed = 440; // px/s
    this.worldSpeed = 440;
    this.speedMultiplier = 1.0;

    // Procedural Spawner
    this.spawnDistanceTimer = 0;
    this.nextSpawnDistance = 380;
    this.currentSector = 'Sector 01: Neon Spire';
    this.specialZoneTimer = 0;
    this.specialZoneType = 'normal'; // 'normal', 'zero_g', 'reverse_chamber'

    // Camera Screen Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 18;

    // Loop Timing
    this.lastTime = performance.now();

    // Attach to global window
    window.game = this;

    this.initWindow();
    this.bindInputs();

    // Start render/update loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initWindow() {
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.parentElement.getBoundingClientRect();

      this.canvas.width = Math.floor(rect.width * dpr);
      this.canvas.height = Math.floor(rect.height * dpr);

      const scaleX = this.canvas.width / this.width;
      const scaleY = this.canvas.height / this.height;
      this.scale = Math.min(scaleX, scaleY);
      this.offsetX = Math.floor((this.canvas.width - this.width * this.scale) / 2);
      this.offsetY = Math.floor((this.canvas.height - this.height * this.scale) / 2);

      this.background.resize(this.width, this.height, this.ceilingY, this.floorY);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    resize();
  }

  bindInputs() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.onFlipAction();
      } else if (e.code === 'KeyE' || e.code === 'KeyF' || e.code === 'Enter') {
        e.preventDefault();
        this.onPulseAction();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        this.togglePause();
      }
    });

    // Canvas click / mouse
    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (e.button === 2) {
        // Right click -> Pulse
        this.onPulseAction();
      } else {
        // Left click -> Flip
        this.onFlipAction();
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Canvas touch handling (Tap = Flip, quick double tap or swipe up = Pulse)
    let touchStartTime = 0;
    let lastTapTime = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.target.closest('#mobile-controls') || e.target.closest('.modal-layer') || e.target.closest('.hud-group-right')) {
        return;
      }
      e.preventDefault();
      touchStartTime = performance.now();

      const currentTime = performance.now();
      const tapGap = currentTime - lastTapTime;
      if (tapGap < 260 && tapGap > 0) {
        // Double tap -> Pulse shockwave!
        this.onPulseAction();
      } else {
        // Single tap -> Flip gravity
        this.onFlipAction();
      }
      lastTapTime = currentTime;
    }, { passive: false });
  }

  onFlipAction() {
    if (this.state !== 'playing' || this.isPaused) return;

    this.player.flipGravity();
    this.physics.flipGravity();
    this.flipsCount++;

    // Combo streak for skillful flipping
    this.addScore(25);

    // Achievements check
    this.ui.unlockAchievement('first_flip');
    if (this.flipsCount >= 30) {
      this.ui.unlockAchievement('acrobat_30');
    }
  }

  onPulseAction() {
    if (this.state !== 'playing' || this.isPaused) return;
    const fired = this.player.triggerPulse();
    if (fired) {
      this.triggerScreenShake(10);
    }
  }

  onPlayerPulse(pulseX, pulseY, radius) {
    let clearedCount = 0;

    const checkAndClear = (pool) => {
      pool.forEach(obs => {
        if (!obs.destroyed && obs.onPulseHit(pulseX, pulseY, radius)) {
          clearedCount++;
          this.particles.emitExplosion(obs.x, obs.y, 25, ['#9d00ff', '#00f3ff', '#ffffff']);
          this.addScore(400 * this.comboMult);
          this.particles.addFloatingText(obs.x, obs.y - 20, '+400 PULSE!', '#9d00ff', 14);
        }
      });
    };

    checkAndClear(this.gatePool);
    checkAndClear(this.laserPool);
    checkAndClear(this.platformPool);
    checkAndClear(this.stormPool);
    checkAndClear(this.vortexPool);

    if (clearedCount > 0) {
      this.hazardsDestroyed += clearedCount;
      this.addCombo(1);
      if (this.hazardsDestroyed >= 5) {
        this.ui.unlockAchievement('pulse_break');
      }
    }
  }

  startRun(isDaily = false) {
    this.isDailyRun = isDaily;
    this.state = 'playing';
    this.isPaused = false;
    this.score = 0;
    this.distance = 0;
    this.shardsCollected = 0;
    this.grazesCount = 0;
    this.flipsCount = 0;
    this.hazardsDestroyed = 0;
    this.comboMult = 1;
    this.comboTimer = 0;

    this.baseSpeed = isDaily && this.ui.dailyMod.title.includes('CHRONO') ? 520 : 440;
    this.worldSpeed = this.baseSpeed;
    this.nextSpawnDistance = 350;
    this.spawnDistanceTimer = 0;

    // Apply Daily Challenge Modifiers
    if (isDaily && this.ui.dailyMod) {
      if (this.ui.dailyMod.title.includes('HYPER GRAVITY')) {
        this.physics.gravityMagnitude = 3000;
        this.player.pulseChargeRate = 35;
      } else if (this.ui.dailyMod.title.includes('ZERO-G')) {
        this.specialZoneTimer = 3.0; // Enters Zero-G almost immediately
      } else {
        this.physics.gravityMagnitude = 2200;
        this.player.pulseChargeRate = 22;
      }
    } else {
      this.physics.gravityMagnitude = 2200;
      this.player.pulseChargeRate = 22;
    }

    this.specialZoneTimer = 0;
    this.specialZoneType = 'normal';
    this.physics.inZeroG = false;
    this.physics.inReverseChamber = false;

    // Reset Entities & Pools
    this.clearAllEntities();
    this.player.reset(220, (this.ceilingY + this.floorY) / 2);
    this.physics.gravityDir = 1;

    // Background theme
    this.background.setZoneTheme('normal');

    // Audio soundtrack start
    soundEngine.startMusic();
  }

  clearAllEntities() {
    this.gatePool.releaseAll();
    this.laserPool.releaseAll();
    this.platformPool.releaseAll();
    this.magneticPool.releaseAll();
    this.stormPool.releaseAll();
    this.vortexPool.releaseAll();
    this.powerupPool.releaseAll();
    this.particles.clear();
  }

  togglePause() {
    if (this.state !== 'playing') return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.ui.showModal(this.ui.menuPause);
    } else {
      this.ui.hideModal(this.ui.menuPause);
    }
  }

  triggerScreenShake(intensity = 8) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  addScore(pts) {
    const multi = (this.player.hasDoubleScore ? 2 : 1) * this.comboMult;
    this.score += pts * multi;
  }

  addCombo(delta = 1) {
    this.comboMult = Math.min(10, this.comboMult + delta);
    this.comboTimer = this.comboMaxTime;
    if (this.comboMult >= 5) {
      this.ui.unlockAchievement('combo_5x');
    }
  }

  gameOver() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';

    soundEngine.stopMusic();
    soundEngine.playCrash();
    this.triggerScreenShake(20);

    // Explosion shards from player
    this.particles.emitExplosion(this.player.x, this.player.y, 50, ['#00f3ff', '#ff007f', '#ffffff', '#ffe600']);

    // Total shards saved
    this.ui.addShards(this.shardsCollected);

    setTimeout(() => {
      this.ui.showGameOver(this.score, this.distance, this.grazesCount, this.shardsCollected);
    }, 600);
  }

  // --- PROCEDURAL GENERATION DIRECTOR ---

  updateDirector(dt) {
    const distDelta = this.worldSpeed * dt * 0.05; // 1m per 20px
    this.distance += distDelta;
    this.addScore(distDelta * 10);

    // Check distance achievements
    if (this.distance >= 500) this.ui.unlockAchievement('dist_500');
    if (this.distance >= 1000) this.ui.unlockAchievement('dist_1000');
    if (this.distance >= 2500) this.ui.unlockAchievement('dist_2500');

    // Gradual speed progression
    const speedRamp = Math.min(320, this.distance * 0.07);
    const slowMoFactor = this.player.hasTimeSlow ? 0.42 : 1.0;
    this.worldSpeed = (this.baseSpeed + speedRamp) * slowMoFactor;

    // Sector transitions based on distance
    if (this.distance < 450) {
      this.currentSector = 'Sector 01: Neon Spire';
    } else if (this.distance < 1100) {
      this.currentSector = 'Sector 02: Magnetic Nexus';
    } else if (this.distance < 1900) {
      this.currentSector = 'Sector 03: Zero-G Abyss';
    } else if (this.distance < 3000) {
      this.currentSector = 'Sector 04: Singularity Core';
    } else {
      this.currentSector = 'Sector 05: Hyper Anomaly';
    }

    // Special Zone triggers (Zero-G Tunnels & Reverse Chambers)
    this.updateSpecialZones(dt);

    // Procedural Obstacle & Power-up Spawning
    this.spawnDistanceTimer += this.worldSpeed * dt;
    if (this.spawnDistanceTimer >= this.nextSpawnDistance) {
      this.spawnDistanceTimer = 0;
      this.spawnProceduralWave();

      // Dynamic gap pacing: higher speed = slightly tighter or rhythmic spacing
      const minGap = Math.max(280, 460 - this.distance * 0.04);
      this.nextSpawnDistance = minGap + Math.random() * 160;
    }
  }

  updateSpecialZones(dt) {
    this.specialZoneTimer -= dt;
    if (this.specialZoneTimer <= 0) {
      if (this.specialZoneType !== 'normal') {
        // Exit special zone back to normal
        this.specialZoneType = 'normal';
        this.physics.inZeroG = false;
        this.physics.inReverseChamber = false;
        this.background.setZoneTheme('normal');
        this.specialZoneTimer = 18 + Math.random() * 14;
      } else {
        // Chance to enter special zone once past 350m
        if (this.distance > 350 && Math.random() < 0.45) {
          const isZeroG = Math.random() > 0.4;
          this.specialZoneType = isZeroG ? 'zero_g' : 'reverse_chamber';
          this.physics.inZeroG = isZeroG;
          this.physics.inReverseChamber = !isZeroG;
          this.background.setZoneTheme(this.specialZoneType);
          this.specialZoneTimer = 9.0; // 9 seconds in special zone

          const zoneName = isZeroG ? 'WARNING: ZERO-G TUNNEL' : 'WARNING: REVERSE CHAMBER';
          this.particles.addFloatingText(this.width / 2, this.height * 0.4, zoneName, '#ff007f', 22);
        } else {
          this.specialZoneTimer = 10 + Math.random() * 8;
        }
      }
    }
  }

  spawnProceduralWave() {
    const spawnX = this.width + 120;
    const centerY = (this.ceilingY + this.floorY) / 2;

    // Determine available obstacle types based on sector
    const patterns = ['gate', 'laser', 'platform'];
    if (this.distance > 300) patterns.push('magnetic');
    if (this.distance > 600) patterns.push('storm');
    if (this.distance > 900) patterns.push('vortex');

    // Daily Modifier: Magnetic Firestorm
    if (this.isDailyRun && this.ui.dailyMod && this.ui.dailyMod.title.includes('MAGNETIC')) {
      patterns.push('magnetic', 'magnetic', 'vortex');
    }

    // Pick random pattern
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    switch (pattern) {
      case 'gate': {
        const gate = this.gatePool.acquire();
        const armCount = Math.random() > 0.5 ? 3 : 2;
        const rotSpeed = (Math.random() * 1.5 + 1.2) * (Math.random() > 0.5 ? 1 : -1);
        gate.init(spawnX, centerY + (Math.random() - 0.5) * 80, armCount, rotSpeed, 125);
        break;
      }

      case 'laser': {
        const laser = this.laserPool.acquire();
        const sweepSpeed = 180 + Math.min(160, this.distance * 0.05);
        laser.init(spawnX, this.ceilingY + 40, this.floorY - 40, sweepSpeed);
        break;
      }

      case 'platform': {
        const plat = this.platformPool.acquire();
        const platY = centerY + (Math.random() > 0.5 ? -100 : 100);
        const hasSpikesTop = Math.random() > 0.5;
        const hasSpikesBottom = !hasSpikesTop && Math.random() > 0.4;
        plat.init(spawnX, platY, 180, 26, hasSpikesTop, hasSpikesBottom);
        break;
      }

      case 'magnetic': {
        const mag = this.magneticPool.acquire();
        const isAttract = Math.random() > 0.5;
        const magY = Math.random() > 0.5 ? this.ceilingY + 110 : this.floorY - 110;
        mag.init(spawnX, magY, isAttract ? 'attract' : 'repel', 1500, 180);
        break;
      }

      case 'storm': {
        const storm = this.stormPool.acquire();
        storm.init(spawnX, centerY + (Math.random() - 0.5) * 160, 80);
        break;
      }

      case 'vortex': {
        const vortex = this.vortexPool.acquire();
        vortex.init(spawnX, centerY + (Math.random() - 0.5) * 120, 240);
        break;
      }
    }

    // Spawn Quantum Shard Arc or Power-Up
    this.spawnCollectibles(spawnX);
  }

  spawnCollectibles(spawnX) {
    // 15% chance for a Power-Up
    if (Math.random() < 0.16) {
      const pTypes = ['TIME_SLOW', 'SHIELD', 'DOUBLE_SCORE', 'GRAV_STABILIZER', 'OVERDRIVE', 'MAGNET_IMMUNITY'];
      const pKey = pTypes[Math.floor(Math.random() * pTypes.length)];
      const pUp = this.powerupPool.acquire();
      const pY = this.ceilingY + 80 + Math.random() * (this.floorY - this.ceilingY - 160);
      pUp.init(spawnX + 160, pY, pKey);
    } else {
      // Shard line / arc
      const shardCount = Math.floor(Math.random() * 4) + 3;
      const startY = Math.random() > 0.5 ? this.ceilingY + 60 : this.floorY - 60;
      const endY = startY < this.height / 2 ? this.floorY - 60 : this.ceilingY + 60;

      for (let i = 0; i < shardCount; i++) {
        const t = i / (shardCount - 1);
        const sx = spawnX + 140 + i * 45;
        // Parabolic arc following natural gravity flip curve
        const sy = startY + (endY - startY) * Math.sin(t * Math.PI * 0.5);
        const shard = this.powerupPool.acquire();
        shard.init(sx, sy, 'shard');
      }
    }
  }

  // --- MAIN LOOP ---

  loop(timestamp) {
    requestAnimationFrame((t) => this.loop(t));

    const dt = Math.min((timestamp - this.lastTime) * 0.001, 0.1);
    this.lastTime = timestamp;

    if (this.state === 'playing' && !this.isPaused) {
      this.update(dt, timestamp);
    } else {
      // Idle attract-mode animation when in menus or paused
      this.background.update(dt, 140);
      this.particles.update(dt, 140, this.width, this.height);
    }

    this.render(timestamp);
  }

  update(dt, timestamp) {
    // Combo decay
    if (this.comboMult > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboMult = 1;
      }
    }

    // Screen Shake decay
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }

    // Update Director (Pacing, speed, obstacles)
    this.updateDirector(dt);

    // Apply Physical forces to player
    this.physics.applyGravity(this.player, dt);

    // Gather active magnetic zones
    const activeMagnets = [];
    this.magneticPool.forEach(m => {
      if (m.active && !m.destroyed) activeMagnets.push(m);
    });
    this.physics.applyMagneticFields(this.player, activeMagnets, dt);

    // Surface collision with floor and ceiling
    this.physics.resolveBoundaryCollisions(this.player, (isCeiling, impactVy) => {
      // Surface hit impact
      this.particles.emitSparks(this.player.x, this.player.y + (isCeiling ? -16 : 16), isCeiling ? 1 : -1, 5, '#00f3ff');
    });

    // Update Player
    this.player.update(dt, this.worldSpeed / 400);

    // Update Background
    this.background.update(dt, this.worldSpeed);

    // Update Obstacles
    const updateObstaclePool = (pool) => {
      pool.forEach(obs => {
        const alive = obs.update(dt, this.worldSpeed);
        if (!alive) {
          pool.release(obs);
          return;
        }

        // Check graze near-miss
        if (obs.checkGraze(this.player)) {
          this.grazesCount++;
          soundEngine.playGraze();
          const grazePts = this.player.skinId === 'photon_drone' ? 220 : 150;
          this.addScore(grazePts);
          this.addCombo(1);
          this.particles.emitGrazeSparks(this.player.x, this.player.y);
          this.particles.addFloatingText(this.player.x, this.player.y - 24, `+${grazePts} GRAZE!`, '#00ff66', 13);

          if (this.grazesCount >= 10) this.ui.unlockAchievement('graze_10');
          if (this.grazesCount >= 30) this.ui.unlockAchievement('graze_30');
        }

        // Check lethal collision
        if (obs.checkCollision(this.player)) {
          this.handlePlayerCollision(obs);
        }
      });
    };

    updateObstaclePool(this.gatePool);
    updateObstaclePool(this.laserPool);
    updateObstaclePool(this.platformPool);
    updateObstaclePool(this.magneticPool);
    updateObstaclePool(this.stormPool);
    updateObstaclePool(this.vortexPool);

    // Update Power-ups & Shards
    this.powerupPool.forEach(p => {
      const alive = p.update(dt, this.worldSpeed, this.player);
      if (!alive) {
        this.powerupPool.release(p);
        return;
      }

      // Check pickup collision
      if (p.checkCollision(this.player)) {
        if (p.type === 'shard') {
          this.shardsCollected++;
          soundEngine.playCollect(Math.min(6, this.comboMult));
          this.addScore(100);
          this.addCombo(1);
          this.player.pulseEnergy = Math.min(this.player.pulseMax, this.player.pulseEnergy + 8);
          this.particles.emitSparks(p.x, p.y, 0, 8, '#00f3ff');

          if (this.shardsCollected >= 100) this.ui.unlockAchievement('shards_100');
          if (this.shardsCollected >= 500) this.ui.unlockAchievement('shards_500');
        } else {
          // Power-up pickup
          this.player.activatePowerup(POWERUP_TYPES[p.type].id);
          this.addScore(500);
          this.particles.emitShockwave(p.x, p.y, 90, POWERUP_TYPES[p.type].color);
          this.particles.addFloatingText(p.x, p.y - 30, POWERUP_TYPES[p.type].name, POWERUP_TYPES[p.type].color, 16);

          if (p.type === 'OVERDRIVE') this.ui.unlockAchievement('overdrive');
        }

        this.powerupPool.release(p);
      }
    });

    // Update Particles
    this.particles.update(dt, this.worldSpeed, this.width, this.height);

    // Update HUD
    const comboRatio = this.comboTimer / this.comboMaxTime;
    let zoneTitle = this.currentSector;
    if (this.specialZoneType === 'zero_g') zoneTitle = 'SECTOR: ZERO-G TUNNEL';
    if (this.specialZoneType === 'reverse_chamber') zoneTitle = 'SECTOR: REVERSE GRAV CHAMBER';

    this.ui.updateHUD(
      this.score,
      this.distance,
      this.shardsCollected,
      this.comboMult,
      comboRatio,
      this.player.pulseEnergy,
      this.player.gravityDir,
      this.player.powerups,
      zoneTitle
    );
  }

  handlePlayerCollision(obs) {
    // If Overdrive active: smash through obstacle unharmed!
    if (this.player.isOverdrive) {
      obs.destroyed = true;
      this.triggerScreenShake(8);
      this.particles.emitExplosion(obs.x, obs.y, 25, ['#ff007f', '#ffffff']);
      this.addScore(600 * this.comboMult);
      this.particles.addFloatingText(obs.x, obs.y - 20, '+600 OVERDRIVE SMASH!', '#ff007f', 15);
      return;
    }

    // If Aegis Shield active: absorb impact!
    if (this.player.hasShield) {
      delete this.player.powerups['shield'];
      this.player.hasShield = false;
      obs.destroyed = true;
      soundEngine.playShieldHit();
      this.triggerScreenShake(12);
      this.particles.emitShockwave(this.player.x, this.player.y, 140, '#00ff66');
      this.particles.addFloatingText(this.player.x, this.player.y - 35, 'SHIELD ABSORB!', '#00ff66', 16);
      this.ui.unlockAchievement('shield_save');
      return;
    }

    // Fatal Crash
    this.gameOver();
  }

  render(timestamp) {
    const ctx = this.ctx;
    ctx.save();

    // Clear outer canvas with dark backdrop
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Translate to center and scale virtual 1280x720 canvas
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Clip rendering strictly to virtual dimensions
    ctx.beginPath();
    ctx.rect(0, 0, this.width, this.height);
    ctx.clip();

    // Apply Camera Screen Shake
    if (this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Draw Parallax Background & Tracks
    this.background.draw(ctx, timestamp);

    // 2. Draw Obstacles
    const drawPool = (pool) => {
      pool.forEach(obs => obs.draw(ctx));
    };
    drawPool(this.gatePool);
    drawPool(this.laserPool);
    drawPool(this.platformPool);
    drawPool(this.magneticPool);
    drawPool(this.stormPool);
    drawPool(this.vortexPool);

    // 3. Draw Power-ups & Shards
    this.powerupPool.forEach(p => p.draw(ctx));

    // 4. Draw Particles & Trails
    this.particles.draw(ctx);

    // 5. Draw Player Rig
    if (this.state !== 'gameover') {
      this.player.draw(ctx);
    }

    // 6. Chromatic Aberration & Time Slow Distortion Effect
    if (this.player.hasTimeSlow) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(0, 243, 255, 0.08)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    ctx.restore();
  }
}

// Instantiate and start game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new AntiGravGame();
});
