"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TrendPoint {
  day: string;
  sleep: number | null;
  readiness: number | null;
}

interface TrendChartProps {
  data: TrendPoint[];
  label: string;
  color: string;
}

export default function TrendChart({ data, label, color }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-28 flex items-center justify-center text-neutral-400 text-xs">
        データなし
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: d.day.slice(5),
  }));

  return (
    <div>
      {label && (
        <h4 className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono mb-2">
          {label}
        </h4>
      )}
      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formatted}
            margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid rgba(0,0,0,0.06)",
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(8px)",
                fontSize: "11px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            />
            <Line
              type="monotone"
              dataKey="sleep"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 2.5, fill: color }}
              name="睡眠"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="readiness"
              stroke={`${color}88`}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={{ r: 2, fill: `${color}88` }}
              name="回復"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
