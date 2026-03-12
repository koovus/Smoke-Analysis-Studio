import React from 'react';
import { CameraView } from '@/components/camera-view';
import { StatsPanel } from '@/components/stats-panel';
import { HistoryPanel } from '@/components/history-panel';
import { ControlsPanel } from '@/components/controls-panel';
import { useSmokeAnalyzer } from '@/hooks/use-smoke-analyzer';
import { useCamera } from '@/hooks/use-camera';
import { Activity, Video, VideoOff } from 'lucide-react';

export default function Home() {
  const { videoRef, procCanvasRef, overlayCanvasRef, metrics, exhales, updateConfig } = useSmokeAnalyzer();
  const { hasPermission, error, isCameraOn, startCamera, stopCamera } = useCamera(videoRef);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8 flex flex-col max-w-[1600px] mx-auto">

      {/* Header */}
      <header className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/20 border border-primary/50 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              SMOKE VISION
            </h1>
            <div className="text-xs font-mono tracking-widest text-muted-foreground mt-0.5">
              REAL-TIME KINETIC CLOUD ANALYSIS v1.0
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center px-3 py-1.5 border border-primary/30 bg-primary/10 rounded-full font-mono text-xs text-primary">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping mr-2" />
          LOCAL COMPUTE ACTIVE
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">

        {/* Left: Camera + Button */}
        <div className="col-span-1 flex flex-col gap-3">

          <CameraView
            videoRef={videoRef}
            procCanvasRef={procCanvasRef}
            overlayCanvasRef={overlayCanvasRef}
            isProcessing={!!metrics}
            isCameraOn={isCameraOn}
            hasPermission={hasPermission}
            error={error}
          />

          {/* Camera toggle button — big, clear, outside the camera */}
          <button
            onClick={isCameraOn ? stopCamera : startCamera}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-mono text-sm font-bold tracking-wider transition-all ${
              isCameraOn
                ? 'bg-destructive/10 border-destructive/40 text-destructive hover:bg-destructive/20'
                : 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
            }`}
          >
            {isCameraOn
              ? <><VideoOff className="w-4 h-4" /> TURN CAMERA OFF</>
              : <><Video className="w-4 h-4" /> TURN CAMERA ON</>
            }
          </button>

        </div>

        {/* Right: Dashboards */}
        <div className="col-span-1 lg:col-span-2 flex flex-col space-y-6 min-h-0">
          <StatsPanel metrics={metrics} />
          <HistoryPanel exhales={exhales} />
          <ControlsPanel onUpdate={updateConfig} />
        </div>

      </main>
    </div>
  );
}
