export function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob from canvas"));
      },
      "image/jpeg",
      quality
    );
  });
}

export function cropFaceFromCanvas(
  video: HTMLVideoElement,
  box: { x: number; y: number; width: number; height: number },
  padding = 30
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const x = Math.max(0, box.x - padding);
  const y = Math.max(0, box.y - padding);
  const w = Math.min(video.videoWidth - x, box.width + padding * 2);
  const h = Math.min(video.videoHeight - y, box.height + padding * 2);

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(video, x, y, w, h, 0, 0, w, h);

  return canvas;
}

export async function uploadSnapshot(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, `snapshot-${Date.now()}.jpg`);

  const res = await fetch("/api/snapshots/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload snapshot");
  const data = await res.json();
  return data.path;
}
