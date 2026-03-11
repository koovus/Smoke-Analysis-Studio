import React from 'react';
import { SmokeMetrics } from '@/lib/smoke-analyzer';
import { motion } from 'framer-motion';
import { Activity, Wind, Maximize, MoveUpRight, CircleDashed } from 'lucide-react';

interface StatsPanelProps {
  metrics: SmokeMetrics | null;
}

export const StatsPanel = ({ metrics }: StatsPanelProps) => {
  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <h2 className="text-xl text-primary font-bold tracking-widest flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          TELEMETRY
        </h2>
        {metrics?.isRing && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-3 py-1 bg-accent/20 border border-accent text-accent text-xs font-mono rounded-full flex items-center neon-text"
          >
            <CircleDashed className="w-3 h-3 mr-1 animate-spin-slow" />
            RING DETECTED
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Size */}
        <div className="bg-card/50 rounded-xl p-4 border border-border/30 hover:border-primary/30 transition-colors">
          <div className="text-muted-foreground text-xs font-mono mb-1 flex items-center">
            <Maximize className="w-3 h-3 mr-1" /> CLOUD MASS
          </div>
          <div className="text-2xl font-bold font-mono text-foreground flex items-end">
            {metrics ? Math.round(metrics.area / 100) : 0} <span className="text-xs text-muted-foreground ml-1 mb-1">px²</span>
          </div>
        </div>

        {/* Density */}
        <div className="bg-card/50 rounded-xl p-4 border border-border/30 hover:border-primary/30 transition-colors">
          <div className="text-muted-foreground text-xs font-mono mb-1 flex items-center">
            <Wind className="w-3 h-3 mr-1" /> DENSITY
          </div>
          <div className="text-2xl font-bold font-mono text-foreground flex items-end">
            {metrics ? Math.round(metrics.density) : 0} <span className="text-xs text-muted-foreground ml-1 mb-1">%</span>
          </div>
          <div className="w-full h-1 bg-muted mt-2 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              animate={{ width: `${metrics ? metrics.density : 0}%` }}
              transition={{ type: "tween", ease: "linear", duration: 0.1 }}
            />
          </div>
        </div>

        {/* Velocity */}
        <div className="bg-card/50 rounded-xl p-4 border border-border/30 hover:border-primary/30 transition-colors col-span-2">
          <div className="text-muted-foreground text-xs font-mono mb-1 flex items-center">
            <MoveUpRight className="w-3 h-3 mr-1" /> KINETICS
          </div>
          <div className="flex justify-between items-center mt-2">
            <div>
              <div className="text-xs text-muted-foreground">SPREAD</div>
              <div className="font-mono font-semibold">
                {metrics ? Math.round(metrics.spreadRate / 100) : 0} <span className="text-[10px]">p/s</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-border/50"></div>
            <div>
              <div className="text-xs text-muted-foreground">SPEED</div>
              <div className="font-mono font-semibold">
                {metrics ? Math.round(Math.sqrt(metrics.velocity.x**2 + metrics.velocity.y**2)) : 0} <span className="text-[10px]">p/s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
