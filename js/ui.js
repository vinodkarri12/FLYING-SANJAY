/**
 * ANTIGRAV: VECTOR SURGE - UI & State Management Engine
 * Handles Leaderboards, Skins shop, Achievements, Daily Challenges,
 * and HUD updates.
 */

const ACHIEVEMENTS_DEF = [
  { id: 'first_flip', title: 'First Inversion', desc: 'Perform your first gravity reversal', icon: '⇅' },
  { id: 'dist_500', title: 'Sub-Orbital', desc: 'Travel 500 meters in a single run', icon: '🚀' },
  { id: 'dist_1000', title: 'Kilometer Club', desc: 'Travel 1,000 meters in a single run', icon: '🛰️' },
  { id: 'dist_2500', title: 'Nexus Voyager', desc: 'Travel 2,500 meters in a single run', icon: '🌌' },
  { id: 'graze_10', title: 'Near Miss', desc: 'Perform 10 close graze dodges in a run', icon: '⚡' },
  { id: 'graze_30', title: 'Daredevil', desc: 'Perform 30 close graze dodges in a run', icon: '🎯' },
  { id: 'pulse_break', title: 'Pulse Breaker', desc: 'Destroy 5 hazards with Gravity Pulse', icon: '💥' },
  { id: 'overdrive', title: 'Hyper Overdrive', desc: 'Activate an Overdrive power-up boost', icon: '🔥' },
  { id: 'combo_5x', title: 'Combo Fiend', desc: 'Reach a 5x score combo multiplier', icon: '✨' },
  { id: 'shards_100', title: 'Crystal Miner', desc: 'Collect 100 total Quantum Shards', icon: '💎' },
  { id: 'shards_500', title: 'Shard Tycoon', desc: 'Collect 500 total Quantum Shards', icon: '👑' },
  { id: 'vortex_escape', title: 'Singularity Defier', desc: 'Escape a Gravity Vortex without crashing', icon: '🌀' },
  { id: 'acrobat_30', title: 'Gravity Acrobat', desc: 'Invert gravity 30 times in one run', icon: '🤸' },
  { id: 'shield_save', title: 'Aegis Protocol', desc: 'Survive a lethal hit with an active Shield', icon: '🛡️' },
  { id: 'daily_hero', title: 'Daily Champion', desc: 'Score over 12,000 in a Daily Challenge', icon: '📅' },
  { id: 'rig_collector', title: 'Customized Rig', desc: 'Unlock and equip a custom pilot rig', icon: '⚙️' }
];

class UIManager {
  constructor(game) {
    this.game = game;

    // DOM Elements
    this.hudScore = document.getElementById('hud-score');
    this.hudDistance = document.getElementById('hud-distance');
    this.hudShards = document.getElementById('hud-shards');
    this.hudSector = document.getElementById('hud-sector');
    this.hudCombo = document.getElementById('hud-combo');
    this.hudComboMulti = document.getElementById('hud-combo-multiplier');
    this.hudComboFill = document.getElementById('hud-combo-fill');
    this.hudPulseFill = document.getElementById('hud-pulse-fill');
    this.hudGravArrow = document.getElementById('hud-grav-arrow');
    this.hudGravLabel = document.getElementById('hud-grav-label');
    this.hudPowerups = document.getElementById('hud-powerups');

    // Modals
    this.menuStart = document.getElementById('menu-start');
    this.menuGameOver = document.getElementById('menu-gameover');
    this.menuPause = document.getElementById('menu-pause');
    this.modalLeaderboard = document.getElementById('modal-leaderboard');
    this.modalSkins = document.getElementById('modal-skins');
    this.modalDaily = document.getElementById('modal-daily');
    this.modalAchievements = document.getElementById('modal-achievements');
    this.modalHowTo = document.getElementById('modal-how-to');

    // Toast
    this.toast = document.getElementById('achievement-toast');
    this.toastTitle = document.getElementById('toast-title');
    this.toastIcon = document.getElementById('toast-icon');

    // Data Storage
    this.unlockedAchievements = JSON.parse(localStorage.getItem('antigrav_achievements') || '{}');
    this.leaderboard = JSON.parse(localStorage.getItem('antigrav_leaderboard') || 'null');
    if (!this.leaderboard) {
      this.leaderboard = [
        { name: 'VALKYRIE', score: 38400, distance: 2850, date: '2026-10-30' },
        { name: 'CYBER-9', score: 26800, distance: 2100, date: '2026-10-29' },
        { name: 'KINETIC', score: 18200, distance: 1540, date: '2026-10-28' },
        { name: 'NEO-PILOT', score: 12500, distance: 1120, date: '2026-10-27' },
        { name: 'ZERO-G', score: 8400, distance: 780, date: '2026-10-26' }
      ];
      this.saveLeaderboard();
    }

    this.unlockedSkins = JSON.parse(localStorage.getItem('antigrav_unlocked_skins') || '{"aero_runner": true}');
    this.totalShards = parseInt(localStorage.getItem('antigrav_total_shards') || '0', 10);
    this.highScore = parseInt(localStorage.getItem('antigrav_high_score') || '0', 10);

    // Initialize daily challenge data
    this.initDailyChallenge();

    this.bindEvents();
    this.updateStartMenuStats();
  }

