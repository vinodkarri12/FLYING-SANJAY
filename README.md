# 🔥 FLYING SANJAY (AAA QUALITY)

A cinematic, energetic, and hilarious Telugu meme-style flying arcade game built with **pure HTML5 Canvas, modern CSS3, and vanilla JavaScript**.

![Flying Sanjay](assets/sanjay_2.jpg)

---

## 🌟 Game Highlights & Master Features

### 1. Authentic Hero Character (100% Sanjay)
- Features the real, uploaded photographs of **Sanjay**:
  - **Hero Flyer & Start Screen Portrait**: Close-up portrait with neon blue energetic border (`assets/sanjay_2.jpg`).
  - **Game Over Fail Portrait**: Laughing meme action pose with pulsating orange aura (`assets/sanjay_3.jpg`).
  - **Holographic Billboard & Skyline**: Floating billboard celebrating Sanjay in the background city skyline (`assets/sanjay_1.jpg`).
- Zero placeholder or unrelated celebrity images. Includes built-in Base64 fallbacks so the game loads instantly even offline or on `file:///` without server requirements.
- Superhero flying red cape, dynamic tilt rotation (upward climb when flapping, natural nose-dive downward), funny face wobble, and particle jet trail.

### 2. Professional Gaming Start Screen
- Dark navy blue and obsidian black gradient background with dynamic neon grid lines.
- Bold 3D glowing title:
  ```
  FLYING
  SANJAY
  ```
- Sanjay's hero portrait in a glowing hexagonal neon frame (`#00d4ff`).
- Signature Telugu meme punchline:
  ```
  "పిల్ల బచ్చానాయాలా!"
  ```
- Glowing blue **PLAY GAME** button with pulse animation and tactile vibration:
  ```
  START చాయ్ కాపోతే మీ నాన్న మీద ఒట్టు 🚀
  ```

### 3. Smooth Flappy Bird-Style Gameplay
- **Fluid Flight Physics**:
  - Continuous downward gravity.
  - Tapping mobile screen, clicking mouse, or pressing <kbd>Space</kbd> / <kbd>▲ Up</kbd> flaps upward.
  - Smooth pitch angle interpolation (-25° climb to +70° dive).
- **Procedural Obstacles (Giant Milk Bottles)**:
  - 100% Giant Milk Bottles with tapered glass necks and blue labels reading **"DSP MILK"**.
  - Top & bottom obstacle pairs with randomized gap heights.
  - **20% Golden Milk Bottle Chance**: Spawns shiny golden bottles granting **+5 BONUS POINTS**, golden sparkle bursts, and chime sounds!
- **Parallax Cyberpunk / Telugu Mass Atmosphere**:
  - Glowing moon and twinkling starry cosmos.
  - Repeated transparent neon **"DSP"** watermark text floating in the night sky.
  - Moving volumetric clouds.
  - Futuristic neon cityscape skyline with illuminated windows and Sanjay's holographic billboard.

### 4. Theatrical Game Over Screen
- Immediate collision freeze with cinematic red flash and heavy camera shake.
- Dramatic 2.2x zoom onto Sanjay's laughing photo (`sanjay_3.jpg`).
- Bold fiery failure title: `💀 YOU FAILED! 💀`.
- Laughing Sanjay portrait with glowing orange solar flare aura (`#ff6b00`).
- **Telugu Meme Failure Audio**:
  - Speaks `"పిల్ల బచ్చానాయాలా!"` automatically on collision via Web Speech API and synthesized punchy audio.
- Animated Scoreboard displaying:
  - **SCORE**: Points earned in current run.
  - **BEST SCORE**: Persisted locally in `localStorage`.
  - **★ NEW RECORD! ★** celebratory badge with confetti explosion.
- Large glowing blue button:
  ```
  మళ్ళీ ట్రై చెయ్ రా! (PLAY AGAIN) 🔄
  ```

### 5. High-Energy Devi Sri Prasad (DSP) Mass Audio Engine
- Built-in Web Audio API synthesizer that dynamically generates:
  - **Devi Sri Prasad (DSP) style mass dance beats**: Energetic dappu/dholak drum rhythms, punchy 808 bass, brass fanfares, and crowd whistles.
  - **SFX**: Flap wind swoosh, bottle pass chime, golden bottle bonus fanfare, crash hit impact, and record celebration.
- **Custom BGM Support**: Drop any audio file named `assets/bgm.mp3` or click **`🎵 Change Song`** in the top bar to load any MP3/WAV from your device!
- **Music ON/OFF toggle** button available during gameplay and on menus.

---

## 🕹️ Controls

| Action | Mobile / Tablet | PC / Mac Keyboard | Mouse |
| :--- | :--- | :--- | :--- |
| **Flap / Jump** | Tap anywhere on screen | <kbd>Space</kbd>, <kbd>W</kbd>, or <kbd>▲ Up Arrow</kbd> | Left Click |
| **Start / Restart** | Tap Play Button | <kbd>Enter</kbd> or <kbd>Space</kbd> | Click Play Button |
| **Mute / Unmute** | Tap 🎵 button | <kbd>M</kbd> | Click 🎵 button |
| **Upload Custom Photo** | Tap 📸 button | - | Click 📸 button |

---

## 🚀 How to Run Locally

### Option 1: Direct File Open
Double click [`index.html`](file:///c:/Users/vinod/OneDrive/sanjay/index.html) or right-click and choose **Open with Google Chrome / Microsoft Edge / Firefox / Safari**.

### Option 2: Local HTTP Server (Recommended)
Using Python:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

Using Node.js:
```bash
npx serve .
```

---

## 🌐 How to Publish to GitHub Pages (Free Hosting)

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "feat: AAA Flying Sanjay Telugu Meme Arcade Game"
   ```

2. **Create a GitHub Repository**:
   - Go to [GitHub.com/new](https://github.com/new).
   - Name your repo `flying-sanjay`.
   - Leave it **Public**.
   - Click **Create repository**.

3. **Push your code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/flying-sanjay.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**:
   - In your GitHub repository, click **Settings** (top tab).
   - In the left sidebar, click **Pages**.
   - Under **Build and deployment > Source**, select **Deploy from a branch**.
   - Under **Branch**, select `main` and `/ (root)`, then click **Save**.
   - In ~60 seconds, your game will be live at:
     ```
     https://YOUR_USERNAME.github.io/flying-sanjay/
     ```

---

## 📁 Project Structure

```
├── index.html                 # Complete, self-contained AAA playable game
├── assets/
│   ├── sanjay_1.jpg           # White shirt smiling portrait (Hologram billboard)
│   ├── sanjay_2.jpg           # Close-up hero portrait (Player character & Start screen)
│   ├── sanjay_3.jpg           # Laughing action pose (Game Over fail screen)
│   ├── sanjay.jpg             # Primary avatar shortcut
│   └── sanjay_base64.json     # Embedded offline base64 data for fail-safe rendering
├── README.md                  # Comprehensive game documentation
└── template.html              # Source template
```

Enjoy playing **FLYING SANJAY**! 🚀🍼✨
