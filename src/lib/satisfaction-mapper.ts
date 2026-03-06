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
  const score =
    expressions.happy * 1.0 +
    expressions.surprised * 0.3 +
    expressions.neutral * 0.0 +
    expressions.fearful * -0.3 +
    expressions.sad * -0.7 +
    expressions.disgusted * -0.9 +
    expressions.angry * -1.0;

  if (score >= 0.3) return "SATISFIED";
  if (score <= -0.2) return "UNSATISFIED";
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
