/**
 * ANTIGRAV: VECTOR SURGE - Particle System
 * Manages trails, ceiling sparks, explosion debris, shockwave rings, and floating text.
 */

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 2;
    this.color = '#00f3ff';
    this.alpha = 1.0;
    this.decay = 0.02;
    this.type = 'circle'; // 'circle', 'spark', 'ring', 'shard'
    this.rotation = 0;
    this.vRot = 0;
    this.maxLife = 1.0;
    this.life = 1.0;
    this.glow = false;
  }

  init(x, y, vx, vy, size, color, decay, type = 'circle', glow = true) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.decay = decay;
    this.type = type;
    this.glow = glow;
    this.alpha = 1.0;
    this.life = 1.0;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 8;
  }

  update(dt, speedFactor = 1) {
    this.x += this.vx * dt * speedFactor;
    this.y += this.vy * dt * speedFactor;
    this.rotation += this.vRot * dt;
    this.life -= this.decay * dt * 60;
    this.alpha = Math.max(0, this.life);
    return this.life > 0;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;

    if (this.glow) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
    }

    if (this.type === 'circle') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'spark') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(1, this.size * 0.7);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
      ctx.stroke();
    } else if (this.type === 'shard') {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(-this.size, -this.size * 0.5);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(-this.size * 0.5, this.size);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'ring') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(1, this.size * 0.15 * this.life);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (1.2 - this.life * 0.2), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

class FloatingText {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vy = -60;
    this.text = '';
    this.color = '#ffe600';
    this.alpha = 1.0;
    this.life = 1.0;
    this.decay = 0.025;
    this.size = 14;
  }

  init(x, y, text, color = '#ffe600', size = 14) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.vy = -60;
    this.life = 1.0;
    this.alpha = 1.0;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.life -= this.decay * dt * 60;
    this.alpha = Math.max(0, this.life);
    return this.life > 0;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.font = `800 ${this.size}px 'Orbitron', sans-serif`;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

class ParticleManager {
  constructor() {
    this.particlePool = new ObjectPool(() => new Particle(), 300);
    this.textPool = new ObjectPool(() => new FloatingText(), 40);
    this.ambientMotes = [];
    this.initAmbientMotes(50);
  }

  initAmbientMotes(count) {
    this.ambientMotes = [];
    for (let i = 0; i < count; i++) {
      this.ambientMotes.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 60 + 20,
        alpha: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.4 ? '#00f3ff' : '#9d00ff'
      });
    }
  }

  emitTrail(x, y, color = '#00f3ff', size = 3) {
    const p = this.particlePool.acquire();
    const vx = -Math.random() * 120 - 60;
    const vy = (Math.random() - 0.5) * 40;
    p.init(x, y, vx, vy, size, color, 0.045, 'circle', true);
  }

  emitSparks(x, y, dirY = 1, count = 6, color = '#ffe600') {
    for (let i = 0; i < count; i++) {
      const p = this.particlePool.acquire();
      const vx = -Math.random() * 200 - 100;
      const vy = (Math.random() * 150 + 40) * dirY;
      p.init(x, y, vx, vy, Math.random() * 3 + 2, color, 0.05, 'spark', true);
    }
  }

  emitShockwave(x, y, maxRadius = 180, color = '#9d00ff') {
    const p = this.particlePool.acquire();
    p.init(x, y, 0, 0, maxRadius, color, 0.028, 'ring', true);
  }

  emitExplosion(x, y, count = 35, colors = ['#00f3ff', '#ff007f', '#ffffff', '#ffe600']) {
    for (let i = 0; i < count; i++) {
      const p = this.particlePool.acquire();
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 380 + 80;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = colors[Math.floor(Math.random() * colors.length)];
      p.init(x, y, vx, vy, Math.random() * 5 + 3, color, Math.random() * 0.025 + 0.015, 'shard', true);
    }
  }

  emitGrazeSparks(x, y) {
    for (let i = 0; i < 10; i++) {
      const p = this.particlePool.acquire();
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 160 + 50;
      p.init(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 3, '#00ff66', 0.04, 'spark', true);
    }
  }

  addFloatingText(x, y, text, color = '#ffe600', size = 14) {
    const ft = this.textPool.acquire();
    ft.init(x, y, text, color, size);
  }

  update(dt, worldSpeed = 400, width = 1280, height = 720) {
    // Update active particles
    this.particlePool.forEach((p) => {
      const alive = p.update(dt);
      if (!alive) {
        this.particlePool.release(p);
      }
    });

    // Update active floating texts
    this.textPool.forEach((ft) => {
      const alive = ft.update(dt);
      if (!alive) {
        this.textPool.release(ft);
      }
    });

    // Update ambient motes
    for (let i = 0; i < this.ambientMotes.length; i++) {
      const m = this.ambientMotes[i];
      m.x -= (m.speed + worldSpeed * 0.2) * dt;
      if (m.x < 0) {
        m.x = width + Math.random() * 50;
        m.y = Math.random() * height;
      }
    }
  }

  draw(ctx) {
    // Draw ambient motes
    for (let i = 0; i < this.ambientMotes.length; i++) {
      const m = this.ambientMotes[i];
      ctx.fillStyle = m.color;
      ctx.globalAlpha = m.alpha;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;

    // Draw particles
    this.particlePool.forEach((p) => {
      p.draw(ctx);
    });

    // Draw floating texts
    this.textPool.forEach((ft) => {
      ft.draw(ctx);
    });
  }

  clear() {
    this.particlePool.releaseAll();
    this.textPool.releaseAll();
  }
}

