"use client";

interface ScoreRingProps {
  score: number | null;
  size?: number;
  strokeWidth?: number;
  label: string;
  color?: string;
}

function scoreColor(score: number): string {
  if (score >= 85) return "#facc15";
  if (score >= 70) return "#34d399";
  if (score >= 50) return "#fbbf24";
  return "#f87171";
}

export default function ScoreRing({
  score,
  size = 100,
  strokeWidth = 6,
  label,
  color,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score != null ? (score / 100) * circumference : 0;
  const ringColor = color ?? (score != null ? scoreColor(score) : "#333");

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1f1f1f"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${ringColor}60)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-white">
            {score ?? "—"}
          </span>
        </div>
      </div>
      <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
