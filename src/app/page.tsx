import { fetchAllUsers } from "@/lib/fetchAllUsers";
import { computePowerLevel } from "@/lib/condition";
import BattleCard from "@/components/BattleCard";
import TrendChart from "@/components/TrendChart";
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

  // Determine winner by power level
  const powers = users.map((u) =>
    computePowerLevel(u.sleep, u.readiness, u.activity)
  );
  const maxPower = Math.max(...powers);
  const hasMultiple = users.length > 1;
  const hasTie = hasMultiple && powers.filter((p) => p === maxPower).length > 1;

  return (
    <main className="min-h-screen py-10 px-4 sm:px-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-black tracking-tighter uppercase">
          Health{" "}
          <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
            Battle
          </span>
        </h1>
        <p className="text-neutral-600 text-sm mt-1 font-mono">
          powered by Oura Ring
        </p>
      </header>

      {/* VS Battle Area */}
      <div className="max-w-6xl mx-auto">
        {users.length === 1 ? (
          /* Solo mode */
          <div className="max-w-md mx-auto">
            <BattleCard user={users[0]} side="left" isWinner={false} />
          </div>
        ) : (
          /* Battle mode */
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            <BattleCard
              user={users[0]}
              side="left"
              isWinner={!hasTie && powers[0] === maxPower}
            />

            {/* VS Badge */}
            <div className="flex items-center justify-center lg:flex-col">
              <div className="animate-vs relative">
                <div className="text-5xl font-black text-transparent bg-gradient-to-b from-red-500 to-orange-600 bg-clip-text drop-shadow-2xl">
                  VS
                </div>
                <div className="absolute inset-0 text-5xl font-black text-red-500/20 blur-lg animate-pulse-glow">
                  VS
                </div>
              </div>
            </div>

            <BattleCard
              user={users[1]}
              side="right"
              isWinner={!hasTie && powers[1] === maxPower}
            />
          </div>
        )}

        {/* Draw */}
        {hasMultiple && hasTie && maxPower > 0 && (
          <div className="text-center mt-6">
            <span className="text-neutral-500 font-bold text-sm uppercase tracking-widest">
              ⚔️ 引き分け ⚔️
            </span>
          </div>
        )}
      </div>

      {/* Trend Charts */}
      {users.some((u) => u.sleepTrend.length > 0) && (
        <div className="max-w-6xl mx-auto mt-10">
          <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4 text-center">
            7日間トレンド
          </h2>
          <div
            className={`grid gap-6 ${
              users.length > 1 ? "lg:grid-cols-2" : "max-w-md mx-auto"
            }`}
          >
            {users.map((user, i) => (
              <div
                key={user.name}
                className="bg-neutral-900 rounded-xl border border-neutral-800 p-5"
              >
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 text-neutral-400">
                  {user.name}
                </h3>
                <TrendChart
                  data={buildTrend(user)}
                  label=""
                  color={i === 0 ? "#6366f1" : "#f43f5e"}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="max-w-6xl mx-auto mt-10 text-center text-xs text-neutral-700 font-mono">
        5分ごとに更新 · Oura Ring API v2
      </footer>
    </main>
  );
}
