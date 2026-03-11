import { useState, useEffect, useRef } from 'react';

export function useCamera(videoRef?: React.RefObject<HTMLVideoElement | null>) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const internalRef = useRef<HTMLVideoElement>(null);
  const activeRef = videoRef ?? internalRef;
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = mediaStream;
        setHasPermission(true);

        if (activeRef.current) {
          activeRef.current.srcObject = mediaStream;
          activeRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.error('Camera setup failed', err);
        setHasPermission(false);
        setError(err.message || 'Failed to access camera');
      }
    }

    setupCamera();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef: activeRef, hasPermission, error };
}
