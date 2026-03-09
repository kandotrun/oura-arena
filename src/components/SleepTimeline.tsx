"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface SleepPeriod {
  day: string;
  bedtimeHour: number; // e.g. 23.5 = 23:30
  wakeHour: number; // e.g. 7.25 = 7:15
  duration: number; // hours
  score: number | null;
}

interface Props {
  data: SleepPeriod[];
}

function hourToTime(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function scoreColor(score: number | null): string {
  if (score == null) return "#cbd5e1";
  if (score >= 85) return "#22c55e";
  if (score >= 70) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

export default function SleepTimeline({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        データなし
      </div>
    );
  }

  // Transform: show bedtime as start, duration as bar length
  // Y axis: time of day (18:00 to 14:00 next day, inverted)
  const chartData = data.map((d) => {
    // Normalize bedtime: if after midnight, add 24
    let bedNorm = d.bedtimeHour;
    if (bedNorm < 18) bedNorm += 24; // e.g. 1am -> 25

    return {
      label: d.day.slice(5),
      start: bedNorm,
      duration: d.duration,
      score: d.score,
      bedtime: hourToTime(d.bedtimeHour),
      wake: hourToTime(d.wakeHour),
      durationLabel: `${Math.floor(d.duration)}h${Math.round((d.duration % 1) * 60)}m`,
    };
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
        >
          <XAxis
            type="number"
            domain={[20, 34]}
            tickCount={8}
            tickFormatter={(v: number) => {
              const h = v >= 24 ? v - 24 : v;
              return `${Math.floor(h)}:00`;
            }}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={40}
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
            formatter={(_: any, __: any, entry: any) => {
              const d = entry?.payload;
              if (!d) return ["", ""];
              return [`${d.bedtime} → ${d.wake} (${d.durationLabel})`, "睡眠"];
            }}
          />
          <ReferenceLine x={24} stroke="#e2e8f0" strokeDasharray="3 3" label={{ value: "0:00", fontSize: 9, fill: "#94a3b8" }} />
          <Bar dataKey="duration" stackId="a" radius={[4, 4, 4, 4]} barSize={16}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={scoreColor(entry.score)}
                fillOpacity={0.7}
              />
            ))}
          </Bar>
          {/* Invisible bar to offset start position */}
          <Bar dataKey="start" stackId="a" fill="transparent" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
