"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { faceapi, loadFaceApiModels } from "@/lib/face-api-loader";
import {
  mapExpressionToSatisfaction,
  getDominantExpression,
  type ExpressionScores,
} from "@/lib/satisfaction-mapper";
import {
  cropFaceFromCanvas,
  canvasToBlob,
  uploadSnapshot,
} from "@/lib/snapshot-utils";
import type { LiveDetection } from "@/types/detection";

interface FaceDetectionState {
  isModelLoaded: boolean;
  isDetecting: boolean;
  facesDetected: number;
  fps: number;
  detections: LiveDetection[];
}

const DETECTION_INTERVAL = 1500;
const MIN_CONFIDENCE = 0.4;

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

  const animFrameRef = useRef<number | null>(null);
  const lastDetectionTime = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const isProcessing = useRef(false);

  const loadModels = useCallback(async () => {
    try {
      await loadFaceApiModels();
      setState((prev) => ({ ...prev, isModelLoaded: true }));
    } catch (err) {
      console.error("Failed to load face-api models:", err);
    }
  }, []);

  // Submit detection to API in background (non-blocking)
  const submitToApi = useCallback(
    (
      video: HTMLVideoElement,
      box: { x: number; y: number; width: number; height: number },
      descriptor: Float32Array,
      dominant: string,
      satisfaction: string,
      confidence: number,
      expressions: ExpressionScores
    ) => {
      // Fire and forget — don't block the detection loop
      (async () => {
        try {
          // Try to capture snapshot, but don't block if it fails
          let snapshotPath = "no-snapshot";
          try {
            const faceCanvas = cropFaceFromCanvas(video, box);
            const blob = await canvasToBlob(faceCanvas);
            snapshotPath = await uploadSnapshot(blob);
          } catch (snapErr) {
            console.warn("[SatisfyCAM] Snapshot failed, saving without:", snapErr);
          }

          const payload = {
            descriptor: Array.from(descriptor),
            expression: dominant,
            satisfactionTag: satisfaction,
            confidence,
            rawExpressions: expressions,
            snapshotPath,
          };

          console.log("[SatisfyCAM] Submitting detection:", dominant, satisfaction, Math.round(confidence * 100) + "%");

          const res = await fetch("/api/detections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.skipped) {
              console.log("[SatisfyCAM] Skipped (cooldown) for customer:", data.customerId);
            } else {
              console.log("[SatisfyCAM] Saved!", data.isNew ? "NEW customer" : "Existing customer", data.customerId);
              setState((prev) => ({
                ...prev,
                detections: [
                  {
                    expression: dominant,
                    satisfactionTag: satisfaction,
                    confidence,
                    timestamp: new Date().toISOString(),
                    customerIsNew: data.isNew,
                  },
                  ...prev.detections,
                ].slice(0, 50),
              }));
            }
          } else {
            const errBody = await res.text();
            console.error("[SatisfyCAM] API error:", res.status, errBody);
          }
        } catch (err) {
          console.error("[SatisfyCAM] Submit error:", err);
        }
      })();
    },
    []
  );

  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended || !isActive) return;

    const now = performance.now();

    // FPS counter
    if (lastFrameTime.current > 0) {
      const fps = Math.round(1000 / (now - lastFrameTime.current));
      setState((prev) => {
        if (prev.fps !== fps) return { ...prev, fps };
        return prev;
      });
    }
    lastFrameTime.current = now;

    // Only run detection at interval, not every frame
    if (now - lastDetectionTime.current >= DETECTION_INTERVAL && !isProcessing.current) {
      lastDetectionTime.current = now;
      isProcessing.current = true;

      const inputSize = 224;

      // Run detection async
      (async () => {
        try {
          const results = await faceapi
            .detectAllFaces(
              video,
              new faceapi.TinyFaceDetectorOptions({
                inputSize,
                scoreThreshold: MIN_CONFIDENCE,
              })
            )
            .withFaceLandmarks()
            .withFaceExpressions()
            .withFaceDescriptors();

          {
          const displaySize = {
            width: video.videoWidth,
            height: video.videoHeight,
          };
          faceapi.matchDimensions(canvas, displaySize);
          const resized = faceapi.resizeResults(results, displaySize);

          // Draw overlays
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          for (const detection of resized) {
            const expressions =
              detection.expressions as unknown as ExpressionScores;
            const satisfaction = mapExpressionToSatisfaction(expressions);
            const dominant = getDominantExpression(expressions);
            const confidence = Math.max(...Object.values(expressions));

            // Draw bounding box
            const box = detection.detection.box;
            if (ctx) {
              const color =
                satisfaction === "SATISFIED"
                  ? "#22c55e"
                  : satisfaction === "UNSATISFIED"
                  ? "#ef4444"
                  : "#eab308";

              // Box
              ctx.strokeStyle = color;
              ctx.lineWidth = 2;
              ctx.strokeRect(box.x, box.y, box.width, box.height);

              // Label background
              const label = `${dominant} ${Math.round(confidence * 100)}%`;
              ctx.font = "bold 13px sans-serif";
              const textWidth = ctx.measureText(label).width;
              ctx.fillStyle = color;
              ctx.fillRect(box.x, box.y - 26, textWidth + 14, 24);

              // Label text
              ctx.fillStyle = "#fff";
              ctx.fillText(label, box.x + 7, box.y - 9);
            }

            // Submit every detected face to API (backend handles cooldown)
            if (detection.descriptor) {
              submitToApi(
                video,
                box,
                detection.descriptor,
                dominant,
                satisfaction,
                confidence,
                expressions
              );
            }
          }

          setState((prev) => {
            if (prev.facesDetected !== resized.length) {
              return { ...prev, facesDetected: resized.length };
            }
            return prev;
          });

          isProcessing.current = false;
          }
        } catch (err) {
          console.error("Detection error:", err);
          isProcessing.current = false;
        }
      })();
    }

    animFrameRef.current = requestAnimationFrame(detectLoop);
  }, [videoRef, canvasRef, isActive, submitToApi]);

  const startDetection = useCallback(() => {
    setState((prev) => ({ ...prev, isDetecting: true }));
    lastDetectionTime.current = 0;
    lastFrameTime.current = 0;
    isProcessing.current = false;
    animFrameRef.current = requestAnimationFrame(detectLoop);
  }, [detectLoop]);

  const stopDetection = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    isProcessing.current = false;
    setState((prev) => ({ ...prev, isDetecting: false, facesDetected: 0 }));

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [canvasRef]);

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
