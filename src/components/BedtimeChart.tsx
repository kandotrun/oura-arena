"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface Props {
  data: {
    day: string;
    bedtimeHour: number;
    wakeHour: number;
  }[];
}

function hourToTime(h: number): string {
  const hours = Math.floor(h < 0 ? h + 24 : h);
  const mins = Math.round(((h < 0 ? h + 24 : h) - Math.floor(h < 0 ? h + 24 : h)) * 60);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export default function BedtimeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
        データなし
      </div>
    );
  }

  // Normalize bedtime: hours after 18:00 as offset
  // e.g. 23:00 = 5, 01:00 = 7, 06:00 = 12
  const chartData = data.map((d) => {
    let bedNorm = d.bedtimeHour;
    if (bedNorm < 18) bedNorm += 24;

    let wakeNorm = d.wakeHour;
    if (wakeNorm < 18) wakeNorm += 24;

    return {
      label: d.day.slice(5),
      就寝: bedNorm,
      起床: wakeNorm,
    };
  });

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 4, right: 4, bottom: 0, left: -8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[20, 36]}
            tickCount={9}
            tickFormatter={(v: number) => {
              const h = v >= 24 ? v - 24 : v;
              return `${Math.floor(h)}:00`;
            }}
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
            formatter={(value: number) => {
              const h = value >= 24 ? value - 24 : value;
              return [hourToTime(h)];
            }}
          />
          <ReferenceLine y={24} stroke="#e2e8f0" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="就寝"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ r: 3, fill: "#6366f1" }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="起床"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3, fill: "#f59e0b" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
