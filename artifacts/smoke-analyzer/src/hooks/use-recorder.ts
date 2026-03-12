import { useRef, useState, useCallback, useEffect } from 'react';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export function useRecorder(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const compositeCanvas = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef(false);
  const rafId = useRef<number | null>(null);
  const timerId = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    compositeCanvas.current = document.createElement('canvas');
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (timerId.current) clearInterval(timerId.current);
    };
  }, []);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    const canvas = compositeCanvas.current;
    if (!canvas || !video) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    if (overlay && overlay.width > 0) ctx.drawImage(overlay, 0, 0, w, h);
  }, [videoRef, overlayCanvasRef]);

  const startRecording = useCallback(async (durationSeconds: number) => {
    const video = videoRef.current;
    const canvas = compositeCanvas.current;
    if (!video || !canvas || isRecording) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    activeRef.current = true;
    setIsRecording(true);
    setTotalSeconds(durationSeconds);
    setSecondsLeft(durationSeconds);

    const download = (blob: Blob, ext: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smoke-vision-${durationSeconds}s-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsRecording(false);
      setSecondsLeft(0);
    };

    const supportsWebCodecs =
      typeof VideoEncoder !== 'undefined' &&
      typeof VideoFrame !== 'undefined';

    if (supportsWebCodecs) {
      // ── MP4 via WebCodecs + mp4-muxer ──────────────────────────────
      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width: w, height: h },
        fastStart: 'in-memory',
        firstTimestampBehavior: 'offset',
      });

      const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error('VideoEncoder error:', e),
      });

      encoder.configure({
        codec: 'avc1.42001f', // H.264 Baseline Profile
        width: w,
        height: h,
        bitrate: 3_000_000,
        framerate: 30,
      });

      let frameCount = 0;
      const startTime = performance.now();

      const loop = () => {
        if (!activeRef.current) return;
        drawFrame();
        if (encoder.state === 'configured') {
          const timestamp = Math.round((performance.now() - startTime) * 1000);
          const frame = new VideoFrame(canvas, { timestamp });
          encoder.encode(frame, { keyFrame: frameCount === 0 || frameCount % 60 === 0 });
          frame.close();
          frameCount++;
        }
        rafId.current = requestAnimationFrame(loop);
      };
      loop();

      let remaining = durationSeconds;
      timerId.current = setInterval(async () => {
        remaining--;
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timerId.current!);
          activeRef.current = false;
          if (rafId.current) cancelAnimationFrame(rafId.current);
          await encoder.flush();
          encoder.close();
          muxer.finalize();
          download(new Blob([muxer.target.buffer], { type: 'video/mp4' }), 'mp4');
        }
      }, 1000);
    } else {
      // ── WebM fallback via MediaRecorder ───────────────────────────
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => download(new Blob(chunks, { type: mimeType }), 'webm');

      const loop = () => {
        if (!activeRef.current) return;
        drawFrame();
        rafId.current = requestAnimationFrame(loop);
      };
      recorder.start(200);
      loop();

      let remaining = durationSeconds;
      timerId.current = setInterval(() => {
        remaining--;
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timerId.current!);
          activeRef.current = false;
          if (rafId.current) cancelAnimationFrame(rafId.current);
          recorder.stop();
        }
      }, 1000);
    }
  }, [isRecording, videoRef, drawFrame]);

  const cancelRecording = useCallback(() => {
    activeRef.current = false;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (timerId.current) clearInterval(timerId.current);
    setIsRecording(false);
    setSecondsLeft(0);
  }, []);

  return { isRecording, secondsLeft, totalSeconds, startRecording, cancelRecording };
}
