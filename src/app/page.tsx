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

  const powers = users.map((u) =>
    computePowerLevel(u.sleep, u.readiness, u.activity)
  );
  const maxPower = Math.max(...powers);
  const hasMultiple = users.length > 1;
  const hasTie = hasMultiple && powers.filter((p) => p === maxPower).length > 1;

  const trendColors = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b"];

  return (
    <main className="min-h-screen py-10 px-4 sm:px-6">
      {/* Header */}
      <header className="max-w-5xl mx-auto mb-8 text-center">
        <p className="text-[10px] text-neutral-400 uppercase tracking-[0.3em] font-mono mb-1">
          oura ring
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          arena
        </h1>
      </header>

      {/* Battle Area */}
      <div className="max-w-5xl mx-auto">
        {users.length === 1 ? (
          <div className="max-w-sm mx-auto">
            <BattleCard user={users[0]} side="left" isWinner={false} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-5 items-stretch">
            <BattleCard
              user={users[0]}
              side="left"
              isWinner={!hasTie && powers[0] === maxPower}
            />

            {/* VS */}
            <div className="flex items-center justify-center py-2 lg:py-0">
              <div className="animate-vs animate-float">
                <span className="text-3xl font-black text-neutral-300/60 tracking-tighter select-none">
                  vs
                </span>
              </div>
            </div>

            <BattleCard
              user={users[1]}
              side="right"
              isWinner={!hasTie && powers[1] === maxPower}
            />
          </div>
        )}

        {hasMultiple && hasTie && maxPower > 0 && (
          <div className="text-center mt-5">
            <span className="text-neutral-400 font-mono text-xs uppercase tracking-widest">
              draw
            </span>
          </div>
        )}
      </div>

      {/* Trends */}
      {users.some((u) => u.sleepTrend.length > 0) && (
        <div className="max-w-5xl mx-auto mt-8">
          <p className="text-[10px] text-neutral-400 uppercase tracking-[0.2em] font-mono mb-4 text-center">
            7-day trend
          </p>
          <div
            className={`grid gap-4 ${
              users.length > 1 ? "lg:grid-cols-2" : "max-w-sm mx-auto"
            }`}
          >
            {users.map((user, i) => (
              <div key={user.name} className="glass rounded-xl p-4">
                <p className="text-xs font-semibold tracking-tight mb-2 text-neutral-500">
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

      <footer className="max-w-5xl mx-auto mt-10 text-center">
        <span className="text-[10px] text-neutral-300 font-mono tracking-widest">
          refresh · 5min
        </span>
      </footer>
    </main>
  );
}
