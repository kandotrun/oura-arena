"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

interface Props {
  data: { day: string; score: number | null }[];
  title: string;
  color: string;
}

const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

function scoreColor(score: number): string {
  if (score >= 85) return "#22c55e";
  if (score >= 70) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

export default function DayOfWeekChart({ data, title, color }: Props) {
  // Group by day of week
  const byDay: Record<number, number[]> = {};
  for (let i = 0; i < 7; i++) byDay[i] = [];

  data.forEach((d) => {
    if (d.score == null) return;
    const dow = new Date(d.day + "T00:00:00").getDay();
    byDay[dow].push(d.score);
  });

  const chartData = dayLabels.map((label, i) => {
    const scores = byDay[i];
    const avg = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    return { label, avg, count: scores.length };
  });

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 mb-2">{title}</h3>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "#fff",
                fontSize: "11px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any, _: any, entry: any) => [
                `${v}（${entry?.payload?.count ?? 0}日分）`,
                "平均",
              ]}
            />
            <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={28}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.avg > 0 ? scoreColor(entry.avg) : "#e2e8f0"} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
