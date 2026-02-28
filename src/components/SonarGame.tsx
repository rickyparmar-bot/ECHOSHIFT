import React, { useEffect, useRef, useState, useCallback } from 'react';
import LoginScreen from './LoginScreen';
import TitleScreen from './TitleScreen';
import GameOverScreen from './GameOverScreen';
import HUD from './HUD';

// ======================== TYPES ========================

interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
  revealed: number;
}

interface Ping {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  active: boolean;
}

interface Creature {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  revealed: number;
  size: number;
}

interface Core {
  x: number;
  y: number;
  collected: boolean;
  pulsePhase: number;
  revealed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

type GameScreen = 'login' | 'title' | 'playing' | 'gameover' | 'victory';

// ======================== CONSTANTS ========================

const CORE_COUNT = 5;
const CREATURE_COUNT = 3;
const PARTICLE_COUNT = 100;
const PING_COST = 8;
const PING_SPEED = 6;
const PING_MAX_RADIUS = 500;
const PLAYER_SPEED = 0.5;
const PLAYER_STEALTH_SPEED = 0.22;
const FRICTION = 0.97;
const BATTERY_RECHARGE = 0.018;
const OXYGEN_MOVE_DRAIN = 0.01;
const OXYGEN_IDLE_DRAIN = 0.002;
const CORE_COLLECT_RADIUS = 40;
const CREATURE_KILL_RADIUS = 25;
const WALL_FADE_SPEED = 0.003;
const CREATURE_REVEAL_FADE = 0.006;

// ======================== LEVEL GENERATION ========================

function generateWalls(): Wall[] {
  const walls: Wall[] = [];
  // Tight corridor walls near the player spawn
  // Left corridor wall
  for (let i = 0; i < 30; i++) {
    const y = i * 150 - 400;
    walls.push({
      x: -320 + (Math.random() - 0.5) * 80,
      y: y + Math.random() * 30,
      w: Math.random() * 100 + 60,
      h: Math.random() * 120 + 40,
      revealed: 0,
    });
    // Right corridor wall
    walls.push({
      x: 200 + (Math.random() - 0.5) * 80,
      y: y + Math.random() * 30,
      w: Math.random() * 100 + 60,
      h: Math.random() * 120 + 40,
      revealed: 0,
    });
  }
  // Cross-beams / obstacles inside the corridor
  for (let i = 0; i < 15; i++) {
    walls.push({
      x: Math.random() * 300 - 150,
      y: i * 250 + 100 + Math.random() * 80,
      w: Math.random() * 100 + 40,
      h: Math.random() * 30 + 10,
      revealed: 0,
    });
  }
  // Scattered rocks/debris further out
  for (let i = 0; i < 20; i++) {
    walls.push({
      x: Math.random() * 1600 - 800,
      y: Math.random() * 3500 - 500,
      w: Math.random() * 80 + 20,
      h: Math.random() * 80 + 20,
      revealed: 0,
    });
  }
  return walls;
}

function isInsideAnyWall(px: number, py: number, walls: Wall[], padding = 20): boolean {
  for (const w of walls) {
    if (
      px > w.x - padding &&
      px < w.x + w.w + padding &&
      py > w.y - padding &&
      py < w.y + w.h + padding
    ) {
      return true;
    }
  }
  return false;
}

function generateCores(walls: Wall[]): Core[] {
  const cores: Core[] = [];

  function findSafePosition(cx: number, cy: number, rangeX: number, rangeY: number): { x: number; y: number } {
    for (let attempt = 0; attempt < 50; attempt++) {
      const x = cx + (Math.random() - 0.5) * rangeX;
      const y = cy + Math.random() * rangeY;
      if (!isInsideAnyWall(x, y, walls)) {
        return { x, y };
      }
    }
    // Fallback: place at center of corridor (should always be safe)
    return { x: 0, y: cy + rangeY * 0.5 };
  }

  // First core is close to help player discover the mechanic
  const first = findSafePosition(100, 120, 120, 80);
  cores.push({
    x: first.x,
    y: first.y,
    collected: false,
    pulsePhase: Math.random() * Math.PI * 2,
    revealed: 0,
  });

  // Rest are spread deeper
  for (let i = 1; i < CORE_COUNT; i++) {
    const pos = findSafePosition(0, 400 + i * 500, 300, 200);
    cores.push({
      x: pos.x,
      y: pos.y,
      collected: false,
      pulsePhase: Math.random() * Math.PI * 2,
      revealed: 0,
    });
  }
  return cores;
}

function generateCreatures(): Creature[] {
  const creatures: Creature[] = [];
  for (let i = 0; i < CREATURE_COUNT; i++) {
    const x = Math.random() * 1200 - 600;
    const y = 800 + i * 800 + Math.random() * 400;
    creatures.push({
      x,
      y,
      targetX: x,
      targetY: y,
      speed: 0.3 + Math.random() * 0.4,
      revealed: 0,
      size: 15 + Math.random() * 10,
    });
  }
  return creatures;
}

function generateParticles(px: number, py: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: px + Math.random() * 1200 - 600,
      y: py + Math.random() * 1200 - 600,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3 + 0.1,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.25 + 0.05,
      life: 1,
    });
  }
  return particles;
}

