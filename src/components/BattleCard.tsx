import Link from "next/link";
import type { UserHealth } from "@/lib/types";
import { conditionConfig, computePowerLevel } from "@/lib/condition";
import ScoreRing from "./ScoreRing";
import MiniMetric from "./MiniMetric";

interface BattleCardProps {
  user: UserHealth;
  isWinner: boolean;
}

export default function BattleCard({ user, isWinner }: BattleCardProps) {
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
  const distance = user.activity
    ? (user.activity.equivalent_walking_distance / 1000).toFixed(1)
    : "0";

  const stale = user.latestDay ? isStale(user.latestDay) : false;

  // Build mini trend from sleepTrend
  const sleepTrend = user.sleepTrend
    .map((s) => s.score)
    .filter((s): s is number => s != null);

  if (user.error) {
    return (
      <div className="card p-6 flex-1 animate-fade-up">
        <h2 className="text-lg font-bold capitalize mb-2">{user.name}</h2>
        <p className="text-slate-400 text-sm">{user.error}</p>
      </div>
    );
  }

  // No data at all (new user who hasn't synced yet)
  const hasNoData = !user.sleep && !user.readiness && !user.activity;
  if (hasNoData) {
    return (
      <div className="card p-6 flex-1 animate-fade-up">
        <h2 className="text-lg font-bold capitalize mb-2">{user.name}</h2>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <span className="text-3xl mb-3">⌚</span>
          <p className="text-sm font-medium text-slate-600 mb-1">
            まだデータがありません
          </p>
          <p className="text-xs text-slate-400">
            Oura Ringを装着してデータを同期してください
          </p>
        </div>
      </div>
    );
  }

  // 2日以上前のデータの場合は同期促すカードを表示
  const now = new Date();
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  const isOld = stale && user.latestDay !== yesterdayStr;
  if (isOld && user.latestDay) {
    return (
      <div className="card p-6 flex-1 animate-fade-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold capitalize">{user.name}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
            {daysAgoLabel(user.latestDay)}前
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <span className="text-3xl mb-3">📡</span>
          <p className="text-sm font-medium text-slate-600 mb-1">
            今日のデータがありません
          </p>
          <p className="text-xs text-slate-400">
            アプリを開いてデータを同期してください
          </p>
        </div>
        <div className="text-center">
          <Link
            href={`/user/${user.name.toLowerCase()}`}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
          >
            過去のデータを見る →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card card-interactive flex-1 overflow-hidden animate-fade-up ${
        isWinner ? "ring-2 ring-blue-400/40" : ""
      }`}
    >
      {/* Header */}
      <div className="p-5 pb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold capitalize tracking-tight">
              {user.name}
            </h2>
            {isWinner && (
              <span className="score-badge bg-amber-50 text-amber-600">
                👑 勝利
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-400 font-mono">
              {user.latestDay ?? "—"}
            </span>
            {stale && user.latestDay && (
              <span className="score-badge bg-amber-50 text-amber-500 text-[10px]">
                {daysAgoLabel(user.latestDay)}前
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={`text-2xl font-black ${cfg.color}`}>
              {cfg.rank}
            </span>
            <p className="text-[10px] text-slate-400">{cfg.label}</p>
          </div>
        </div>
      </div>

      {/* Power bar */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-400 font-medium">
            戦闘力
          </span>
          <span className="text-xs font-bold tabular-nums text-slate-600">
            {power}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${power}%`,
              background:
                power >= 85
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : power >= 70
                  ? "linear-gradient(90deg, #3b82f6, #2563eb)"
                  : power >= 50
                  ? "linear-gradient(90deg, #f59e0b, #d97706)"
                  : "linear-gradient(90deg, #ef4444, #dc2626)",
            }}
          />
        </div>
      </div>

      {/* Score rings */}
      <div className="px-5 py-4 flex justify-center gap-6 border-t border-slate-50">
        <ScoreRing score={user.sleep?.score ?? null} label="睡眠" />
        <ScoreRing score={user.readiness?.score ?? null} label="回復" />
        <ScoreRing score={user.activity?.score ?? null} label="活動" />
      </div>

      {/* Mini metrics row */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        <MiniMetric
          label="歩数"
          value={steps.toLocaleString()}
          icon="🚶"
          trend={sleepTrend}
          color="#3b82f6"
        />
        <MiniMetric
          label="消費"
          value={`${calories}`}
          unit="kcal"
          icon="🔥"
          color="#ef4444"
        />
        <MiniMetric
          label="心拍"
          value={latestHR ? `${latestHR}` : "—"}
          unit={latestHR ? "bpm" : undefined}
          icon="❤️"
          color="#ec4899"
        />
        <MiniMetric
          label="安静時HR"
          value={restingHR ? `${restingHR}` : "—"}
          unit={restingHR ? "bpm" : undefined}
          icon="💤"
          color="#8b5cf6"
        />
      </div>

      {/* Gen4 row */}
      {(user.spo2 || user.stress || user.resilience || user.cardiovascularAge || user.vo2Max) && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {user.spo2?.spo2_percentage && (
            <div className="w-[calc(50%-0.25rem)]"><MiniMetric label="血中酸素" value={`${user.spo2.spo2_percentage.average}`} unit="%" icon="🫁" color="#06b6d4" /></div>
          )}
          {user.stress?.day_summary && (
            <div className="w-[calc(50%-0.25rem)]"><MiniMetric label="ストレス" value={user.stress.day_summary} icon="🧠" color="#f59e0b" /></div>
          )}
          {user.cardiovascularAge?.vascular_age != null && (
            <div className="w-[calc(50%-0.25rem)]"><MiniMetric label="血管年齢" value={`${user.cardiovascularAge.vascular_age}`} unit="歳" icon="🫀" color="#ef4444" /></div>
          )}
          {user.vo2Max?.vo2_max != null && (
            <div className="w-[calc(50%-0.25rem)]"><MiniMetric label="VO2 Max" value={`${user.vo2Max.vo2_max}`} icon="🏃" color="#22c55e" /></div>
          )}
        </div>
      )}

      {/* Detail link */}
      <Link
        href={`/user/${user.name.toLowerCase()}`}
        className="block px-5 py-3 border-t border-slate-50 text-center text-xs text-blue-500 hover:bg-blue-50/50 transition font-medium"
      >
        詳細を見る →
      </Link>
    </div>
  );
}

function isStale(day: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return day !== today;
}

function daysAgoLabel(day: string): string {
  const now = new Date();
  const dataDate = new Date(day + "T00:00:00");
  const diffMs = now.getTime() - dataDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 30) return `${diffDays}日`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月`;
  const years = Math.floor(diffDays / 365);
  const remainMonths = Math.floor((diffDays % 365) / 30);
  if (remainMonths === 0) return `${years}年`;
  return `約${years}年${remainMonths}ヶ月`;
}
