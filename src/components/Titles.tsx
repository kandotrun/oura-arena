import { computeTitles, type Title } from "@/lib/titles";
import type { DailySleep, DailyActivity } from "@/lib/types";
import type { SleepDetail } from "@/lib/fetchUserDetail";

interface Props {
  sleepHistory: DailySleep[];
  activityHistory: DailyActivity[];
  sleepDetails: SleepDetail[];
}

export default function Titles({
  sleepHistory,
  activityHistory,
  sleepDetails,
}: Props) {
  const titles = computeTitles(
    sleepHistory,
    activityHistory as any,
    sleepDetails as any
  );

  // カテゴリでグループ化
  const categories = new Map<string, Title[]>();
  for (const t of titles) {
    const list = categories.get(t.category) ?? [];
    list.push(t);
    categories.set(t.category, list);
  }

  return (
    <div className="space-y-2">
      {Array.from(categories.entries()).map(([cat, catTitles]) => (
        <div key={cat} className="flex flex-wrap gap-1.5">
          {catTitles.map((t) => (
            <div
              key={t.name}
              className="group relative inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200/60 hover:border-blue-200 hover:from-blue-50 hover:to-indigo-50 transition-all cursor-default text-[11px]"
            >
              <span>{t.emoji}</span>
              <span className="font-semibold text-slate-700">{t.name}</span>
              {/* ツールチップ */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-slate-800 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {t.reason}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
