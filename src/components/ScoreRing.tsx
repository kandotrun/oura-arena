"use client";

interface ScoreRingProps {
  score: number | null;
  size?: number;
  strokeWidth?: number;
  label: string;
  accent?: string;
}

function defaultColor(score: number): string {
  if (score >= 85) return "#f59e0b";
  if (score >= 70) return "#10b981";
  if (score >= 50) return "#8b5cf6";
  return "#fb7185";
}

export default function ScoreRing({
  score,
  size = 88,
  strokeWidth = 5,
  label,
  accent,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score != null ? (score / 100) * circumference : 0;
  const color = accent ?? (score != null ? defaultColor(score) : "#d4d4d8");

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.04)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-semibold tabular-nums">
            {score ?? "—"}
          </span>
        </div>
      </div>
      <span className="text-[11px] text-neutral-400 font-medium tracking-wide">
        {label}
      </span>
    </div>
  );
}
