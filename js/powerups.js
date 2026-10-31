/**
 * ANTIGRAV: VECTOR SURGE - Power-Ups & Quantum Shards
 * Includes: Time Slowdown, Aegis Shield, Double Score, Gravity Stabilization,
 * Overdrive Boost, Magnet Immunity, and Quantum Shards.
 */

const POWERUP_TYPES = {
  TIME_SLOW: {
    id: 'time_slow',
    name: 'CHRONO DILATOR',
    icon: '⏳',
    color: '#00f3ff',
    duration: 6.0,
    desc: 'Slows down time flow by 60%'
  },
  SHIELD: {
    id: 'shield',
    name: 'AEGIS SHIELD',
    icon: '🛡️',
    color: '#00ff66',
    duration: 15.0,
    desc: 'Absorbs one lethal obstacle impact'
  },
  DOUBLE_SCORE: {
    id: 'double_score',
    name: 'HYPER MULTIPLIER',
    icon: '⚡',
    color: '#ffe600',
    duration: 10.0,
    desc: 'Doubles all score and graze gains'
  },
  GRAV_STABILIZER: {
    id: 'grav_stabilizer',
    name: 'GYRO DAMPER',
    icon: '⚖️',
    color: '#9d00ff',
    duration: 8.0,
    desc: 'Stabilizes vertical momentum and prevents fatal drop'
  },
  OVERDRIVE: {
    id: 'overdrive',
    name: 'OVERDRIVE BOOST',
    icon: '🚀',
    color: '#ff007f',
    duration: 5.0,
    desc: 'Invulnerable hyper-dash vaporizing all hazards'
  },
  MAGNET_IMMUNITY: {
    id: 'magnet_immunity',
    name: 'PHASE MATRIX',
    icon: '🧲',
    color: '#ff7700',
    duration: 9.0,
    desc: 'Immune to magnetic pull + attracts all Shards'
  }
};

class PowerUp {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.type = null;
    this.radius = 18;
    this.active = false;
    this.animTime = Math.random() * Math.PI * 2;
    this.baseY = 0;
  }

  init(x, y, type) {
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.type = type;
    this.radius = type === 'shard' ? 12 : 20;
    this.active = true;
    this.animTime = Math.random() * Math.PI * 2;
  }

  update(dt, worldSpeed = 400, player = null) {
    this.animTime += dt * 3.5;
    this.x -= worldSpeed * dt;
    this.y = this.baseY + Math.sin(this.animTime) * 12;

    // Magnet attraction towards player if player has magnet immunity or is Singularity Core skin
    if (player && this.type === 'shard' && (player.hasMagnetImmunity || player.skinId === 'singularity_core')) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 320) {
        this.x += (dx / dist) * 600 * dt;
        this.y += (dy / dist) * 600 * dt;
      }
    }

    // Return false if off screen
    return this.x > -50;
  }

  checkCollision(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const hitDist = this.radius + player.radius;
    return (dx * dx + dy * dy) < (hitDist * hitDist);
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'shard') {
      // Quantum Shard / Crystal Gem
      const pulse = Math.sin(this.animTime * 2) * 0.2 + 0.8;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f3ff';
      ctx.fillStyle = '#00f3ff';
      ctx.rotate(this.animTime * 0.8);

      ctx.beginPath();
      ctx.moveTo(0, -this.radius * pulse);
      ctx.lineTo(this.radius * 0.7 * pulse, 0);
      ctx.lineTo(0, this.radius * pulse);
      ctx.lineTo(-this.radius * 0.7 * pulse, 0);
      ctx.closePath();
      ctx.fill();

      // Inner gleam
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Power-Up Orb with spinning orbital rings
      const pInfo = POWERUP_TYPES[this.type];
      const color = pInfo ? pInfo.color : '#00f3ff';

      ctx.shadowBlur = 18;
      ctx.shadowColor = color;

      // Outer pulsing ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + Math.sin(this.animTime * 3) * 3, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating orbital ring
      ctx.save();
      ctx.rotate(this.animTime * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius * 1.3, this.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Core orb
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Icon
      if (pInfo) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pInfo.icon, 0, 1);
      }
    }

    ctx.restore();
  }
}