// ======================== COMPONENT ========================

const SonarGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<GameScreen>('login');

  // User stats
  const [username, setUsername] = useState('');
  const [maxDepth, setMaxDepth] = useState(0);
  const [totalCores, setTotalCores] = useState(0);

  // Game stats (display only — game logic uses refs)
  const [stats, setStats] = useState({
    battery: 100,
    oxygen: 100,
    depth: 0,
    cores: 0,
    totalCores: CORE_COUNT,
    time: 0,
    creatureNearby: false,
    stealthActive: false,
    noiseLevel: 0,
  });

  // Game state refs (used by game loop for perf)
  const playerRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const batteryRef = useRef(100);
  const oxygenRef = useRef(100);
  const coresCollectedRef = useRef(0);
  const timeRef = useRef(0);
  const wallsRef = useRef<Wall[]>([]);
  const pingsRef = useRef<Ping[]>([]);
  const creaturesRef = useRef<Creature[]>([]);
  const coresRef = useRef<Core[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<TrailPoint[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const creatureNearbyRef = useRef(false);
  const screenShakeRef = useRef(0);
  const lastPingTimeRef = useRef(0);
  const noiseLevelRef = useRef(0);
  const bumpCooldownRef = useRef(0);

  const startGame = useCallback(() => {
    // Reset everything
    playerRef.current = { x: 0, y: 0, vx: 0, vy: 0 };
    batteryRef.current = 100;
    oxygenRef.current = 100;
    coresCollectedRef.current = 0;
    timeRef.current = 0;
    creatureNearbyRef.current = false;
    screenShakeRef.current = 0;
    trailRef.current = [];
    pingsRef.current = [];
    wallsRef.current = generateWalls();
    coresRef.current = generateCores(wallsRef.current);
    creaturesRef.current = generateCreatures();
    particlesRef.current = generateParticles(0, 0);
    keysRef.current = {};
    setScreen('playing');
  }, []);

  const restartGame = useCallback(() => {
    setScreen('title');
  }, []);

  const handleLogin = useCallback((name: string, isNewUser: boolean) => {
    setUsername(name);
    if (!isNewUser) {
      const saved = localStorage.getItem(`echoshift_user_${name.toLowerCase()}`);
      if (saved) {
        const data = JSON.parse(saved);
        setMaxDepth(data.maxDepth || 0);
        setTotalCores(data.totalCores || 0);
      }
    } else {
      setMaxDepth(0);
      setTotalCores(0);
    }
    setScreen('title');
  }, []);

  // Save progress when game ends
  useEffect(() => {
    if (screen === 'gameover' || screen === 'victory') {
      if (!username) return;
      const finalDepth = Math.floor(playerRef.current.y / 8);
      const runCores = coresCollectedRef.current;

      const key = `echoshift_user_${username.toLowerCase()}`;
      const existing = localStorage.getItem(key);
      if (existing) {
        const data = JSON.parse(existing);
        data.maxDepth = Math.max(data.maxDepth || 0, finalDepth);
        data.totalCores = (data.totalCores || 0) + runCores;
        localStorage.setItem(key, JSON.stringify(data));
        setMaxDepth(data.maxDepth);
        setTotalCores(data.totalCores);
      }
    }
  }, [screen, username]);

  // ======================== RESIZE ========================

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ======================== GAME LOOP ========================

  useEffect(() => {
    if (screen !== 'playing') return;

    const canvas = canvasRef.current!;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let statsUpdateCounter = 0;

    // --- Input ---
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        createPing();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function createPing() {
      const now = performance.now();
      if (now - lastPingTimeRef.current < 300) return; // cooldown
      if (batteryRef.current < PING_COST) return;
      lastPingTimeRef.current = now;
      batteryRef.current -= PING_COST;
      screenShakeRef.current = 6;
      pingsRef.current.push({
        x: playerRef.current.x,
        y: playerRef.current.y,
        radius: 0,
        maxRadius: PING_MAX_RADIUS,
        active: true,
      });
      // Alert creatures to this ping location
      creaturesRef.current.forEach((c) => {
        const dist = Math.hypot(c.x - playerRef.current.x, c.y - playerRef.current.y);
        if (dist < 800) {
          c.targetX = playerRef.current.x + (Math.random() - 0.5) * 60;
          c.targetY = playerRef.current.y + (Math.random() - 0.5) * 60;
        }
      });
    }

    // Auto-ping on game start so the player immediately sees the environment
    const autoPingTimer = setTimeout(createPing, 400);

    // --- Update ---
    function update(dt: number) {
      const p = playerRef.current;
      const stealth = keysRef.current['ShiftLeft'] || keysRef.current['ShiftRight'];
      const spd = stealth ? PLAYER_STEALTH_SPEED : PLAYER_SPEED;

      // Movement
      if (keysRef.current['KeyW']) p.vy -= spd;
      if (keysRef.current['KeyS']) p.vy += spd;
      if (keysRef.current['KeyA']) p.vx -= spd;
      if (keysRef.current['KeyD']) p.vx += spd;

      p.vx *= FRICTION;
      p.vy *= FRICTION;

      // Apply movement with AABB collision
      const PLAYER_RADIUS = 6;
      const newX = p.x + p.vx;
      const newY = p.y + p.vy;
      let collidedX = false;
      let collidedY = false;

      // Check X-axis collision
      for (const w of wallsRef.current) {
        if (
          newX + PLAYER_RADIUS > w.x &&
          newX - PLAYER_RADIUS < w.x + w.w &&
          p.y + PLAYER_RADIUS > w.y &&
          p.y - PLAYER_RADIUS < w.y + w.h
        ) {
          collidedX = true;
          break;
        }
      }
      // Check Y-axis collision
      for (const w of wallsRef.current) {
        if (
          p.x + PLAYER_RADIUS > w.x &&
          p.x - PLAYER_RADIUS < w.x + w.w &&
          newY + PLAYER_RADIUS > w.y &&
          newY - PLAYER_RADIUS < w.y + w.h
        ) {
          collidedY = true;
          break;
        }
      }

      if (collidedX) {
        p.vx = 0;
      } else {
        p.x = newX;
      }
      if (collidedY) {
        p.vy = 0;
      } else {
        p.y = newY;
      }

      // Bump penalty (screen shake + noise spike)
      if (bumpCooldownRef.current > 0) bumpCooldownRef.current -= dt;
      if ((collidedX || collidedY) && bumpCooldownRef.current <= 0) {
        screenShakeRef.current = 10;
        noiseLevelRef.current = Math.min(100, noiseLevelRef.current + 60);
        bumpCooldownRef.current = 200; // ms cooldown between bumps
        // Alert creatures to player bump noise
        creaturesRef.current.forEach((c) => {
          const dist = Math.hypot(c.x - p.x, c.y - p.y);
          if (dist < 600) {
            c.targetX = p.x + (Math.random() - 0.5) * 40;
            c.targetY = p.y + (Math.random() - 0.5) * 40;
          }
        });
      }

      // Noise level decay
      if (noiseLevelRef.current > 0) {
        noiseLevelRef.current *= 0.985;
        if (noiseLevelRef.current < 0.5) noiseLevelRef.current = 0;
      }

      // Trail
      if (Math.abs(p.vx) > 0.2 || Math.abs(p.vy) > 0.2) {
        trailRef.current.push({ x: p.x, y: p.y, age: 0 });
      }
      trailRef.current = trailRef.current.filter((t) => {
        t.age += 0.02;
        return t.age < 1;
      });
      if (trailRef.current.length > 60) trailRef.current.shift();

      // Battery recharge
      batteryRef.current = Math.min(100, batteryRef.current + BATTERY_RECHARGE);

      // Oxygen drain — scales with cores collected (dynamic difficulty)
      const coresDiffMultiplier = 1 + coresCollectedRef.current * 0.22;
      const moving = Math.abs(p.vx) > 0.15 || Math.abs(p.vy) > 0.15;
      oxygenRef.current -= (moving ? OXYGEN_MOVE_DRAIN : OXYGEN_IDLE_DRAIN) * coresDiffMultiplier;
      oxygenRef.current = Math.max(0, oxygenRef.current);

      // Time
      timeRef.current += dt / 1000;

      // Screen shake decay
      if (screenShakeRef.current > 0) screenShakeRef.current *= 0.9;
      if (screenShakeRef.current < 0.1) screenShakeRef.current = 0;

      // --- Pings ---
      pingsRef.current = pingsRef.current.filter((ping) => ping.active);
      pingsRef.current.forEach((ping) => {
        ping.radius += PING_SPEED;
        if (ping.radius > ping.maxRadius) {
          ping.active = false;
          return;
        }

        // Reveal walls
        wallsRef.current.forEach((w) => {
          const dx = Math.max(w.x - ping.x, 0, ping.x - (w.x + w.w));
          const dy = Math.max(w.y - ping.y, 0, ping.y - (w.y + w.h));
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (Math.abs(dist - ping.radius) < 15) {
            w.revealed = 1.0;
          }
        });

        // Reveal cores
        coresRef.current.forEach((c) => {
          if (c.collected) return;
          const dist = Math.hypot(c.x - ping.x, c.y - ping.y);
          if (Math.abs(dist - ping.radius) < 20) {
            c.revealed = 1.0;
          }
        });

        // Reveal creatures
        creaturesRef.current.forEach((c) => {
          const dist = Math.hypot(c.x - ping.x, c.y - ping.y);
          if (Math.abs(dist - ping.radius) < 20) {
            c.revealed = 1.0;
          }
        });
      });

      // --- Fade revealed objects (scales with cores — darkness closes in) ---
      const fadeDiffMultiplier = 1 + coresCollectedRef.current * 0.3;
      const scaledWallFade = WALL_FADE_SPEED * fadeDiffMultiplier;
      const scaledCreatureFade = CREATURE_REVEAL_FADE * fadeDiffMultiplier;

      wallsRef.current.forEach((w) => {
        if (w.revealed > 0) w.revealed -= scaledWallFade;
        if (w.revealed < 0) w.revealed = 0;
      });
      coresRef.current.forEach((c) => {
        if (c.revealed > 0) c.revealed -= scaledWallFade;
        if (c.revealed < 0) c.revealed = 0;
        c.pulsePhase += 0.05;
      });
      creaturesRef.current.forEach((c) => {
        if (c.revealed > 0) c.revealed -= scaledCreatureFade;
        if (c.revealed < 0) c.revealed = 0;
      });

      // --- Core collection ---
      coresRef.current.forEach((c) => {
        if (c.collected) return;
        const dist = Math.hypot(c.x - p.x, c.y - p.y);
        if (dist < CORE_COLLECT_RADIUS && (keysRef.current['KeyE'] || dist < 20)) {
          c.collected = true;
          coresCollectedRef.current++;
          screenShakeRef.current = 3;
        }
      });

      // --- Creatures AI ---
      let nearCreature = false;
      creaturesRef.current.forEach((c) => {
        // Move toward target
        const dx = c.targetX - c.x;
        const dy = c.targetY - c.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
          c.x += (dx / dist) * c.speed;
          c.y += (dy / dist) * c.speed;
        } else {
          // Idle wander
          c.targetX = c.x + (Math.random() - 0.5) * 200;
          c.targetY = c.y + (Math.random() - 0.5) * 200;
        }

        // Check if near player
        const playerDist = Math.hypot(c.x - p.x, c.y - p.y);
        if (playerDist < 200) nearCreature = true;
        if (playerDist < CREATURE_KILL_RADIUS) {
          // Game over!
          setScreen('gameover');
        }
      });
      creatureNearbyRef.current = nearCreature;

      // --- Particles ---
      particlesRef.current.forEach((part) => {
        part.x += part.vx;
        part.y += part.vy;
        // Recycle if far from player
        const dist = Math.hypot(part.x - p.x, part.y - p.y);
        if (dist > 800) {
          part.x = p.x + (Math.random() - 0.5) * 1200;
          part.y = p.y + (Math.random() - 0.5) * 1200;
        }
      });

      // --- Win/lose checks ---
      if (oxygenRef.current <= 0 || batteryRef.current <= 0) {
        setScreen('gameover');
      }
      if (coresCollectedRef.current >= CORE_COUNT) {
        setScreen('victory');
      }

      // --- Update React stats (throttled) ---
      statsUpdateCounter++;
      if (statsUpdateCounter % 6 === 0) {
        setStats({
          battery: batteryRef.current,
          oxygen: oxygenRef.current,
          depth: Math.floor(p.y / 8),
          cores: coresCollectedRef.current,
          totalCores: CORE_COUNT,
          time: timeRef.current,
          creatureNearby: creatureNearbyRef.current,
          stealthActive: stealth,
          noiseLevel: noiseLevelRef.current,
        });
      }
    }

    // --- Draw ---
    function draw() {
      const W = canvas.width;
      const H = canvas.height;
      const p = playerRef.current;

      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      ctx.save();

      // Camera with screen shake
      const shakeX = screenShakeRef.current * (Math.random() - 0.5) * 2;
      const shakeY = screenShakeRef.current * (Math.random() - 0.5) * 2;
      ctx.translate(W / 2 - p.x + shakeX, H / 2 - p.y + shakeY);

      // ---- Ambient particles ----
      particlesRef.current.forEach((part) => {
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 204, ${part.opacity * 0.3})`;
        ctx.fill();
      });

      // ---- Walls (revealed) ----
      wallsRef.current.forEach((w) => {
        if (w.revealed <= 0) return;
        const alpha = w.revealed;

        // Outer glow
        ctx.shadowColor = `rgba(0, 255, 204, ${alpha * 0.5})`;
        ctx.shadowBlur = 12;

        // Wireframe stroke
        ctx.strokeStyle = `rgba(0, 255, 204, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(w.x, w.y, w.w, w.h);

        // Fill with subtle glow
        ctx.fillStyle = `rgba(0, 255, 204, ${alpha * 0.06})`;
        ctx.fillRect(w.x, w.y, w.w, w.h);

        // Grid pattern inside wall
        ctx.strokeStyle = `rgba(0, 255, 204, ${alpha * 0.15})`;
        ctx.lineWidth = 0.5;
        const gridSize = 20;
        for (let gx = w.x; gx < w.x + w.w; gx += gridSize) {
          ctx.beginPath();
          ctx.moveTo(gx, w.y);
          ctx.lineTo(gx, w.y + w.h);
          ctx.stroke();
        }
        for (let gy = w.y; gy < w.y + w.h; gy += gridSize) {
          ctx.beginPath();
          ctx.moveTo(w.x, gy);
          ctx.lineTo(w.x + w.w, gy);
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
      });

      // ---- Cores (revealed or always slightly visible) ----
      coresRef.current.forEach((c) => {
        if (c.collected) return;
        const alpha = Math.max(c.revealed, 0.05); // always barely visible
        const pulse = Math.sin(c.pulsePhase) * 0.3 + 0.7;
        const size = 12 + pulse * 4;

        // Outer glow
        ctx.shadowColor = `rgba(255, 204, 0, ${alpha * 0.8})`;
        ctx.shadowBlur = 20;

        // Diamond shape
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = `rgba(255, 204, 0, ${alpha * pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(-size / 2, -size / 2, size, size);
        ctx.fillStyle = `rgba(255, 204, 0, ${alpha * 0.15 * pulse})`;
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.restore();

        // Inner dot
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 204, 0, ${alpha * pulse})`;
        ctx.fill();

        ctx.shadowBlur = 0;
      });

      // ---- Creatures (revealed) ----
      creaturesRef.current.forEach((c) => {
        if (c.revealed <= 0) return;
        const alpha = c.revealed;

        // Menacing triangle shape
        ctx.shadowColor = `rgba(255, 51, 85, ${alpha * 0.7})`;
        ctx.shadowBlur = 18;

        ctx.strokeStyle = `rgba(255, 51, 85, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y - c.size);
        ctx.lineTo(c.x - c.size * 0.8, c.y + c.size * 0.6);
        ctx.lineTo(c.x + c.size * 0.8, c.y + c.size * 0.6);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 51, 85, ${alpha * 0.08})`;
        ctx.fill();

        // Eye
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 51, 85, ${alpha})`;
        ctx.fill();

        ctx.shadowBlur = 0;
      });

      // ---- Player trail ----
      trailRef.current.forEach((t) => {
        const alpha = (1 - t.age) * 0.3;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 3 * (1 - t.age), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 204, ${alpha})`;
        ctx.fill();
      });

      // ---- Sonar pings ----
      pingsRef.current.forEach((ping) => {
        const progress = ping.radius / ping.maxRadius;
        const alpha = 1 - progress;

        // Main ring
        ctx.beginPath();
        ctx.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 204, ${alpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Secondary ring
        if (ping.radius > 20) {
          ctx.beginPath();
          ctx.arc(ping.x, ping.y, ping.radius - 15, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 255, 204, ${alpha * 0.2})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Glow ring
        ctx.beginPath();
        ctx.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 204, ${alpha * 0.15})`;
        ctx.lineWidth = 8;
        ctx.stroke();
      });

      // ---- Player ----
      // Glow
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 30);
      grad.addColorStop(0, 'rgba(0, 255, 204, 0.15)');
      grad.addColorStop(0.5, 'rgba(0, 255, 204, 0.03)');
      grad.addColorStop(1, 'rgba(0, 255, 204, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffcc';
      ctx.fill();

      // Direction indicator (velocity)
      if (Math.abs(p.vx) > 0.1 || Math.abs(p.vy) > 0.1) {
        const angle = Math.atan2(p.vy, p.vx);
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(angle) * 12, p.y + Math.sin(angle) * 12);
        ctx.lineTo(p.x + Math.cos(angle) * 20, p.y + Math.sin(angle) * 20);
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();

      // ---- Screen effects (post-camera) ----
      // Vignette
      const vigGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.7);
      vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, W, H);

      // Danger overlay when creature is nearby
      if (creatureNearbyRef.current) {
        ctx.fillStyle = `rgba(255, 0, 50, ${0.03 + Math.random() * 0.02})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    // --- Main loop ---
    function loop(now: number) {
      const dt = Math.min(now - lastTime, 33); // cap at ~30fps delta
      lastTime = now;
      update(dt);
      draw();
      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(autoPingTimer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [screen]);

  // ======================== RENDER ========================

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block bg-black"
        style={{ display: screen === 'playing' ? 'block' : 'none' }}
      />

      {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
      {screen === 'title' && <TitleScreen onStart={startGame} username={username} maxDepth={maxDepth} totalCores={totalCores} />}

      {screen === 'playing' && (
        <>
          <HUD stats={stats} />
          {/* Scanlines overlay */}
          <div className="absolute inset-0 scanlines pointer-events-none" />
          {/* Noise texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </>
      )}

      {screen === 'gameover' && (
        <GameOverScreen victory={false} stats={stats} onRestart={restartGame} />
      )}

      {screen === 'victory' && (
        <GameOverScreen victory={true} stats={stats} onRestart={restartGame} />
      )}
    </div>
  );
};

export default SonarGame;
