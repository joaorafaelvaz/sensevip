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
  const { happy, surprised, sad, angry, disgusted, fearful } = expressions;

  // Surveillance camera strategy: compare positive vs negative signals directly.
  // Even tiny values matter since neutral typically dominates at 85-99%.
  const positive = happy + surprised * 0.4;
  const negative = sad + angry + disgusted + fearful * 0.4;

  // Strategy 1: Clear dominant expression (not neutral)
  // Find highest non-neutral expression
  const nonNeutralScores = { happy, surprised, sad, angry, disgusted, fearful };
  const sorted = Object.entries(nonNeutralScores).sort((a, b) => b[1] - a[1]);
  const [topExpr, topScore] = sorted[0];

  // If any non-neutral expression is above a very low threshold (3%), use it
  if (topScore >= 0.03) {
    if (topExpr === "happy" || topExpr === "surprised") return "SATISFIED";
    if (topExpr === "sad" || topExpr === "angry" || topExpr === "disgusted") return "UNSATISFIED";
    // fearful → lean negative
    if (topExpr === "fearful") return "UNSATISFIED";
  }

  // Strategy 2: Compare aggregate positive vs negative
  // Even at very low levels, if positive > negative → SATISFIED
  if (positive > 0.02 && positive > negative * 1.5) return "SATISFIED";
  if (negative > 0.02 && negative > positive * 1.5) return "UNSATISFIED";

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
