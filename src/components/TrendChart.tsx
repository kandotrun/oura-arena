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
      <div className="h-32 flex items-center justify-center text-neutral-600 text-sm">
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
      <h4 className="text-xs text-neutral-600 uppercase tracking-wider font-medium mb-2">
        {label}
      </h4>
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formatted}
            margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#525252" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#525252" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #262626",
                background: "#141414",
                fontSize: "12px",
                color: "#e5e5e5",
              }}
            />
            <Line
              type="monotone"
              dataKey="sleep"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color }}
              name="睡眠"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="readiness"
              stroke={`${color}99`}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 2, fill: `${color}99` }}
              name="回復"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
