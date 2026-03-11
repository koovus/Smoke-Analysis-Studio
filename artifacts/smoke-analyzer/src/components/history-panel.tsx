import React from 'react';
import { ExhaleRecord } from '@/lib/smoke-analyzer';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Award } from 'lucide-react';

interface HistoryPanelProps {
  exhales: ExhaleRecord[];
}

export const HistoryPanel = ({ exhales }: HistoryPanelProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
    if (score >= 60) return 'text-slate-300 border-slate-300/30 bg-slate-300/10';
    if (score >= 40) return 'text-amber-600 border-amber-600/30 bg-amber-600/10';
    return 'text-muted-foreground border-muted-foreground/30 bg-muted-foreground/10';
  };

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
        <h2 className="text-xl text-primary font-bold tracking-widest flex items-center">
          <History className="w-5 h-5 mr-2" />
          EXHALE LOG
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        <AnimatePresence>
          {exhales.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center text-muted-foreground py-8 font-mono text-sm"
            >
              NO DATA. WAITING FOR EXHALE EVENT...
            </motion.div>
          ) : (
            exhales.map((exhale, idx) => (
              <motion.div
                key={exhale.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-card/40 border border-border/40 p-4 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-mono text-muted-foreground">
                    T-{Math.round((Date.now() - exhale.timestamp)/1000)}s
                  </div>
                  <div className={`flex items-center font-bold text-lg px-2 py-0.5 rounded-md border ${getScoreColor(exhale.score)}`}>
                    <Award className="w-4 h-4 mr-1 opacity-70" />
                    {exhale.score}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                  <div>
                    <span className="text-muted-foreground">VOL:</span> {Math.round(exhale.maxArea/1000)}k
                  </div>
                  <div>
                    <span className="text-muted-foreground">DEN:</span> {Math.round(exhale.maxDensity)}%
                  </div>
                  <div>
                    <span className="text-muted-foreground">DUR:</span> {exhale.duration.toFixed(1)}s
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {exhale.tags.map(tag => (
                    <span 
                      key={tag} 
                      className={`text-[9px] px-1.5 py-0.5 rounded border ${tag === 'RING' ? 'border-accent text-accent' : 'border-primary/40 text-primary'} tracking-wider`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
