import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';

export type EffectType = 'coins' | 'lightning' | 'confetti' | 'fire';

export interface EffectsOverlayHandle {
  triggerEffect: (type: EffectType) => void;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; color: string;
  rotation: number; rotationSpeed: number;
  type: EffectType;
  phase: number; phaseSpeed: number;
}

const COIN_COLORS = ['#FFD700', '#FFC200', '#FFAA00', '#FFEC8B', '#DAA520', '#FFF0A0'];
const LIGHTNING_COLORS = ['#FFFFFF', '#AEE8FF', '#5BC8FF', '#00BFFF', '#1E90FF'];
const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#FFEAA7', '#DDA0DD', '#98FB98', '#FF9FF3'];
const FIRE_COLORS = ['#FF2200', '#FF4500', '#FF6600', '#FF8C00', '#FFA500', '#FFD700'];

function spawnCoins(cx: number, cy: number): Particle[] {
  return Array.from({ length: 140 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 18;
    const life = 90 + Math.random() * 70;
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life, maxLife: life,
      size: 9 + Math.random() * 13,
      color: COIN_COLORS[Math.floor(Math.random() * COIN_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
      type: 'coins',
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.15 + Math.random() * 0.2,
    };
  });
}

function spawnLightning(cx: number, cy: number): Particle[] {
  return Array.from({ length: 90 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 10 + Math.random() * 22;
    const life = 15 + Math.random() * 25;
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life, maxLife: life,
      size: 2 + Math.random() * 5,
      color: LIGHTNING_COLORS[Math.floor(Math.random() * LIGHTNING_COLORS.length)],
      rotation: 0, rotationSpeed: 0,
      type: 'lightning',
      phase: 0, phaseSpeed: 0,
    };
  });
}

function spawnConfetti(W: number): Particle[] {
  return Array.from({ length: 120 }, () => {
    const life = 180 + Math.random() * 120;
    return {
      x: Math.random() * W, y: -20,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      life, maxLife: life,
      size: 5 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.12,
      type: 'confetti',
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.05 + Math.random() * 0.05,
    };
  });
}

function spawnFire(cx: number, H: number): Particle[] {
  return Array.from({ length: 90 }, () => {
    const life = 55 + Math.random() * 55;
    return {
      x: cx + (Math.random() - 0.5) * 80,
      y: H - 20,
      vx: (Math.random() - 0.5) * 5,
      vy: -(6 + Math.random() * 14),
      life, maxLife: life,
      size: 12 + Math.random() * 22,
      color: FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)],
      rotation: 0, rotationSpeed: 0,
      type: 'fire',
      phase: 0, phaseSpeed: 0,
    };
  });
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const alpha = Math.min(1, (p.life / p.maxLife) * 2);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  if (p.type === 'coins') {
    const spinScale = Math.cos(p.phase);
    const w = Math.abs(spinScale) * p.size;
    const h = p.size * 0.55;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0.5, w), h, 0, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    if (w > 2) {
      ctx.beginPath();
      ctx.ellipse(-w * 0.2, -h * 0.25, w * 0.35, h * 0.2, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0.5, w), h, 0, 0, Math.PI * 2);
    ctx.strokeStyle = spinScale > 0 ? '#B8860B' : '#8B6914';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (p.type === 'confetti') {
    ctx.scale(Math.cos(p.phase), 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size * 1.5, p.size, p.size * 3);
  } else if (p.type === 'fire') {
    const r = p.size;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, p.color);
    grad.addColorStop(0.5, p.color + 'AA');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export const EffectsOverlay = forwardRef<EffectsOverlayHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const loopRunning = useRef(false);

  const startLoop = useCallback(() => {
    if (loopRunning.current) return;
    loopRunning.current = true;

    const tick = () => {
      const canvas = canvasRef.current;
      if (!canvas) { loopRunning.current = false; return; }

      if (canvas.width !== window.innerWidth) canvas.width = window.innerWidth;
      if (canvas.height !== window.innerHeight) canvas.height = window.innerHeight;

      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const alive: Particle[] = [];
      for (const p of particles.current) {
        p.life--;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.phase += p.phaseSpeed;

        if (p.type === 'coins') {
          p.vy += 0.28;
        } else if (p.type === 'lightning') {
          p.vx *= 0.88;
          p.vy *= 0.88;
        } else if (p.type === 'confetti') {
          p.vy += 0.04;
          p.vx += Math.sin(p.phase * 3) * 0.08;
        } else if (p.type === 'fire') {
          p.vy += 0.06;
          p.vx *= 0.97;
          p.size *= 0.985;
        }

        if (p.life > 0) {
          drawParticle(ctx, p);
          alive.push(p);
        }
      }
      particles.current = alive;

      if (alive.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        loopRunning.current = false;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const triggerEffect = useCallback((type: EffectType) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2;
    const cy = H / 2;

    let newP: Particle[] = [];
    if (type === 'coins')     newP = spawnCoins(cx, cy);
    if (type === 'lightning') newP = spawnLightning(cx, cy);
    if (type === 'confetti')  newP = spawnConfetti(W);
    if (type === 'fire')      newP = spawnFire(cx, H);

    particles.current = [...particles.current, ...newP];
    startLoop();
  }, [startLoop]);

  useImperativeHandle(ref, () => ({ triggerEffect }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}
    />
  );
});

EffectsOverlay.displayName = 'EffectsOverlay';
