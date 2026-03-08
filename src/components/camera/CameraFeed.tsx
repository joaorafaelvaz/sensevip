"use client";

import { useRef } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useFaceDetection } from "@/hooks/useFaceDetection";

export default function CameraFeed() {
  const {
    videoRef,
    isActive,
    error,
    devices,
    selectedDeviceId,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isModelLoaded, isDetecting, facesDetected, fps } = useFaceDetection(
    videoRef,
    canvasRef,
    isActive
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Camera selector */}
      {devices.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Camera:</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => switchCamera(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video feed */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="text-center text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-3 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm">Camera desligada</p>
              {devices.length === 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  Nenhuma camera encontrada
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isDetecting ? "bg-green-500 animate-pulse" : "bg-gray-600"
              }`}
            />
            {isDetecting ? "Monitorando" : "Parado"}
          </span>
          {isActive && (
            <>
              <span>FPS: {fps}</span>
              <span>Faces: {facesDetected}</span>
            </>
          )}
          {!isModelLoaded && isActive && (
            <span className="text-yellow-500">Carregando modelos IA...</span>
          )}
        </div>

        <button
          onClick={isActive ? stopCamera : () => startCamera()}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {isActive ? "Parar" : "Iniciar"}
        </button>
      </div>
    </div>
  );
}
