import React from 'react';
import { SmokeMetrics } from '@/lib/smoke-analyzer';
import { motion } from 'framer-motion';
import { CircleDashed, Eye, EyeOff } from 'lucide-react';

interface StatsPanelProps {
  metrics: SmokeMetrics | null;
}

const PROC_PIXELS = 320 * 240;

function coveragePct(area: number) {
  return Math.min(100, Math.round((area / PROC_PIXELS) * 100));
}

function thicknessLabel(density: number) {
  if (density < 15) return { label: 'WISP', color: 'text-muted-foreground' };
  if (density < 35) return { label: 'THIN', color: 'text-primary/70' };
  if (density < 60) return { label: 'MODERATE', color: 'text-primary' };
  if (density < 80) return { label: 'THICK', color: 'text-yellow-400' };
  return { label: 'DENSE', color: 'text-orange-400' };
}

function shapeLabel(circularity: number, isRing: boolean) {
  if (isRing) return { label: 'RING', color: 'text-accent' };
  if (circularity > 0.65) return { label: 'ROUND CLOUD', color: 'text-primary' };
  if (circularity > 0.4) return { label: 'CLOUD', color: 'text-primary/80' };
  return { label: 'SPREADING', color: 'text-muted-foreground' };
}

function motionLabel(vx: number, vy: number) {
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed < 4) return { dir: 'STILL', arrow: '·', color: 'text-muted-foreground' };
  const angle = Math.atan2(vy, vx) * (180 / Math.PI);
  let dir = '';
  let arrow = '';
  if (angle > -45 && angle <= 45) { dir = 'DRIFTING RIGHT'; arrow = '→'; }
  else if (angle > 45 && angle <= 135) { dir = 'FALLING'; arrow = '↓'; }
  else if (angle > 135 || angle <= -135) { dir = 'DRIFTING LEFT'; arrow = '←'; }
  else { dir = 'RISING'; arrow = '↑'; }
  const speedLabel = speed < 15 ? 'SLOW' : speed < 40 ? 'FAST' : 'VERY FAST';
  return { dir: `${dir}`, arrow, speed: speedLabel, color: 'text-primary' };
}

export const StatsPanel = ({ metrics }: StatsPanelProps) => {
  const detected = !!metrics;
  const coverage = detected ? coveragePct(metrics!.area) : 0;
  const thickness = detected ? thicknessLabel(metrics!.density) : null;
  const shape = detected ? shapeLabel(metrics!.circularity, metrics!.isRing) : null;
  const motion_ = detected ? motionLabel(metrics!.velocity.x, metrics!.velocity.y) : null;

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col space-y-4">

      {/* Header + Status */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-2">
          {detected
            ? <Eye className="w-5 h-5 text-primary" />
            : <EyeOff className="w-5 h-5 text-muted-foreground" />
          }
          <span className="text-sm font-bold font-mono tracking-widest text-primary">LIVE ANALYSIS</span>
        </div>
        <motion.div
          key={detected ? 'on' : 'off'}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-bold ${
            detected
              ? 'border-primary/50 bg-primary/10 text-primary'
              : 'border-border/40 bg-muted/10 text-muted-foreground'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${detected ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
          {detected ? 'SMOKE DETECTED' : 'NO SMOKE'}
        </motion.div>
      </div>

      {/* Ring badge */}
      {metrics?.isRing && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/50 text-accent text-xs font-mono rounded-xl"
        >
          <CircleDashed className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
          SMOKE RING DETECTED
        </motion.div>
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">

        {/* Coverage */}
        <div className="bg-card/40 rounded-xl p-3 border border-border/30">
          <div className="text-[10px] text-muted-foreground font-mono mb-1">FRAME COVERAGE</div>
          <div className="text-3xl font-bold font-mono text-foreground leading-none">
            {coverage}<span className="text-sm text-muted-foreground ml-0.5">%</span>
          </div>
          <div className="w-full h-1 bg-muted/40 mt-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${coverage}%` }}
              transition={{ type: 'tween', ease: 'linear', duration: 0.15 }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground/60 mt-1">of camera frame</div>
        </div>

        {/* Thickness */}
        <div className="bg-card/40 rounded-xl p-3 border border-border/30">
          <div className="text-[10px] text-muted-foreground font-mono mb-1">SMOKE THICKNESS</div>
          <div className={`text-xl font-bold font-mono leading-none mt-1 ${thickness?.color ?? 'text-muted-foreground'}`}>
            {thickness?.label ?? '—'}
          </div>
          <div className="w-full h-1 bg-muted/40 mt-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${detected ? metrics!.density : 0}%` }}
              transition={{ type: 'tween', ease: 'linear', duration: 0.15 }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground/60 mt-1">{detected ? `${Math.round(metrics!.density)}% opacity` : 'no signal'}</div>
        </div>

        {/* Shape */}
        <div className="bg-card/40 rounded-xl p-3 border border-border/30">
          <div className="text-[10px] text-muted-foreground font-mono mb-1">CLOUD SHAPE</div>
          <div className={`text-lg font-bold font-mono leading-none mt-1 ${shape?.color ?? 'text-muted-foreground'}`}>
            {shape?.label ?? '—'}
          </div>
          <div className="text-[10px] text-muted-foreground/60 mt-2">
            {detected ? `${Math.round(metrics!.circularity * 100)}% circular` : 'no signal'}
          </div>
        </div>

        {/* Motion */}
        <div className="bg-card/40 rounded-xl p-3 border border-border/30">
          <div className="text-[10px] text-muted-foreground font-mono mb-1">MOVEMENT</div>
          <div className={`text-xl font-bold font-mono leading-none mt-1 ${motion_?.color ?? 'text-muted-foreground'}`}>
            {motion_?.arrow ?? '·'}
          </div>
          <div className={`text-[10px] font-mono mt-1 ${motion_?.color ?? 'text-muted-foreground/60'}`}>
            {motion_?.dir ?? '—'}
          </div>
          {motion_?.speed && (
            <div className="text-[10px] text-muted-foreground/60">{motion_.speed}</div>
          )}
        </div>

      </div>
    </div>
  );
};
