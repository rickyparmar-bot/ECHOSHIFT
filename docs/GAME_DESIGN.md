# 📄 ECHOSHIFT: Game Design & Core Loop

## 🕹️ Core Loop
1. **Explore:** Move through the pitch-black abyss using `WASD`.
2. **Ping:** Press `SPACE` to emit a sonar pulse. This reveals walls, treasures, and enemies in a glowing wireframe (e.g., `#00ffcc`).
3. **Salvage:** Use the `GravityClaw` to pick up Data Cores.
4. **Survive:** Manage battery (sonar) and oxygen (movement). Avoid "Blind Hunters"—massive shadows that follow the sound of your pings.
5. **Extract:** Reach the surface or a safe-point to upload data.

## 🎨 Visual Identity
- **Environment:** Pure black (`#000000`).
- **Echoes:** Neon green/cyan (`#00ffcc`) or vibrant magenta (`#ff00ff`) wireframes that fade over 2 seconds.
- **HUD (Attractive UI):**
  - **Glassmorphism:** Frosted glass panels with thin neon borders.
  - **Flickering CRT Effect:** Subtle scanlines and chromatic aberration.
  - **Depth Meter:** A scrolling bar on the right showing your depth.
  - **Radar Mini-map:** A circular HUD element that pings in sync with the player.
  - **Stress Monitor:** A heartbeat-style EKG that accelerates when enemies are near.

## ⚙️ Physics (Beneath the Surface)
- **Fluid Dynamics:** Movement has weight; you drift slightly after stopping.
- **Wave Reflection:** Sonar pulses bounce off walls, revealing hidden crevices.
- **Acoustic Stealth:** Moving slowly (Shift) reduces the "noise" you make, allowing you to bypass hunters.

## 🌌 Antigravity Integration (Theoretical)
- **EchoNet Module:** Sound modulation for in-game pings.
- **NeuralHash Module:** For seeding the procedural generation of the trench layers.
- **GravityClaw Module:** The physics-based grappling hook for salvage.

---
*Created by Gemini CLI for the Antigravity Team.*
