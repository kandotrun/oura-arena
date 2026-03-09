import type { UserHealth } from "@/lib/types";
import ScoreRing from "./ScoreRing";
import StatItem from "./StatItem";
import ConditionBadge from "./ConditionBadge";
import TrendChart from "./TrendChart";

interface UserCardProps {
  user: UserHealth;
}

export default function UserCard({ user }: UserCardProps) {
  if (user.error) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
        <h2 className="text-xl font-semibold capitalize mb-2">{user.name}</h2>
        <p className="text-neutral-400 text-sm">{user.error}</p>
      </div>
    );
  }

  // Latest reading (sorted by timestamp desc)
  const sortedHR = [...user.heartRate].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const latestHR = sortedHR[0]?.bpm ?? null;

  // Resting HR: minimum from rest/sleep source readings
  const restingEntries = user.heartRate.filter(
    (h) => h.source === "rest" || h.source === "sleep"
  );
  const restingHR =
    restingEntries.length > 0
      ? Math.min(...restingEntries.map((h) => h.bpm))
      : null;

  const steps = user.activity?.steps ?? 0;
  const calories = user.activity?.active_calories ?? 0;
  const distance = user.activity
    ? (user.activity.equivalent_walking_distance / 1000).toFixed(1)
    : "0";

  const trendData = buildTrend(user);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold capitalize">{user.name}</h2>
          <p className="text-neutral-400 text-sm mt-0.5">Today</p>
        </div>
        <ConditionBadge condition={user.condition} />
      </div>

      {/* Scores */}
      <div className="px-8 py-6 flex justify-center gap-10 border-t border-neutral-100">
        <ScoreRing score={user.sleep?.score ?? null} label="Sleep" />
        <ScoreRing score={user.readiness?.score ?? null} label="Readiness" />
        <ScoreRing score={user.activity?.score ?? null} label="Activity" />
      </div>

      {/* Stats */}
      <div className="px-8 py-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 border-t border-neutral-100">
        <StatItem label="Steps" value={steps.toLocaleString()} />
        <StatItem
          label="Active Cal"
          value={calories.toLocaleString()}
          unit="kcal"
        />
        <StatItem label="Distance" value={distance} unit="km" />
        <div className="flex flex-col">
          <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">
            Heart Rate
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-semibold tabular-nums">
              {latestHR ?? "—"}
            </span>
            {latestHR && (
              <span className="text-sm text-neutral-400">bpm</span>
            )}
          </div>
          {restingHR && (
            <span className="text-xs text-neutral-400 mt-0.5">
              Resting: {restingHR}
            </span>
          )}
        </div>
      </div>

      {/* Trend */}
      <div className="px-8 py-6 border-t border-neutral-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-neutral-500">7-Day Trend</h3>
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded bg-indigo-400" />
              Sleep
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded bg-emerald-400" />
              Readiness
            </span>
          </div>
        </div>
        <TrendChart data={trendData} />
      </div>
    </div>
  );
}

function buildTrend(user: UserHealth) {
  const sleepMap = new Map(
    user.sleepTrend.map((s) => [s.day, s.score])
  );
  const readinessMap = new Map(
    user.readinessTrend.map((r) => [r.day, r.score])
  );
  const days = new Set([...sleepMap.keys(), ...readinessMap.keys()]);
  return Array.from(days)
    .sort()
    .map((day) => ({
      day,
      sleep: sleepMap.get(day) ?? null,
      readiness: readinessMap.get(day) ?? null,
    }));
}
