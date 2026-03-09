"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ZAxis,
} from "recharts";

interface Workout {
  id: string;
  activity: string;
  day: string;
  start_datetime: string;
  end_datetime: string;
  distance: number | null;
  intensity: string;
}

interface Props {
  workouts: Workout[];
}

const activityLabels: Record<string, string> = {
  walking: "ウォーキング",
  running: "ランニング",
  cycling: "サイクリング",
  soccer: "サッカー",
  other: "その他",
};

export default function ActivityTimeline({ workouts }: Props) {
  if (workouts.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
        アクティビティデータなし
      </div>
    );
  }

  // Group by day, show time of day on Y axis
  const data = workouts.map((w) => {
    const start = new Date(w.start_datetime);
    const end = new Date(w.end_datetime);
    const durMin = (end.getTime() - start.getTime()) / 60000;
    const hourOfDay = start.getHours() + start.getMinutes() / 60;

    return {
      day: w.day,
      label: w.day.slice(5),
      hour: hourOfDay,
      duration: durMin,
      activity: activityLabels[w.activity] ?? w.activity,
      distance: w.distance ? (w.distance / 1000).toFixed(1) : null,
      timeStr: start.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Tokyo",
      }),
    };
  });

  // Get unique days as x axis ticks
  const uniqueDays = [...new Set(data.map((d) => d.label))].sort();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            type="category"
            dataKey="label"
            allowDuplicatedCategory={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="hour"
            domain={[5, 24]}
            tickCount={8}
            tickFormatter={(v: number) => `${Math.floor(v)}:00`}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            reversed
          />
          <ZAxis
            type="number"
            dataKey="duration"
            range={[40, 300]}
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
              const parts = [
                `${d.activity} ${d.timeStr}`,
                `${Math.round(d.duration)}分`,
              ];
              if (d.distance) parts.push(`${d.distance}km`);
              return [parts.join(" · "), ""];
            }}
          />
          <Scatter
            data={data}
            fill="#3b82f6"
            fillOpacity={0.6}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
