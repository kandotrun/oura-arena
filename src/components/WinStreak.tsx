import type { UserHealth } from "@/lib/types";
import { computePowerLevel } from "@/lib/condition";

interface Props {
  users: UserHealth[];
}

export default function WinStreak({ users }: Props) {
  if (users.length < 2) return null;

  // Compare latest power levels
  const powers = users.map((u) =>
    computePowerLevel(u.sleep, u.readiness, u.activity)
  );

  const maxPower = Math.max(...powers);
  const winnerIdx = powers.indexOf(maxPower);
  const isTie = powers.filter((p) => p === maxPower).length > 1;

  if (isTie || maxPower === 0) return null;

  const winner = users[winnerIdx];
  const loser = users[1 - winnerIdx];
  const diff = powers[winnerIdx] - powers[1 - winnerIdx];

  return (
    <div className="card p-4 text-center">
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
