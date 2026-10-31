/**
 * ANTIGRAV: VECTOR SURGE - Parallax Environment & Dynamic Lighting
 * Futuristic multi-layered parallax world with floating anti-gravity mega-islands,
 * cyber skyline, neon energy conduits, and inverted waterfalls.
 */

class ParallaxBackground {
  constructor() {
    this.width = 1280;
    this.height = 720;
    this.ceilingY = 60;
    this.floorY = 660;

    // Layer scroll offsets
    this.nebulaOffset = 0;
    this.cityOffset = 0;
    this.islandsOffset = 0;
    this.conduitsOffset = 0;
    this.foregroundOffset = 0;

    // Procedural Skyline data
    this.skylineBuildings = [];
    this.generateSkyline();

    // Floating Islands data
    this.floatingIslands = [];
    this.generateFloatingIslands();

    // Flying cyber vehicles
    this.skyVehicles = [];
    this.initSkyVehicles();

    // Neon colors
    this.theme = {
      primary: '#00f3ff',
      secondary: '#9d00ff',
      accent: '#ff007f',
      grid: 'rgba(0, 243, 255, 0.15)',
      skyTop: '#070914',
      skyBottom: '#10142e'
    };
  }

  resize(w, h, ceilingY, floorY) {
    this.width = w;
    this.height = h;
    this.ceilingY = ceilingY;
    this.floorY = floorY;
  }

  setZoneTheme(zoneType) {
    if (zoneType === 'zero_g') {
      this.theme.primary = '#9d00ff';
      this.theme.secondary = '#ff007f';
      this.theme.grid = 'rgba(157, 0, 255, 0.2)';
      this.theme.skyTop = '#140520';
      this.theme.skyBottom = '#240b3b';
    } else if (zoneType === 'reverse_chamber') {
      this.theme.primary = '#ff7700';
      this.theme.secondary = '#ffe600';
      this.theme.grid = 'rgba(255, 119, 0, 0.2)';
      this.theme.skyTop = '#1f0900';
      this.theme.skyBottom = '#331200';
    } else {
      // Normal Neon Metropolis
      this.theme.primary = '#00f3ff';
      this.theme.secondary = '#9d00ff';
      this.theme.grid = 'rgba(0, 243, 255, 0.15)';
      this.theme.skyTop = '#070914';
      this.theme.skyBottom = '#10142e';
    }
  }

  generateSkyline() {
    this.skylineBuildings = [];
    let x = 0;
    while (x < 2560) {
      const w = Math.random() * 80 + 50;
      const h = Math.random() * 260 + 140;
      const windows = [];
      const rows = Math.floor(h / 16);
      const cols = Math.floor(w / 12);
      for (let r = 2; r < rows; r++) {
        for (let c = 1; c < cols - 1; c++) {
          if (Math.random() > 0.45) {
            windows.push({ r, c });
          }
        }
      }

      this.skylineBuildings.push({
        x,
        w,
        h,
        windows,
        spire: Math.random() > 0.5,
        hologram: Math.random() > 0.75
      });
      x += w + Math.random() * 20;
    }
  }

  generateFloatingIslands() {
    this.floatingIslands = [];
    let x = 0;
    while (x < 2560) {
      this.floatingIslands.push({
        x,
        y: Math.random() * 300 + 200,
        width: Math.random() * 140 + 90,
        height: Math.random() * 50 + 35,
        pulseOffset: Math.random() * Math.PI * 2,
        crystalType: Math.random() > 0.5 ? 'cyan' : 'purple'
      });
      x += Math.random() * 320 + 240;
    }
  }

  initSkyVehicles() {
    this.skyVehicles = [];
    for (let i = 0; i < 6; i++) {
      this.skyVehicles.push({
        x: Math.random() * 1280,
        y: Math.random() * 240 + 120,
        speed: (Math.random() * 120 + 70) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 10 + 6,
        color: Math.random() > 0.5 ? '#00f3ff' : '#ff007f'
      });
    }
  }