  saveLeaderboard() {
    localStorage.setItem('antigrav_leaderboard', JSON.stringify(this.leaderboard));
  }

  addShards(amount) {
    this.totalShards += amount;
    localStorage.setItem('antigrav_total_shards', this.totalShards);
    this.updateStartMenuStats();
  }

  updateStartMenuStats() {
    const elHigh = document.getElementById('menu-high-score');
    const elShards = document.getElementById('menu-total-shards');
    if (elHigh) elHigh.textContent = this.highScore.toLocaleString();
    if (elShards) elShards.textContent = this.totalShards.toLocaleString();
  }

  initDailyChallenge() {
    const today = new Date().toISOString().slice(0, 10);
    this.todayKey = `antigrav_daily_${today}`;
    this.dailyBest = parseInt(localStorage.getItem(this.todayKey) || '0', 10);

    const elTitle = document.getElementById('daily-title');
    const elDesc = document.getElementById('daily-modifier-desc');
    const elBest = document.getElementById('daily-high-score');

    // Deterministic modifier based on date
    const daySeed = today.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
    const modifiers = [
      { title: 'HYPER GRAVITY SURGE', desc: 'Gravity magnitude +35%, Pulse recharge boosted 50%' },
      { title: 'ZERO-G GAUNTLET', desc: 'Frequent Zero-Gravity tunnels with high-speed laser sweeps' },
      { title: 'MAGNETIC FIRESTORM', desc: 'Vortexes and Magnetic zones appear twice as often' },
      { title: 'CHRONO OVERDRIVE', desc: 'Speed ramps 40% faster, Power-ups last double duration' }
    ];
    this.dailyMod = modifiers[daySeed % modifiers.length];

    if (elTitle) elTitle.textContent = this.dailyMod.title;
    if (elDesc) elDesc.textContent = this.dailyMod.desc;
    if (elBest) elBest.textContent = this.dailyBest.toLocaleString();
  }

