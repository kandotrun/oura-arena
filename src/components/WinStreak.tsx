import type { UserHealth } from "@/lib/types";
import { computePowerLevel } from "@/lib/condition";

interface Props {
  users: UserHealth[];
}

export default function WinStreak({ users }: Props) {
  if (users.length < 2) return null;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  // 今日または昨日のデータがある人だけでバトル判定
  const todayUsers = users.filter((u) => u.latestDay === today || u.latestDay === yesterday);
  if (todayUsers.length < 2) return null;

  const powers = todayUsers.map((u) =>
    computePowerLevel(u.sleep, u.readiness, u.activity)
  );

  // Need at least 2 users with actual data (power > 0)
  const activePowers = powers.filter((p) => p > 0);
  if (activePowers.length < 2) return null;

  const maxPower = Math.max(...powers);
  const winnerIdx = powers.indexOf(maxPower);
  const isTie = powers.filter((p) => p === maxPower).length > 1;

  if (isTie || maxPower === 0) return null;

  const winner = todayUsers[winnerIdx];

  // Find the runner-up (works for any number of users)
  const secondPower = Math.max(...powers.filter((_, i) => i !== winnerIdx));
  const loserIdx = powers.findIndex((p, i) => i !== winnerIdx && p === secondPower);
  if (loserIdx < 0) return null;
  const loser = todayUsers[loserIdx];
  const diff = maxPower - secondPower;

  return (
    <div className="card p-4 text-center animate-scale-in animate-pulse-glow">
      <div className="flex items-center justify-center gap-3">
        <span className="text-2xl">🔥</span>
        <div>
          <p className="text-sm font-bold text-slate-700">
            <span className="capitalize">{winner.name}</span> が{" "}
            <span className="capitalize">{loser.name}</span> に{" "}
            <span className="text-blue-500">+{diff}ポイント</span>で勝利中
          </p>
        </div>
        <span className="text-2xl">🔥</span>
      </div>
    </div>
  );
}
