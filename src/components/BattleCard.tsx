import type { UserHealth } from "@/lib/types";
import { conditionConfig, computePowerLevel } from "@/lib/condition";
import ScoreRing from "./ScoreRing";

interface BattleCardProps {
  user: UserHealth;
  side: "left" | "right";
  isWinner: boolean;
}

export default function BattleCard({ user, side, isWinner }: BattleCardProps) {
  const cfg = conditionConfig[user.condition];
  const power = computePowerLevel(user.sleep, user.readiness, user.activity);

  const latestHR =
    user.heartRate.length > 0
      ? user.heartRate[user.heartRate.length - 1].bpm
      : null;
  const restingHR =
    user.heartRate.length > 0
      ? Math.min(...user.heartRate.map((h) => h.bpm))
      : null;

  const steps = user.activity?.steps ?? 0;
  const calories = user.activity?.active_calories ?? 0;

  const slideClass =
    side === "left" ? "animate-slide-left" : "animate-slide-right";

  const powerBarClass =
    power >= 85 ? "power-bar-top" : power >= 70 ? "power-bar-high" : "power-bar";

  if (user.error) {
    return (
      <div className={`${slideClass} glass rounded-2xl p-6 flex-1`}>
        <h2 className="text-lg font-semibold capitalize mb-2">{user.name}</h2>
        <p className="text-neutral-400 text-sm">{user.error}</p>
      </div>
    );
  }

  const stale = user.latestDay ? isStale(user.latestDay) : false;

  return (
    <div
      className={`${slideClass} glass-strong rounded-2xl flex-1 overflow-hidden ${
        isWinner ? "ring-2 ring-amber-400/50 shadow-lg shadow-amber-200/20" : "shadow-sm"
      }`}
    >
      {/* Stale warning */}
      {stale && user.latestDay && (
        <div className="px-5 pt-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-600 text-[11px] font-medium">
            ⏰ {daysAgoLabel(user.latestDay)}のデータ
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`px-5 ${stale ? "pt-3" : "pt-5"} pb-3 flex items-start justify-between`}>
        <div>
          <h2 className="text-lg font-bold tracking-tight">{user.name}</h2>
          <p className="text-neutral-400 text-[11px] mt-0.5 font-mono">
            {user.latestDay ?? "—"}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <span
            className={`text-3xl font-black ${cfg.color}`}
            style={{ lineHeight: 1 }}
          >
            {cfg.rank}
          </span>
          <span className="text-[10px] font-semibold text-neutral-400 mt-1">
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Power Level */}
      <div className="px-5 pb-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
            power
          </span>
          <span className="text-sm font-bold tabular-nums font-mono">
            {power}
          </span>
        </div>
        <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${powerBarClass} transition-all duration-1000 ease-out`}
            style={{ width: `${power}%` }}
          />
        </div>
      </div>

      {/* Scores */}
      <div className="px-5 py-4 flex justify-center gap-5 border-t border-black/[0.04]">
        <ScoreRing score={user.sleep?.score ?? null} label="睡眠" />
        <ScoreRing score={user.readiness?.score ?? null} label="回復" />
        <ScoreRing score={user.activity?.score ?? null} label="活動" />
      </div>

      {/* Stats */}
      <div className="px-5 py-3.5 grid grid-cols-2 gap-3 border-t border-black/[0.04]">
        <Stat label="steps" value={steps.toLocaleString()} />
        <Stat label="cal" value={`${calories}`} unit="kcal" />
        <Stat label="hr" value={latestHR ? `${latestHR}` : "—"} unit={latestHR ? "bpm" : undefined} />
        <Stat label="resting" value={restingHR ? `${restingHR}` : "—"} unit={restingHR ? "bpm" : undefined} />
      </div>

      {/* Winner */}
      {isWinner && (
        <div className="px-5 py-2.5 border-t border-amber-200/40 bg-amber-50/50 text-center">
          <span className="text-amber-600 text-xs font-bold tracking-widest uppercase">
            👑 winner
          </span>
        </div>
      )}
    </div>
  );
}

function isStale(day: string): boolean {
  const now = new Date();
  const dataDate = new Date(day + "T00:00:00");
  const diffMs = now.getTime() - dataDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 1;
}

function daysAgoLabel(day: string): string {
  const now = new Date();
  const dataDate = new Date(day + "T00:00:00");
  const diffMs = now.getTime() - dataDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 30) return `${diffDays}日前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`;
  const years = Math.floor(diffDays / 365);
  const remainMonths = Math.floor((diffDays % 365) / 30);
  if (remainMonths === 0) return `${years}年前`;
  return `約${years}年${remainMonths}ヶ月前`;
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div>
      <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
        {label}
      </span>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-sm font-semibold tabular-nums">{value}</span>
        {unit && (
          <span className="text-[10px] text-neutral-400">{unit}</span>
        )}
      </div>
    </div>
  );
}