  update(dt, worldSpeed = 400) {
    this.nebulaOffset = (this.nebulaOffset + worldSpeed * 0.05 * dt) % this.width;
    this.cityOffset = (this.cityOffset + worldSpeed * 0.2 * dt) % 2560;
    this.islandsOffset = (this.islandsOffset + worldSpeed * 0.45 * dt) % 2560;
    this.conduitsOffset = (this.conduitsOffset + worldSpeed * 0.7 * dt) % 400;
    this.foregroundOffset = (this.foregroundOffset + worldSpeed * dt) % 80;

    // Update sky vehicles
    for (let i = 0; i < this.skyVehicles.length; i++) {
      const v = this.skyVehicles[i];
      v.x += v.speed * dt;
      if (v.speed > 0 && v.x > this.width + 50) v.x = -50;
      if (v.speed < 0 && v.x < -50) v.x = this.width + 50;
    }
  }

  draw(ctx, timestamp = 0) {
    // 1. Deep Space Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, this.theme.skyTop);
    skyGrad.addColorStop(1, this.theme.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Cosmic Digital Grid / Aurora
    this.drawDigitalAurora(ctx, timestamp);

    // 3. Parallax Skyline Layer
    this.drawSkyline(ctx);

    // 4. Floating Anti-Gravity Mega-Islands
    this.drawFloatingIslands(ctx, timestamp);

    // 5. Sky traffic / Flying aerocars
    this.drawSkyVehicles(ctx);

    // 6. Near Background Guide Rails & Conduits
    this.drawEnergyRings(ctx, timestamp);

    // 7. Foreground Floor & Ceiling Tracks
    this.drawTracks(ctx, timestamp);
  }

  drawDigitalAurora(ctx, timestamp) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    const time = timestamp * 0.001;

    // Curved wavy sine mesh
    ctx.strokeStyle = this.theme.secondary;
    ctx.lineWidth = 1.5;
    for (let j = 0; j < 3; j++) {
      ctx.beginPath();
      for (let x = 0; x <= this.width; x += 40) {
        const y = this.height * 0.4 + Math.sin(x * 0.005 + time + j) * 50 + Math.cos(x * 0.01 - time * 0.5) * 25;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSkyline(ctx) {
    ctx.save();
    ctx.translate(-this.cityOffset, 0);

    // Draw twice for seamless wrapping
    for (let loop = 0; loop < 2; loop++) {
      const loopX = loop * 2560;
      for (let i = 0; i < this.skylineBuildings.length; i++) {
        const b = this.skylineBuildings[i];
        const bx = loopX + b.x;
        const by = this.height - b.h - 50;

        if (bx + b.w < -100 || bx > this.width + 2560) continue;

        // Silhouette with neon edge
        ctx.fillStyle = '#0a0d1e';
        ctx.fillRect(bx, by, b.w, b.h);

        ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, b.w, b.h);

        // Windows
        ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
        for (let w = 0; w < b.windows.length; w++) {
          const win = b.windows[w];
          ctx.fillRect(bx + win.c * 12, by + win.r * 16, 6, 8);
        }

        // Rooftop spire beacon
        if (b.spire) {
          ctx.strokeStyle = this.theme.primary;
          ctx.beginPath();
          ctx.moveTo(bx + b.w / 2, by);
          ctx.lineTo(bx + b.w / 2, by - 30);
          ctx.stroke();

          ctx.fillStyle = '#ff007f';
          ctx.beginPath();
          ctx.arc(bx + b.w / 2, by - 30, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Holographic Billboard
        if (b.hologram) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = this.theme.primary;
          ctx.font = '800 12px "Orbitron", sans-serif';
          ctx.fillText('NEXUS-9', bx + 6, by + 40);
          ctx.restore();
        }
      }
    }
    ctx.restore();
  }

  drawFloatingIslands(ctx, timestamp) {
    ctx.save();
    ctx.translate(-this.islandsOffset, 0);
    const time = timestamp * 0.001;

    for (let loop = 0; loop < 2; loop++) {
      const loopX = loop * 2560;
      for (let i = 0; i < this.floatingIslands.length; i++) {
        const isl = this.floatingIslands[i];
        const bob = Math.sin(time * 1.5 + isl.pulseOffset) * 8;
        const ix = loopX + isl.x;
        const iy = isl.y + bob;

        if (ix + isl.width < -150 || ix > this.width + 2560) continue;

        // Island Body (angular polygon)
        ctx.fillStyle = '#14182e';
        ctx.strokeStyle = isl.crystalType === 'cyan' ? 'rgba(0, 243, 255, 0.4)' : 'rgba(157, 0, 255, 0.4)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(ix, iy);
        ctx.lineTo(ix + isl.width * 0.2, iy - isl.height * 0.4);
        ctx.lineTo(ix + isl.width * 0.8, iy - isl.height * 0.4);
        ctx.lineTo(ix + isl.width, iy);
        ctx.lineTo(ix + isl.width * 0.65, iy + isl.height);
        ctx.lineTo(ix + isl.width * 0.35, iy + isl.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing crystal core on underside
        ctx.fillStyle = isl.crystalType === 'cyan' ? '#00f3ff' : '#9d00ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(ix + isl.width * 0.5, iy + isl.height * 0.6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inverted Neon Waterfall (liquid light flowing upward into the clouds!)
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = this.theme.primary;
        ctx.fillRect(ix + isl.width * 0.45, iy - 70, 4, 60);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  drawSkyVehicles(ctx) {
    ctx.save();
    for (let i = 0; i < this.skyVehicles.length; i++) {
      const v = this.skyVehicles[i];
      ctx.fillStyle = v.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = v.color;

      ctx.beginPath();
      ctx.ellipse(v.x, v.y, v.size, v.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Exhaust streak
      ctx.strokeStyle = v.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(v.x, v.y);
      ctx.lineTo(v.x - (v.speed > 0 ? 25 : -25), v.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawEnergyRings(ctx, timestamp) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
    ctx.lineWidth = 2;

    const ringSpacing = 300;
    const startX = -(this.conduitsOffset);

    for (let x = startX; x < this.width + ringSpacing; x += ringSpacing) {
      ctx.beginPath();
      ctx.ellipse(x, this.height * 0.5, 45, 140, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTracks(ctx, timestamp) {
    ctx.save();

    // Ceiling Track
    const ceilH = this.ceilingY;
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(0, 0, this.width, ceilH);

    // Ceiling Neon Strip
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.theme.primary;
    ctx.fillStyle = this.theme.primary;
    ctx.fillRect(0, ceilH - 4, this.width, 4);

    // Ceiling Hazard Chevrons
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.shadowBlur = 0;
    const chevronStep = 40;
    const offset = this.foregroundOffset;
    for (let x = -offset; x < this.width + chevronStep; x += chevronStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 15, ceilH - 6);
      ctx.lineTo(x + 25, ceilH - 6);
      ctx.lineTo(x + 10, 0);
      ctx.fill();
    }

    // Floor Track
    const floorH = this.height - this.floorY;
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(0, this.floorY, this.width, floorH);

    // Floor Neon Strip
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.theme.primary;
    ctx.fillStyle = this.theme.primary;
    ctx.fillRect(0, this.floorY, this.width, 4);

    // Floor Hazard Chevrons
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.shadowBlur = 0;
    for (let x = -offset; x < this.width + chevronStep; x += chevronStep) {
      ctx.beginPath();
      ctx.moveTo(x, this.height);
      ctx.lineTo(x + 15, this.floorY + 6);
      ctx.lineTo(x + 25, this.floorY + 6);
      ctx.lineTo(x + 10, this.height);
      ctx.fill();
    }

    ctx.restore();
  }
}

