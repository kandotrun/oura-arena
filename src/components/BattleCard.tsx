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

  const borderColor = isWinner
    ? "border-yellow-400/40"
    : "border-neutral-800";

  const bgGlow = isWinner
    ? "shadow-[0_0_40px_rgba(250,204,21,0.08)]"
    : "";

  if (user.error) {
    return (
      <div
        className={`${slideClass} bg-neutral-900 rounded-2xl border ${borderColor} p-8 flex-1`}
      >
        <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">
          {user.name}
        </h2>
        <p className="text-neutral-500 text-sm">{user.error}</p>
      </div>
    );
  }

  return (
    <div
      className={`${slideClass} bg-neutral-900 rounded-2xl border ${borderColor} ${bgGlow} flex-1 overflow-hidden`}
    >
      {/* Stale data warning */}
      {user.latestDay && isStale(user.latestDay) && (
        <div className="px-6 pt-4 pb-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
            <span className="text-amber-400 text-xs">⚠</span>
            <span className="text-amber-400/80 text-[11px] font-medium">
              {daysAgoLabel(user.latestDay)}のデータ
            </span>
          </div>
        </div>
      )}

      {/* Header with rank */}
      <div className="px-6 pt-4 pb-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider">
            {user.name}
          </h2>
          <p className="text-neutral-600 text-xs mt-1 font-mono">
            {user.latestDay ?? "—"}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <div
            className={`text-4xl font-black ${cfg.color} drop-shadow-lg`}
          >
            {cfg.rank}
          </div>
          <span className={`text-xs font-semibold ${cfg.color} mt-0.5`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Power Level Bar */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
            戦闘力
          </span>
          <span className={`text-lg font-bold tabular-nums ${cfg.color}`}>
            {power}
          </span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${power}%`,
              background: `linear-gradient(90deg, ${
                power >= 85
                  ? "#facc15, #f59e0b"
                  : power >= 70
                  ? "#34d399, #22c55e"
                  : power >= 50
                  ? "#fbbf24, #f59e0b"
                  : "#f87171, #ef4444"
              })`,
              boxShadow: `0 0 12px ${
                power >= 85
                  ? "rgba(250,204,21,0.4)"
                  : power >= 70
                  ? "rgba(52,211,153,0.4)"
                  : power >= 50
                  ? "rgba(251,191,36,0.4)"
                  : "rgba(248,113,113,0.4)"
              }`,
            }}
          />
        </div>
      </div>

      {/* Score Rings */}
      <div className="px-6 py-5 flex justify-center gap-6 border-t border-neutral-800">
        <ScoreRing score={user.sleep?.score ?? null} label="睡眠" />
        <ScoreRing score={user.readiness?.score ?? null} label="回復" />
        <ScoreRing score={user.activity?.score ?? null} label="活動" />
      </div>

      {/* Stats Grid */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4 border-t border-neutral-800">
        <Stat label="歩数" value={steps.toLocaleString()} />
        <Stat label="消費" value={`${calories.toLocaleString()} kcal`} />
        <Stat label="心拍" value={latestHR ? `${latestHR} bpm` : "—"} />
        <Stat label="安静時" value={restingHR ? `${restingHR} bpm` : "—"} />
      </div>

      {/* Winner crown */}
      {isWinner && (
        <div className="px-6 py-3 border-t border-yellow-400/20 bg-yellow-400/5 text-center">
          <span className="text-yellow-400 text-sm font-bold tracking-wider">
            👑 勝利
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium">
        {label}
      </span>
      <p className="text-sm font-semibold text-neutral-300 tabular-nums mt-0.5">
        {value}
      </p>
    </div>
  );
}
