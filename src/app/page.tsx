import { fetchAllUsers } from "@/lib/fetchAllUsers";
import { computePowerLevel } from "@/lib/condition";
import BattleCard from "@/components/BattleCard";
import TrendChart from "@/components/TrendChart";
import WinStreak from "@/components/WinStreak";
import StressBattle from "@/components/StressBattle";
import type { UserHealth } from "@/lib/types";

export const revalidate = 300;

function buildTrend(user: UserHealth) {
  const sleepMap = new Map(user.sleepTrend.map((s) => [s.day, s.score]));
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

export default async function Home() {
  const users = await fetchAllUsers();

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  // 今日または昨日のデータがある人だけバトル対象
  const powers = users.map((u) => {
    const isRecent = u.latestDay === today || u.latestDay === yesterday;
    return isRecent ? computePowerLevel(u.sleep, u.readiness, u.activity) : 0;
  });
  const activePowers = powers.filter((p) => p > 0);
  const maxPower = activePowers.length > 0 ? Math.max(...activePowers) : 0;
  const hasMultiple = activePowers.length > 1;
  const hasTie = hasMultiple && activePowers.filter((p) => p === maxPower).length > 1;

  const trendColors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Oura Arena
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            チームウェルネスダッシュボード
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          5分ごとに更新
        </div>
      </header>

      {/* Win Streak — 一番上 */}
      {hasMultiple && (
        <div className="max-w-6xl mx-auto mb-4">
          <WinStreak users={users} />
        </div>
      )}

      {/* Battle Cards — 横並び */}
      <div className="max-w-6xl mx-auto">
        {users.length === 1 ? (
          <div className="max-w-md mx-auto">
            <BattleCard user={users[0]} isWinner={false} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {users.map((user, i) => (
              <BattleCard
                key={user.name}
                user={user}
                isWinner={!hasTie && powers[i] === maxPower}
              />
            ))}
          </div>
        )}

        {hasMultiple && hasTie && maxPower > 0 && (
          <div className="text-center mt-4">
            <span className="score-badge bg-slate-100 text-slate-500 text-xs">
              ⚔️ 引き分け
            </span>
          </div>
        )}
      </div>

      {/* Stress Battle */}
      <div className="max-w-6xl mx-auto mt-6">
        <StressBattle users={users} />
      </div>

      {/* Trends */}
      {users.some((u) => u.sleepTrend.length > 0) && (
        <div className="max-w-6xl mx-auto mt-6">
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            7日間トレンド
          </h2>
          <div className={`grid gap-4 ${users.length > 1 ? "lg:grid-cols-2" : "max-w-md mx-auto"}`}>
            {users.map((user, i) => (
              <div key={user.name} className="card p-5">
                <p className="text-sm font-semibold text-slate-600 mb-2 capitalize">
                  {user.name}
                </p>
                <TrendChart
                  data={buildTrend(user)}
                  label=""
                  color={trendColors[i % trendColors.length]}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
