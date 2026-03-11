import React, { forwardRef, useEffect, useRef } from 'react';
import { useCamera } from '@/hooks/use-camera';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  procCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  isProcessing: boolean;
}

export const CameraView = ({ videoRef, procCanvasRef, overlayCanvasRef, isProcessing }: CameraViewProps) => {
  const { hasPermission, error } = useCamera(videoRef);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep overlay canvas matching video dimensions
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
    
    // Poll a few times until video loads dimensions
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
      className="relative w-full h-full bg-black/50 rounded-2xl overflow-hidden border border-primary/20 shadow-2xl shadow-primary/5 flex items-center justify-center hud-border"
    >
      {!hasPermission && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/80 backdrop-blur-sm p-8 text-center">
          <div className="w-16 h-16 border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent rounded-full animate-spin mb-6"></div>
          {error ? (
            <div className="text-destructive font-mono text-lg mb-2">ACCESS DENIED</div>
          ) : (
            <div className="text-primary font-mono text-lg mb-2 animate-pulse">INITIALIZING OPTICS</div>
          )}
          <p className="text-muted-foreground font-sans max-w-md">
            {error || "Please allow camera access to begin analysis."}
          </p>
        </div>
      )}

      {/* Main Video Feed */}
      <video
        ref={videoRef as any}
        className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen filter grayscale-[20%] contrast-[1.2]"
        playsInline
        muted
        autoPlay
      />
      
      {/* Hidden processing canvas (low res) */}
      <canvas 
        ref={procCanvasRef as any} 
        width={320} 
        height={240} 
        className="hidden" 
      />
      
      {/* Visual Overlay canvas (hi res) */}
      <canvas
        ref={overlayCanvasRef as any}
        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
      />

      {/* CRT Scanline effect */}
      <div className="absolute inset-0 z-20 scanlines pointer-events-none mix-blend-overlay"></div>
      
      {/* Corner crosshairs */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-primary/50 z-20"></div>
      <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-primary/50 z-20"></div>
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-primary/50 z-20"></div>
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-primary/50 z-20"></div>

      {/* Recording/Status Indicator */}
      <div className="absolute top-6 right-8 flex items-center space-x-2 z-30 font-mono text-xs">
        <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-primary shadow-[0_0_8px_var(--color-primary)]' : 'bg-muted'} animate-pulse`}></div>
        <span className={isProcessing ? 'text-primary' : 'text-muted-foreground'}>
          {isProcessing ? 'ANALYZING' : 'STANDBY'}
        </span>
      </div>
    </div>
  );
};
