export interface ExpressionScores {
  happy: number;
  sad: number;
  angry: number;
  disgusted: number;
  fearful: number;
  surprised: number;
  neutral: number;
}

export type Satisfaction = "SATISFIED" | "NEUTRAL" | "UNSATISFIED";

export type Expression =
  | "HAPPY"
  | "SAD"
  | "ANGRY"
  | "DISGUSTED"
  | "FEARFUL"
  | "SURPRISED"
  | "NEUTRAL";

export function mapExpressionToSatisfaction(
  expressions: ExpressionScores
): Satisfaction {
  // Positive and negative signal strength (ignoring neutral)
  const positive = expressions.happy + expressions.surprised * 0.5;
  const negative =
    expressions.sad +
    expressions.angry +
    expressions.disgusted +
    expressions.fearful * 0.5;

  // In surveillance cameras, neutral dominates (~85%+).
  // Focus on the relative strength of non-neutral expressions.
  const nonNeutral = 1 - expressions.neutral;

  // If face is almost entirely neutral (>95%), use weighted score with low thresholds
  if (nonNeutral < 0.05) {
    return "NEUTRAL";
  }

  // Ratio of positive vs negative among non-neutral expressions
  const positiveRatio = nonNeutral > 0 ? positive / nonNeutral : 0;
  const negativeRatio = nonNeutral > 0 ? negative / nonNeutral : 0;

  // Thresholds tuned for surveillance cameras:
  // - happy >= 0.08 (subtle smile) → SATISFIED
  // - positiveRatio > 60% of non-neutral → SATISFIED
  // - negative expressions dominate → UNSATISFIED
  if (expressions.happy >= 0.08 || positiveRatio > 0.6) {
    return "SATISFIED";
  }
  if (negative >= 0.08 || negativeRatio > 0.6) {
    return "UNSATISFIED";
  }

  return "NEUTRAL";
}

export function getDominantExpression(
  expressions: ExpressionScores
): Expression {
  const entries = Object.entries(expressions) as [Expression, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0].toUpperCase() as Expression;
}

export function getSatisfactionEmoji(tag: string): string {
  switch (tag) {
    case "SATISFIED":
      return "\u{1F60A}";
    case "UNSATISFIED":
      return "\u{1F620}";
    default:
      return "\u{1F610}";
  }
}

export function getSatisfactionColor(tag: string): string {
  switch (tag) {
    case "SATISFIED":
      return "text-green-500";
    case "UNSATISFIED":
      return "text-red-500";
    default:
      return "text-yellow-500";
  }
}

export function getSatisfactionBgColor(tag: string): string {
  switch (tag) {
    case "SATISFIED":
      return "bg-green-500";
    case "UNSATISFIED":
      return "bg-red-500";
    default:
      return "bg-yellow-500";
  }
}
