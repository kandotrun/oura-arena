"use client";

interface DayData {
  day: string;
  score: number | null;
}

interface Props {
  data: DayData[];
  title?: string;
}

function scoreColor(score: number | null): string {
  if (score == null) return "#ebedf0";
  if (score >= 85) return "#22c55e";
  if (score >= 75) return "#4ade80";
  if (score >= 65) return "#86efac";
  if (score >= 50) return "#fbbf24";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

function scoreOpacity(score: number | null): number {
  if (score == null) return 0.4;
  return 0.6 + (score / 100) * 0.4;
}

const DAYS_JP = ["日", "月", "火", "水", "木", "金", "土"];
const MONTHS_JP = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export default function HealthCalendar({ data, title = "体調カレンダー" }: Props) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs">
        データなし
      </div>
    );
  }

  // Build map
  const scoreMap = new Map(data.map((d) => [d.day, d.score]));

  // Determine range: latest day back 365 days
  const sortedDays = data.map((d) => d.day).sort();
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];
  const endDate = new Date(lastDay + "T00:00:00");
  const startDate = new Date(firstDay + "T00:00:00");

  // Generate all weeks
  // Start from the Sunday of the start week
  const current = new Date(startDate);
  current.setDate(current.getDate() - current.getDay());

  const weeks: { day: string; date: Date; score: number | null }[][] = [];
  let currentWeek: { day: string; date: Date; score: number | null }[] = [];

  while (current <= endDate || currentWeek.length > 0) {
    const dayStr = current.toISOString().slice(0, 10);
    const isInRange = current >= startDate && current <= endDate;

    currentWeek.push({
      day: dayStr,
      date: new Date(current),
      score: isInRange ? (scoreMap.get(dayStr) ?? null) : null,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    current.setDate(current.getDate() + 1);

    if (current > endDate && currentWeek.length === 0) break;
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Month labels
  const monthLabels: { week: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDayInRange = week.find(
      (d) => d.date >= startDate && d.date <= endDate
    );
    if (firstDayInRange) {
      const month = firstDayInRange.date.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ week: wi, label: MONTHS_JP[month] });
        lastMonth = month;
      }
    }
  });

  // Stats
  const scores = data.filter((d) => d.score != null).map((d) => d.score!);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const daysTracked = scores.length;

  const cellSize = 11;
  const cellGap = 2;
  const totalCellSize = cellSize + cellGap;
  const labelWidth = 24;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-500">{title}</h3>
        <div className="flex gap-4 text-[10px] text-slate-400">
          <span>{daysTracked}日分</span>
          <span>平均 <strong className="text-slate-600">{avgScore}</strong></span>
          <span>最高 <strong className="text-slate-600">{maxScore}</strong></span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={labelWidth + weeks.length * totalCellSize + 4}
          height={totalCellSize * 7 + 20}
          className="block"
        >
          {/* Month labels */}
          {monthLabels.map((m) => (
            <text
              key={m.week + m.label}
              x={labelWidth + m.week * totalCellSize}
              y={10}
              fontSize={9}
              fill="#94a3b8"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {[1, 3, 5].map((dow) => (
            <text
              key={dow}
              x={0}
              y={18 + dow * totalCellSize + cellSize / 2 + 3}
              fontSize={9}
              fill="#94a3b8"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {DAYS_JP[dow]}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((week, wi) =>
            week.map((d, di) => {
              const inRange =
                d.date >= startDate && d.date <= endDate;
              if (!inRange) return null;

              return (
                <rect
                  key={d.day}
                  x={labelWidth + wi * totalCellSize}
                  y={18 + di * totalCellSize}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  fill={scoreColor(d.score)}
                  opacity={scoreOpacity(d.score)}
                >
                  <title>{`${d.day}: ${d.score != null ? d.score : "データなし"}`}</title>
                </rect>
              );
            })
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
        <span>少</span>
        {[null, 35, 50, 65, 75, 85].map((s, i) => (
          <div
            key={i}
            className="w-[10px] h-[10px] rounded-sm"
            style={{
              backgroundColor: scoreColor(s),
              opacity: scoreOpacity(s),
            }}
          />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}
