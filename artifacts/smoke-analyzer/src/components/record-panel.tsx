import React from 'react';
import { Circle, X, Download } from 'lucide-react';

interface RecordPanelProps {
  isRecording: boolean;
  secondsLeft: number;
  totalSeconds: number;
  onStart: (duration: number) => void;
  onCancel: () => void;
  isCameraOn: boolean;
}

const DURATIONS = [6, 15, 30];

export const RecordPanel = ({
  isRecording,
  secondsLeft,
  totalSeconds,
  onStart,
  onCancel,
  isCameraOn,
}: RecordPanelProps) => {
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground tracking-widest">
        <Download className="w-3.5 h-3.5" />
        RECORD CLIP
      </div>

      {isRecording ? (
        <div className="flex flex-col gap-3">
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-destructive rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-destructive fill-destructive animate-pulse" />
              <span className="font-mono text-destructive font-bold text-sm">
                REC &nbsp;{secondsLeft}s
              </span>
            </div>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border text-xs font-mono transition-all"
            >
              <X className="w-3 h-3" /> CANCEL
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => onStart(d)}
              disabled={!isCameraOn}
              className="flex-1 py-2.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive font-mono text-sm font-bold hover:bg-destructive/15 hover:border-destructive/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {d}s
            </button>
          ))}
        </div>
      )}

      {!isCameraOn && !isRecording && (
        <p className="text-[10px] text-muted-foreground/60 font-mono text-center">
          Turn camera on to record
        </p>
      )}
    </div>
  );
};