  bindEvents() {
    // Menu buttons
    document.getElementById('btn-start-game').addEventListener('click', () => {
      soundEngine.playClick();
      this.hideModal(this.menuStart);
      this.game.startRun(false);
    });

    document.getElementById('btn-open-daily').addEventListener('click', () => {
      soundEngine.playClick();
      this.showModal(this.modalDaily);
    });

    document.getElementById('btn-start-daily').addEventListener('click', () => {
      soundEngine.playClick();
      this.hideModal(this.modalDaily);
      this.hideModal(this.menuStart);
      this.game.startRun(true);
    });

    document.getElementById('btn-open-skins').addEventListener('click', () => {
      soundEngine.playClick();
      this.renderSkinsModal();
      this.showModal(this.modalSkins);
    });

    document.getElementById('btn-open-leaderboard').addEventListener('click', () => {
      soundEngine.playClick();
      this.renderLeaderboard();
      this.showModal(this.modalLeaderboard);
    });

    document.getElementById('btn-open-achievements').addEventListener('click', () => {
      soundEngine.playClick();
      this.renderAchievementsModal();
      this.showModal(this.modalAchievements);
    });

    document.getElementById('btn-open-how-to').addEventListener('click', () => {
      soundEngine.playClick();
      this.showModal(this.modalHowTo);
    });

    // Close buttons for modals
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        soundEngine.playClick();
        const targetId = e.currentTarget.getAttribute('data-close');
        const targetModal = document.getElementById(targetId);
        if (targetModal) this.hideModal(targetModal);
      });
    });

    // Game Over buttons
    document.getElementById('btn-restart-game').addEventListener('click', () => {
      soundEngine.playClick();
      this.hideModal(this.menuGameOver);
      this.game.startRun(this.game.isDailyRun);
    });

    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
      soundEngine.playClick();
      this.hideModal(this.menuGameOver);
      this.showModal(this.menuStart);
      this.updateStartMenuStats();
    });

    document.getElementById('btn-save-score').addEventListener('click', () => {
      soundEngine.playClick();
      this.saveCurrentRecord();
    });

    // Pause buttons
    document.getElementById('btn-pause').addEventListener('click', () => {
      soundEngine.playClick();
      this.game.togglePause();
    });

    document.getElementById('btn-resume-game').addEventListener('click', () => {
      soundEngine.playClick();
      this.game.togglePause();
    });

    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      soundEngine.playClick();
      this.hideModal(this.menuPause);
      this.game.isPaused = false;
      this.game.startRun(this.game.isDailyRun);
    });

    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      soundEngine.playClick();
      this.hideModal(this.menuPause);
      this.game.isPaused = false;
      this.game.state = 'menu';
      this.showModal(this.menuStart);
      this.updateStartMenuStats();
    });

    // Audio & Fullscreen buttons
    const btnAudio = document.getElementById('btn-audio');
    btnAudio.addEventListener('click', () => {
      soundEngine.playClick();
      const muted = soundEngine.toggleMute();
      btnAudio.textContent = muted ? '🔇' : '🔊';
    });
    btnAudio.textContent = soundEngine.isMuted ? '🔇' : '🔊';

    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      soundEngine.playClick();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Mobile touch buttons
    const mFlip = document.getElementById('m-btn-flip');
    const mPulse = document.getElementById('m-btn-pulse');
    if (mFlip) {
      mFlip.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.onFlipAction();
      }, { passive: false });
    }
    if (mPulse) {
      mPulse.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.onPulseAction();
      }, { passive: false });
    }
  }

  showModal(el) {
    if (el) el.classList.remove('hidden');
  }

  hideModal(el) {
    if (el) el.classList.add('hidden');
  }

  updateHUD(score, distance, shards, comboMult, comboTimerRatio, pulseEnergy, gravityDir, activePowerups, sectorName) {
    this.hudScore.textContent = Math.floor(score).toString().padStart(5, '0');
    this.hudDistance.textContent = `${Math.floor(distance)} m`;
    this.hudShards.textContent = shards;

    // Combo
    if (comboMult > 1) {
      this.hudCombo.classList.add('active');
      this.hudComboMulti.textContent = `${comboMult}x`;
      this.hudComboFill.style.width = `${Math.max(0, Math.min(100, comboTimerRatio * 100))}%`;
    } else {
      this.hudCombo.classList.remove('active');
    }

    // Pulse Gauge
    const pulsePercent = Math.min(100, pulseEnergy);
    this.hudPulseFill.style.width = `${pulsePercent}%`;
    if (pulsePercent >= 100) {
      this.hudPulseFill.classList.add('ready');
    } else {
      this.hudPulseFill.classList.remove('ready');
    }

    // Gravity Indicator
    if (gravityDir === -1) {
      this.hudGravArrow.classList.add('up');
      this.hudGravLabel.textContent = 'INVERTED';
    } else {
      this.hudGravArrow.classList.remove('up');
      this.hudGravLabel.textContent = 'NORMAL';
    }

    // Sector Name
    if (this.hudSector.textContent !== sectorName) {
      this.hudSector.textContent = sectorName;
      if (sectorName.includes('ANOMALY') || sectorName.includes('ZERO-G') || sectorName.includes('REVERSE')) {
        this.hudSector.classList.add('special-zone');
      } else {
        this.hudSector.classList.remove('special-zone');
      }
    }

    // Active Powerups Shelf
    this.updatePowerupShelf(activePowerups);
  }

  updatePowerupShelf(activePowerups) {
    this.hudPowerups.innerHTML = '';
    for (const type in activePowerups) {
      const pInfo = POWERUP_TYPES[type];
      if (!pInfo) continue;
      const timeLeft = activePowerups[type];
      const maxTime = pInfo.duration;
      const fillPct = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));

      const badge = document.createElement('div');
      badge.className = 'powerup-badge';
      badge.style.borderLeftColor = pInfo.color;
      badge.innerHTML = `
        <span class="powerup-icon">${pInfo.icon}</span>
        <span class="powerup-name" style="color: ${pInfo.color}">${pInfo.name}</span>
        <div class="powerup-time-bar">
          <div class="powerup-time-fill" style="width: ${fillPct}%; background: ${pInfo.color};"></div>
        </div>
      `;
      this.hudPowerups.appendChild(badge);
    }
  }

  showGameOver(score, distance, grazes, shards) {
    document.getElementById('go-score').textContent = Math.floor(score).toLocaleString();
    document.getElementById('go-distance').textContent = `${Math.floor(distance)} m`;
    document.getElementById('go-grazes').textContent = grazes;
    document.getElementById('go-shards').textContent = shards;

    const banner = document.getElementById('gameover-record-banner');
    if (score > this.highScore) {
      this.highScore = Math.floor(score);
      localStorage.setItem('antigrav_high_score', this.highScore);
      banner.style.display = 'inline-block';
    } else {
      banner.style.display = 'none';
    }

    // If Daily Challenge run, update daily high
    if (this.game.isDailyRun) {
      if (score > this.dailyBest) {
        this.dailyBest = Math.floor(score);
        localStorage.setItem(this.todayKey, this.dailyBest);
      }
      if (score >= 12000) {
        this.unlockAchievement('daily_hero');
      }
    }

    this.showModal(this.menuGameOver);
  }

  saveCurrentRecord() {
    const input = document.getElementById('player-name-input');
    const name = (input.value || 'PILOT').toUpperCase().trim().slice(0, 8);
    const score = Math.floor(this.game.score);
    const distance = Math.floor(this.game.distance);
    const date = new Date().toISOString().slice(0, 10);

    this.leaderboard.push({ name, score, distance, date });
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 10);
    this.saveLeaderboard();

    const btn = document.getElementById('btn-save-score');
    btn.textContent = 'SAVED ✓';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'SAVE RECORD';
      btn.disabled = false;
    }, 2000);
  }

  renderLeaderboard() {
    const container = document.getElementById('leaderboard-container');
    container.innerHTML = '';
    this.leaderboard.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = `lb-entry ${idx === 0 ? 'top-1' : idx === 1 ? 'top-2' : idx === 2 ? 'top-3' : ''}`;
      row.innerHTML = `
        <span class="lb-rank">#${idx + 1}</span>
        <span class="lb-name">${entry.name} <span style="font-size: 10px; color: rgba(255,255,255,0.4); margin-left: 6px;">${entry.distance}m</span></span>
        <span class="lb-score">${entry.score.toLocaleString()}</span>
      `;
      container.appendChild(row);
    });
  }

  renderSkinsModal() {
    const container = document.getElementById('skins-container');
    container.innerHTML = '';
    document.getElementById('skin-modal-shards').textContent = this.totalShards.toLocaleString();

    for (const id in SKINS) {
      const s = SKINS[id];
      const isUnlocked = this.unlockedSkins[id] || s.cost === 0;
      const isSelected = this.game.player.skinId === id;

      const card = document.createElement('div');
      card.className = `skin-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;

      let btnLabel = isSelected ? 'EQUIPPED' : isUnlocked ? 'SELECT' : `${s.cost} 💎`;

      card.innerHTML = `
        <div class="skin-preview">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${s.color}; box-shadow: 0 0 15px ${s.color};"></div>
        </div>
        <div class="skin-name" style="color: ${s.color};">${s.name}</div>
        <div style="font-size: 10px; color: rgba(255,255,255,0.6);">${s.perk}</div>
        <div class="skin-status" style="margin-top: 6px; font-weight: 800;">${btnLabel}</div>
      `;

      card.addEventListener('click', () => {
        soundEngine.playClick();
        if (isUnlocked) {
          this.game.player.setSkin(id);
          this.renderSkinsModal();
          this.unlockAchievement('rig_collector');
        } else if (this.totalShards >= s.cost) {
          this.totalShards -= s.cost;
          localStorage.setItem('antigrav_total_shards', this.totalShards);
          this.unlockedSkins[id] = true;
          localStorage.setItem('antigrav_unlocked_skins', JSON.stringify(this.unlockedSkins));
          this.game.player.setSkin(id);
          this.renderSkinsModal();
          this.unlockAchievement('rig_collector');
        } else {
          // Insufficient funds alert
          card.style.borderColor = '#ff007f';
          setTimeout(() => {
            card.style.borderColor = '';
          }, 400);
        }
      });

      container.appendChild(card);
    }
  }

  renderAchievementsModal() {
    const container = document.getElementById('achievements-container');
    container.innerHTML = '';

    ACHIEVEMENTS_DEF.forEach(ach => {
      const isUnlocked = !!this.unlockedAchievements[ach.id];
      const item = document.createElement('div');
      item.className = `achieve-item ${isUnlocked ? 'unlocked' : ''}`;
      item.innerHTML = `
        <div class="achieve-icon">${ach.icon}</div>
        <div class="achieve-details">
          <div class="achieve-title" style="color: ${isUnlocked ? 'var(--neon-green)' : '#fff'};">${ach.title}</div>
          <div class="achieve-desc">${ach.desc}</div>
        </div>
        <div style="font-size: 12px; font-weight: 800; color: ${isUnlocked ? 'var(--neon-green)' : 'rgba(255,255,255,0.3)'};">
          ${isUnlocked ? 'COMPLETED' : 'LOCKED'}
        </div>
      `;
      container.appendChild(item);
    });
  }

  unlockAchievement(id) {
    if (this.unlockedAchievements[id]) return;
    const ach = ACHIEVEMENTS_DEF.find(a => a.id === id);
    if (!ach) return;

    this.unlockedAchievements[id] = true;
    localStorage.setItem('antigrav_achievements', JSON.stringify(this.unlockedAchievements));

    // Show celebratory toast & sound
    soundEngine.playAchievement();
    this.toastIcon.textContent = ach.icon;
    this.toastTitle.textContent = ach.title;
    this.toast.classList.add('show');

    setTimeout(() => {
      this.toast.classList.remove('show');
    }, 3800);
  }
}

