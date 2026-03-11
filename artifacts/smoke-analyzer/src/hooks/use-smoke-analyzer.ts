import { useState, useEffect, useRef, useCallback } from 'react';
import { SmokeAnalyzer, SmokeMetrics, ExhaleRecord, AnalyzerConfig } from '../lib/smoke-analyzer';

export function useSmokeAnalyzer() {
  const [metrics, setMetrics] = useState<SmokeMetrics | null>(null);
  const [exhales, setExhales] = useState<ExhaleRecord[]>([]);
  const analyzerRef = useRef<SmokeAnalyzer | null>(null);
  const requestRef = useRef<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const procCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Throttled state updates (we don't want 60 React renders per second)
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    analyzerRef.current = new SmokeAnalyzer();

    const loop = () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && procCanvasRef.current && overlayCanvasRef.current) {
        analyzerRef.current?.processFrame(
          videoRef.current,
          procCanvasRef.current,
          overlayCanvasRef.current,
          (newMetrics) => {
            const now = performance.now();
            if (now - lastUpdateRef.current > 100) { // ~10fps UI updates max
              setMetrics(newMetrics);
              lastUpdateRef.current = now;
            }
          },
          (newExhale) => {
            setExhales(prev => [newExhale, ...prev].slice(0, 10)); // keep last 10
          }
        );
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const updateConfig = useCallback((config: Partial<AnalyzerConfig>) => {
    if (analyzerRef.current) {
      analyzerRef.current.setConfig(config);
    }
  }, []);

  return {
    videoRef,
    procCanvasRef,
    overlayCanvasRef,
    metrics,
    exhales,
    updateConfig,
    currentConfig: analyzerRef.current?.config
  };
}
