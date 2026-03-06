"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { faceapi, loadFaceApiModels } from "@/lib/face-api-loader";
import {
  mapExpressionToSatisfaction,
  getDominantExpression,
  type ExpressionScores,
} from "@/lib/satisfaction-mapper";
import { serializeDescriptor } from "@/lib/descriptor-utils";
import { cropFaceFromCanvas, canvasToBlob, uploadSnapshot } from "@/lib/snapshot-utils";
import { DETECTION_CONFIG } from "@/config/detection";
import type { LiveDetection } from "@/types/detection";

interface FaceDetectionState {
  isModelLoaded: boolean;
  isDetecting: boolean;
  facesDetected: number;
  fps: number;
  detections: LiveDetection[];
}

export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  isActive: boolean
) {
  const [state, setState] = useState<FaceDetectionState>({
    isModelLoaded: false,
    isDetecting: false,
    facesDetected: 0,
    fps: 0,
    detections: [],
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFrameTime = useRef<number>(0);

  const loadModels = useCallback(async () => {
    try {
      await loadFaceApiModels();
      setState((prev) => ({ ...prev, isModelLoaded: true }));
    } catch (err) {
      console.error("Failed to load face-api models:", err);
    }
  }, []);

  const detectFaces = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) return;

    const now = performance.now();
    const fps =
      lastFrameTime.current > 0
        ? Math.round(1000 / (now - lastFrameTime.current))
        : 0;
    lastFrameTime.current = now;

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    const results = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: DETECTION_CONFIG.minDetectionConfidence,
      }))
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptors();

    const resized = faceapi.resizeResults(results, displaySize);

    // Draw overlays
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const newDetections: LiveDetection[] = [];

    for (const detection of resized) {
      const expressions = detection.expressions as unknown as ExpressionScores;
      const satisfaction = mapExpressionToSatisfaction(expressions);
      const dominant = getDominantExpression(expressions);
      const confidence = Math.max(...Object.values(expressions));
      const descriptor = serializeDescriptor(detection.descriptor);

      // Draw bounding box
      const box = detection.detection.box;
      if (ctx) {
        const color =
          satisfaction === "SATISFIED"
            ? "#22c55e"
            : satisfaction === "UNSATISFIED"
            ? "#ef4444"
            : "#eab308";
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Label
        const label = `${dominant} ${Math.round(confidence * 100)}%`;
        ctx.fillStyle = color;
        ctx.fillRect(box.x, box.y - 24, ctx.measureText(label).width + 16, 24);
        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";
        ctx.fillText(label, box.x + 8, box.y - 7);
      }

      // Send to API
      try {
        const faceCanvas = cropFaceFromCanvas(video, box);
        const blob = await canvasToBlob(faceCanvas);
        const snapshotPath = await uploadSnapshot(blob);

        const res = await fetch("/api/detections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descriptor: JSON.parse(descriptor),
            expression: dominant,
            satisfactionTag: satisfaction,
            confidence,
            rawExpressions: expressions,
            snapshotPath,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          newDetections.push({
            expression: dominant,
            satisfactionTag: satisfaction,
            confidence,
            timestamp: new Date().toISOString(),
            customerIsNew: data.isNew,
          });
        }
      } catch (err) {
        console.error("Failed to process detection:", err);
      }
    }

    setState((prev) => ({
      ...prev,
      facesDetected: resized.length,
      fps,
      detections:
        newDetections.length > 0
          ? [...newDetections, ...prev.detections].slice(0, 50)
          : prev.detections,
    }));
  }, [videoRef, canvasRef]);

  const startDetection = useCallback(() => {
    if (intervalRef.current) return;
    setState((prev) => ({ ...prev, isDetecting: true }));
    intervalRef.current = setInterval(
      detectFaces,
      DETECTION_CONFIG.analysisInterval
    );
  }, [detectFaces]);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState((prev) => ({ ...prev, isDetecting: false, facesDetected: 0 }));
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    if (isActive && state.isModelLoaded) {
      startDetection();
    } else {
      stopDetection();
    }
    return () => stopDetection();
  }, [isActive, state.isModelLoaded, startDetection, stopDetection]);

  return state;
}
