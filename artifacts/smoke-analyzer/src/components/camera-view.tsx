import React, { useEffect, useRef } from 'react';
import { useCamera } from '@/hooks/use-camera';
import { Video, VideoOff } from 'lucide-react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  procCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  isProcessing: boolean;
}

export const CameraView = ({ videoRef, procCanvasRef, overlayCanvasRef, isProcessing }: CameraViewProps) => {
  const { hasPermission, error, isCameraOn, toggleCamera } = useCamera(videoRef);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncDimensions = () => {
      if (videoRef.current && overlayCanvasRef.current && containerRef.current) {
        const { videoWidth, videoHeight } = videoRef.current;
        if (videoWidth > 0 && videoHeight > 0) {
          overlayCanvasRef.current.width = containerRef.current.clientWidth;
          overlayCanvasRef.current.height = containerRef.current.clientHeight;
        }
      }
    };
    const interval = setInterval(syncDimensions, 500);
    window.addEventListener('resize', syncDimensions);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', syncDimensions);
    };
  }, [videoRef, overlayCanvasRef]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[220px] max-h-[38vh] bg-black/50 rounded-2xl overflow-hidden border border-primary/20 shadow-2xl shadow-primary/5 flex items-center justify-center hud-border"
    >
      {/* Permission / error state */}
      {!hasPermission && isCameraOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/80 backdrop-blur-sm p-6 text-center">
          <div className="w-12 h-12 border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent rounded-full animate-spin mb-4" />
          {error
            ? <div className="text-destructive font-mono text-sm mb-2">ACCESS DENIED</div>
            : <div className="text-primary font-mono text-sm mb-2 animate-pulse">INITIALIZING OPTICS</div>
          }
          <p className="text-muted-foreground text-xs max-w-xs">
            {error || 'Please allow camera access to begin analysis.'}
          </p>
        </div>
      )}

      {/* Camera off overlay */}
      {!isCameraOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/90 backdrop-blur-sm">
          <VideoOff className="w-10 h-10 text-muted-foreground mb-2" />
          <div className="text-muted-foreground font-mono text-xs tracking-widest">CAMERA PAUSED</div>
        </div>
      )}

      {/* Video feed */}
      <video
        ref={videoRef as any}
        className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen filter grayscale-[20%] contrast-[1.2]"
        playsInline
        muted
        autoPlay
      />

      {/* Hidden processing canvas */}
      <canvas ref={procCanvasRef as any} width={320} height={240} className="hidden" />

      {/* Visual overlay canvas */}
      <canvas
        ref={overlayCanvasRef as any}
        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
      />

      {/* Scanline effect */}
      <div className="absolute inset-0 z-20 scanlines pointer-events-none mix-blend-overlay" />

      {/* Corner crosshairs */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-primary/50 z-20" />
      <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-primary/50 z-20" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-primary/50 z-20" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-primary/50 z-20" />

      {/* Status pill */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 z-30 font-mono text-[10px] px-2 py-1 rounded-full bg-black/50 border border-primary/20">
        <div className={`w-1.5 h-1.5 rounded-full ${isProcessing && isCameraOn ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
        <span className={isProcessing && isCameraOn ? 'text-primary' : 'text-muted-foreground'}>
          {!isCameraOn ? 'OFF' : isProcessing ? 'ANALYZING' : 'STANDBY'}
        </span>
      </div>

      {/* Camera on/off button */}
      <button
        onClick={toggleCamera}
        className={`absolute bottom-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-[10px] tracking-wider transition-all ${
          isCameraOn
            ? 'bg-black/60 border-primary/40 text-primary hover:bg-primary/20'
            : 'bg-black/60 border-destructive/50 text-destructive hover:bg-destructive/20'
        }`}
      >
        {isCameraOn
          ? <><VideoOff className="w-3 h-3" /> OFF</>
          : <><Video className="w-3 h-3" /> ON</>
        }
      </button>
    </div>
  );
};
