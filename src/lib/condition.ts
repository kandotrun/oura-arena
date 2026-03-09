import type { ConditionLevel, DailySleep, DailyReadiness } from "./types";

export function computeCondition(
  sleep: DailySleep | null,
  readiness: DailyReadiness | null
): ConditionLevel {
  const scores: number[] = [];
  if (sleep?.score != null) scores.push(sleep.score);
  if (readiness?.score != null) scores.push(readiness.score);

  if (scores.length === 0) return "fair";

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  if (avg >= 85) return "great";
  if (avg >= 70) return "good";
  if (avg >= 50) return "fair";
  return "low";
}

export function computePowerLevel(
  sleep: DailySleep | null,
  readiness: DailyReadiness | null,
  activity: import("./types").DailyActivity | null
): number {
  const scores: number[] = [];
  if (sleep?.score != null) scores.push(sleep.score);
  if (readiness?.score != null) scores.push(readiness.score);
  if (activity?.score != null) scores.push(activity.score);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export const conditionConfig: Record<
  ConditionLevel,
  { label: string; rank: string; color: string; glow: string }
> = {
  great: {
    label: "絶好調",
    rank: "S",
    color: "text-yellow-400",
    glow: "shadow-yellow-400/30",
  },
  good: {
    label: "好調",
    rank: "A",
    color: "text-emerald-400",
    glow: "shadow-emerald-400/30",
  },
  fair: {
    label: "まあまあ",
    rank: "B",
    color: "text-amber-400",
    glow: "shadow-amber-400/30",
  },
  low: {
    label: "休め",
    rank: "C",
    color: "text-red-400",
    glow: "shadow-red-400/30",
  },
};
