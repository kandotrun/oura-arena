import { NextRequest, NextResponse } from "next/server";

function parseUsersEnv(raw?: string): { name: string; token: string }[] {
  if (!raw) return [];
  return raw.split(",").map((pair) => {
    const [name, token] = pair.split(":");
    return { name: name.trim(), token: token.trim() };
  });
}

async function ouraFetch<T>(
  endpoint: string,
  token: string,
  params: Record<string, string>
): Promise<T[]> {
  const url = new URL(
    `https://api.ouraring.com/v2/usercollection/${endpoint}`
  );
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

// shields.io style badge SVG
function renderBadge(label: string, value: string, labelColor: string, valueColor: string): string {
  // Approximate text widths (monospace-ish)
  const labelWidth = label.length * 6.5 + 12;
  const valueWidth = value.length * 7 + 12;
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" viewBox="0 0 ${totalWidth} 20">
  <defs>
    <linearGradient id="smooth" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="${totalWidth}" height="20" rx="3"/>
    </clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="${labelColor}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${valueColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#smooth)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
}

type MetricType = "sleep" | "readiness" | "activity" | "power" | "steps" | "rank";

const metricConfig: Record<MetricType, { label: string; color: string }> = {
  sleep:     { label: "睡眠",   color: "#6366f1" },
  readiness: { label: "回復",   color: "#22c55e" },
  activity:  { label: "活動",   color: "#f59e0b" },
  power:     { label: "戦闘力", color: "#3b82f6" },
  steps:     { label: "歩数",   color: "#8b5cf6" },
  rank:      { label: "ランク", color: "#1e293b" },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name: rawName } = await params;
  const userName = rawName.replace(/\.svg$/, "").toLowerCase();
  const users = parseUsersEnv(process.env.OURA_USERS);
  const userConfig = users.find((u) => u.name.toLowerCase() === userName);

  if (!userConfig) {
    return new NextResponse(renderBadge("oura", "not found", "#555", "#999"), {
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  const { searchParams } = request.nextUrl;
  const metric = (searchParams.get("metric") ?? "sleep") as MetricType;
  const config = metricConfig[metric] ?? metricConfig.sleep;

  const { token } = userConfig;
  const today = formatDate(new Date());

  // Fetch data
  interface DailySleep { day: string; score: number | null }
  interface DailyReadiness { day: string; score: number | null }
  interface DailyActivity { day: string; score: number | null; steps: number; active_calories: number }

  let sleepData = await ouraFetch<DailySleep>("daily_sleep", token, {
    start_date: daysAgo(7),
    end_date: today,
  });
  if (sleepData.length === 0) {
    const probe = await ouraFetch<DailySleep>("daily_sleep", token, {
      start_date: daysAgo(365),
      end_date: today,
    });
    if (probe.length > 0) {
      const latestDay = probe[probe.length - 1].day;
      sleepData = probe.filter((s) => s.day >= (() => { const d = new Date(latestDay); d.setDate(d.getDate() - 7); return formatDate(d); })());
    }
  }

  const latestDay = sleepData.at(-1)?.day ?? today;
  const readinessData = await ouraFetch<DailyReadiness>("daily_readiness", token, {
    start_date: (() => { const d = new Date(latestDay); d.setDate(d.getDate() - 7); return formatDate(d); })(),
    end_date: latestDay,
  });
  const activityData = await ouraFetch<DailyActivity>("daily_activity", token, {
    start_date: (() => { const d = new Date(latestDay); d.setDate(d.getDate() - 7); return formatDate(d); })(),
    end_date: latestDay,
  });

  const sleepScore = sleepData.at(-1)?.score ?? 0;
  const readinessScore = readinessData.at(-1)?.score ?? 0;
  const activityScore = activityData.at(-1)?.score ?? 0;
  const steps = activityData.at(-1)?.steps ?? 0;
  const power = Math.round(sleepScore * 0.4 + readinessScore * 0.35 + activityScore * 0.25);

  const avg = Math.round((sleepScore + readinessScore) / 2);
  const rankLabel = avg >= 85 ? "S" : avg >= 70 ? "A" : avg >= 50 ? "B" : "C";

  let value = "—";
  let valueColor = "#555";

  switch (metric) {
    case "sleep":
      value = `${sleepScore}`;
      valueColor = sleepScore >= 85 ? "#22c55e" : sleepScore >= 70 ? "#3b82f6" : sleepScore >= 50 ? "#f59e0b" : "#ef4444";
      break;
    case "readiness":
      value = `${readinessScore}`;
      valueColor = readinessScore >= 85 ? "#22c55e" : readinessScore >= 70 ? "#3b82f6" : readinessScore >= 50 ? "#f59e0b" : "#ef4444";
      break;
    case "activity":
      value = `${activityScore}`;
      valueColor = activityScore >= 85 ? "#22c55e" : activityScore >= 70 ? "#3b82f6" : activityScore >= 50 ? "#f59e0b" : "#ef4444";
      break;
    case "power":
      value = `${power}`;
      valueColor = power >= 85 ? "#22c55e" : power >= 70 ? "#3b82f6" : power >= 50 ? "#f59e0b" : "#ef4444";
      break;
    case "steps":
      value = steps.toLocaleString();
      valueColor = "#555";
      break;
    case "rank":
      value = `${rankLabel} ${avg}`;
      valueColor = avg >= 85 ? "#22c55e" : avg >= 70 ? "#3b82f6" : avg >= 50 ? "#f59e0b" : "#ef4444";
      break;
  }

  const svg = renderBadge(config.label, value, config.color, valueColor);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
