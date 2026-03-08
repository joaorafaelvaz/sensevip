"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate available cameras
  const loadDevices = useCallback(async () => {
    try {
      // Need to request permission first to get labels
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao acessar cameras"
      );
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const targetDevice = deviceId || selectedDeviceId;

      try {
        const constraints: MediaStreamConstraints = {
          video: targetDevice
            ? {
                deviceId: { exact: targetDevice },
                width: { ideal: 640 },
                height: { ideal: 480 },
              }
            : {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "user",
              },
          audio: false,
        };

        const stream =
          await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsActive(true);
        setError(null);

        if (targetDevice) {
          setSelectedDeviceId(targetDevice);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao acessar a camera"
        );
        setIsActive(false);
      }
    },
    [selectedDeviceId]
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const switchCamera = useCallback(
    async (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      if (isActive) {
        await startCamera(deviceId);
      }
    },
    [isActive, startCamera]
  );

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    isActive,
    error,
    devices,
    selectedDeviceId,
    startCamera,
    stopCamera,
    switchCamera,
  };
}
