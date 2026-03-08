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
  const { isModelLoaded, isDetecting, facesDetected, fps, detections } =
    useFaceDetection(videoRef, canvasRef, isActive);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Camera selector */}
      {devices.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Camera</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => switchCamera(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--gold-dim)] transition-colors"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Video feed */}
      <div
        className={`relative flex-1 min-h-0 bg-[var(--surface-raised)] rounded-2xl overflow-hidden transition-shadow duration-700 ${
          isActive ? "gold-glow" : "border border-[var(--border)]"
        }`}
      >
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Corner brackets when active */}
        {isActive && (
          <>
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[var(--gold)]/40 rounded-tl" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[var(--gold)]/40 rounded-tr" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[var(--gold)]/40 rounded-bl" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[var(--gold)]/40 rounded-br" />
          </>
        )}

        {/* Inactive state */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/90">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--surface-overlay)] border border-[var(--border)] mb-4">
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-muted)]">Camera desligada</p>
              {devices.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] mt-1 opacity-50">Nenhuma camera encontrada</p>
              )}
            </div>
          </div>
        )}

        {/* LIVE badge */}
        {isDetecting && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-[var(--surface)]/80 backdrop-blur-sm rounded-full border border-[var(--gold)]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-pulse" />
            <span className="text-[10px] font-mono font-medium text-[var(--gold)] uppercase tracking-widest">Live</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isDetecting ? "bg-[var(--gold)] animate-pulse" : "bg-[var(--border)]"}`} />
            <span className={isDetecting ? "text-[var(--text-secondary)]" : ""}>{isDetecting ? "Monitorando" : "Parado"}</span>
          </span>
          {isActive && (
            <>
              <span>{fps} fps</span>
              <span>{facesDetected} face{facesDetected !== 1 ? "s" : ""}</span>
              <span className="text-[var(--gold)]">{detections.length} salvo{detections.length !== 1 ? "s" : ""}</span>
            </>
          )}
          {!isModelLoaded && isActive && <span className="text-[var(--gold)]/70">Carregando IA...</span>}
        </div>

        <button
          onClick={isActive ? stopCamera : () => startCamera()}
          className={`px-5 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${
            isActive
              ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              : "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20 hover:bg-[var(--gold)]/20"
          }`}
        >
          {isActive ? "Parar" : "Iniciar"}
        </button>
      </div>
    </div>
  );
}
