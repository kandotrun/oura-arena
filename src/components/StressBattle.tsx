"use client";

import type { UserHealth } from "@/lib/types";

interface Props {
  users: UserHealth[];
}

function formatMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}分`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}時間${rm}分` : `${h}時間`;
}

function summaryLabel(summary: string | null): { text: string; color: string; emoji: string } {
  switch (summary) {
    case "restored":
      return { text: "回復済み", color: "text-green-600", emoji: "🧘" };
    case "normal":
      return { text: "通常", color: "text-blue-500", emoji: "😌" };
    case "stressful":
      return { text: "ストレスフル", color: "text-red-500", emoji: "😰" };
    default:
      return { text: "計測中", color: "text-slate-400", emoji: "⏳" };
  }
}

export default function StressBattle({ users }: Props) {
  // ストレスデータがある人だけ
  const stressUsers = users.filter((u) => u.stress && (u.stress.stress_high != null || u.stress.recovery_high != null));

  if (stressUsers.length === 0) return null;

  return (
    <div className="card rounded-2xl p-5">
      <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
        <span>⚔️</span> ストレスバトル
      </h2>
      <div className={`grid gap-4 ${stressUsers.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {stressUsers.map((user) => {
          const stress = user.stress!;
          const stressSec = stress.stress_high ?? 0;
          const recoverySec = stress.recovery_high ?? 0;
          const total = stressSec + recoverySec;
          const stressPercent = total > 0 ? (stressSec / total) * 100 : 50;
          const recoveryPercent = total > 0 ? (recoverySec / total) * 100 : 50;
          const summary = summaryLabel(stress.day_summary ?? null);

          // レジリエンス
          const res = user.resilience;

          return (
            <div key={user.name} className="rounded-xl bg-slate-50/80 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold capitalize">{user.name}</span>
                <span className={`text-xs font-semibold ${summary.color}`}>
                  {summary.emoji} {summary.text}
                </span>
              </div>

              {/* ストレス vs 回復バー */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>回復 {formatMinutes(recoverySec)}</span>
                  <span>ストレス {formatMinutes(stressSec)}</span>
                </div>
                <div className="h-4 rounded-full overflow-hidden flex bg-slate-200">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                    style={{ width: `${recoveryPercent}%` }}
                  />
                  <div
                    className="bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                    style={{ width: `${stressPercent}%` }}
                  />
                </div>
              </div>

              {/* レジリエンス */}
              {res && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">回復力:</span>
                  <ResilienceBadge level={res.level ?? "adequate"} />
                  {res.contributors && (
                    <div className="flex gap-2 text-[10px] text-slate-400">
                      <span>睡眠 {res.contributors.sleep_recovery?.toFixed(0)}</span>
                      <span>日中 {res.contributors.daytime_recovery?.toFixed(0)}</span>
                      <span>耐性 {res.contributors.stress?.toFixed(0)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* VS判定（2人以上） */}
      {stressUsers.length >= 2 && (() => {
        const ratios = stressUsers.map((u) => {
          const s = u.stress!;
          const st = s.stress_high ?? 0;
          const rc = s.recovery_high ?? 0;
          const total = st + rc;
          return total > 0 ? rc / total : 0.5;
        });
        const maxRatio = Math.max(...ratios);
        const winnerIdx = ratios.indexOf(maxRatio);
        const isTie = ratios.filter((r) => r === maxRatio).length > 1;

        if (isTie) return null;

        const winner = stressUsers[winnerIdx];
        const winPercent = Math.round(maxRatio * 100);

        return (
          <div className="mt-3 text-center text-xs text-slate-500">
            <span className="capitalize font-bold text-blue-500">{winner.name}</span>
            {" "}の方が回復できてる（回復率 {winPercent}%）
          </div>
        );
      })()}
    </div>
  );
}

function ResilienceBadge({ level }: { level: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    limited: { bg: "bg-red-100", text: "text-red-600", label: "低" },
    adequate: { bg: "bg-yellow-100", text: "text-yellow-700", label: "普通" },
    solid: { bg: "bg-blue-100", text: "text-blue-600", label: "良好" },
    strong: { bg: "bg-green-100", text: "text-green-600", label: "強い" },
    exceptional: { bg: "bg-purple-100", text: "text-purple-600", label: "最強" },
  };
  const c = config[level] ?? config.adequate;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
