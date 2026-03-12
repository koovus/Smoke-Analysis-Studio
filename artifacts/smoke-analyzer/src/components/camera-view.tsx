import React, { useEffect, useRef } from 'react';
import { VideoOff } from 'lucide-react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  procCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  isProcessing: boolean;
  isCameraOn: boolean;
  hasPermission: boolean | null;
  error: string | null;
}

export const CameraView = ({
  videoRef, procCanvasRef, overlayCanvasRef,
  isProcessing, isCameraOn, hasPermission, error,
}: CameraViewProps) => {
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
    return () => { clearInterval(interval); window.removeEventListener('resize', syncDimensions); };
  }, [videoRef, overlayCanvasRef]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[220px] max-h-[38vh] bg-black/50 rounded-2xl overflow-hidden border border-primary/20 shadow-2xl flex items-center justify-center"
    >
      {/* Requesting permission */}
      {isCameraOn && hasPermission === null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/80 p-6 text-center">
          <div className="w-10 h-10 border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent rounded-full animate-spin mb-3" />
          <div className="text-primary font-mono text-xs animate-pulse">INITIALIZING CAMERA...</div>
        </div>
      )}

      {/* Permission denied */}
      {isCameraOn && hasPermission === false && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/80 p-6 text-center">
          <div className="text-destructive font-mono text-sm mb-2">CAMERA ACCESS DENIED</div>
          <p className="text-muted-foreground text-xs max-w-xs">{error}</p>
        </div>
      )}

      {/* Camera off */}
      {!isCameraOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/90">
          <VideoOff className="w-8 h-8 text-muted-foreground mb-2" />
          <div className="text-muted-foreground font-mono text-xs">CAMERA OFF</div>
        </div>
      )}

      {/* Video */}
      <video
        ref={videoRef as any}
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        playsInline muted autoPlay
      />

      {/* Hidden processing canvas */}
      <canvas ref={procCanvasRef as any} width={320} height={240} className="hidden" />

      {/* Overlay canvas */}
      <canvas ref={overlayCanvasRef as any} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

      {/* Corner crosshairs */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-primary/50 z-20" />
      <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-primary/50 z-20" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-primary/50 z-20" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-primary/50 z-20" />

      {/* Status */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30 font-mono text-[10px] px-2 py-1 rounded-full bg-black/60 border border-primary/20">
        <div className={`w-1.5 h-1.5 rounded-full ${isProcessing && isCameraOn ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
        <span className={isProcessing && isCameraOn ? 'text-primary' : 'text-muted-foreground'}>
          {!isCameraOn ? 'OFF' : isProcessing ? 'ANALYZING' : 'STANDBY'}
        </span>
      </div>
    </div>
  );
};
