import type { ConditionLevel, DailySleep, DailyReadiness, DailyActivity } from "./types";

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
  activity: DailyActivity | null
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
  { label: string; rank: string; color: string; accent: string }
> = {
  great: {
    label: "絶好調",
    rank: "S",
    color: "text-amber-500",
    accent: "#f59e0b",
  },
  good: {
    label: "好調",
    rank: "A",
    color: "text-emerald-500",
    accent: "#10b981",
  },
  fair: {
    label: "まあまあ",
    rank: "B",
    color: "text-violet-500",
    accent: "#8b5cf6",
  },
  low: {
    label: "お休みモード",
    rank: "C",
    color: "text-rose-400",
    accent: "#fb7185",
  },
};
