export const DETECTION_CONFIG = {
  analysisInterval: parseInt(process.env.DETECTION_INTERVAL_MS || "2000", 10),
  minDetectionConfidence: parseFloat(
    process.env.MIN_DETECTION_CONFIDENCE || "0.6"
  ),
  faceMatchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD || "0.45"),
  cooldownPerCustomer: parseInt(
    process.env.CUSTOMER_COOLDOWN_MS || "60000",
    10
  ),
  videoConstraints: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user" as const,
  },
} as const;
