import { useRef, useState, useCallback, useEffect } from 'react';

export function useRecorder(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const compositeCanvas = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const rafId = useRef<number | null>(null);
  const timerId = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    compositeCanvas.current = document.createElement('canvas');
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (timerId.current) clearInterval(timerId.current);
    };
  }, []);

  const drawLoop = useCallback(() => {
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    const canvas = compositeCanvas.current;
    if (!canvas || !video || !activeRef.current) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, w, h);
      if (overlay && overlay.width > 0 && overlay.height > 0) {
        ctx.drawImage(overlay, 0, 0, w, h);
      }
    }
    rafId.current = requestAnimationFrame(drawLoop);
  }, [videoRef, overlayCanvasRef]);

  const stopAndSave = useCallback(() => {
    activeRef.current = false;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (timerId.current) clearInterval(timerId.current);
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
  }, []);

  const startRecording = useCallback((durationSeconds: number) => {
    const video = videoRef.current;
    const canvas = compositeCanvas.current;
    if (!video || !canvas || isRecording) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : '';

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunks.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smoke-vision-${durationSeconds}s-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsRecording(false);
      setSecondsLeft(0);
    };

    mediaRecorder.current = recorder;
    chunks.current = [];
    activeRef.current = true;

    recorder.start(200);
    setIsRecording(true);
    setTotalSeconds(durationSeconds);
    setSecondsLeft(durationSeconds);

    drawLoop();

    let remaining = durationSeconds;
    timerId.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerId.current!);
        stopAndSave();
      }
    }, 1000);
  }, [isRecording, videoRef, drawLoop, stopAndSave]);

  const cancelRecording = useCallback(() => {
    activeRef.current = false;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (timerId.current) clearInterval(timerId.current);
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.ondataavailable = null;
      mediaRecorder.current.onstop = null;
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
    setSecondsLeft(0);
  }, []);

  return { isRecording, secondsLeft, totalSeconds, startRecording, cancelRecording };
}
