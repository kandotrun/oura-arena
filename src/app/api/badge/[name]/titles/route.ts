import { NextRequest, NextResponse } from "next/server";
import { fetchUserDetail } from "@/lib/fetchUserDetail";

export const revalidate = 300;

function computeTitles(
  sleepHistory: { day: string; score: number | null }[],
  activityHistory: { day: string; score: number | null; steps: number; active_calories: number }[],
  sleepDetails: { bedtime_start: string; efficiency: number; deep_sleep_duration: number; average_hrv: number | null }[]
): { emoji: string; name: string }[] {
  const titles: { emoji: string; name: string }[] = [];

  const recentSleep = sleepHistory.slice(-7);
  const avgSleepScore =
    recentSleep.length > 0
      ? recentSleep.reduce((a, b) => a + (b.score ?? 0), 0) / recentSleep.length
      : 0;
  if (avgSleepScore >= 85) titles.push({ emoji: "😴", name: "安眠の達人" });
  else if (avgSleepScore < 50) titles.push({ emoji: "🦉", name: "夜更かしの帝王" });

  const recentDetails = sleepDetails.slice(-7);
  if (recentDetails.length >= 3) {
    const avgBedtime =
      recentDetails.reduce((sum, s) => {
        const h = new Date(s.bedtime_start).getHours();
        return sum + (h < 12 ? h + 24 : h);
      }, 0) / recentDetails.length;
    if (avgBedtime <= 23) titles.push({ emoji: "🌙", name: "早寝の鬼" });
    else if (avgBedtime >= 26) titles.push({ emoji: "🌃", name: "深夜族" });
  }

  const avgEfficiency =
    recentDetails.length > 0
      ? recentDetails.reduce((a, b) => a + b.efficiency, 0) / recentDetails.length
      : 0;
  if (avgEfficiency >= 92) titles.push({ emoji: "💎", name: "睡眠効率マスター" });

  const hrvValues = recentDetails.filter((s) => s.average_hrv != null).map((s) => s.average_hrv!);
  if (hrvValues.length > 0) {
    const avgHrv = hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length;
    if (avgHrv >= 80) titles.push({ emoji: "💓", name: "HRV王" });
  }

  const recentActivity = activityHistory.slice(-7);
  const avgSteps =
    recentActivity.length > 0
      ? recentActivity.reduce((a, b) => a + b.steps, 0) / recentActivity.length
      : 0;
  if (avgSteps >= 10000) titles.push({ emoji: "🚶", name: "歩数マシーン" });
  else if (avgSteps >= 7000) titles.push({ emoji: "👟", name: "ウォーカー" });

  if (titles.length === 0) titles.push({ emoji: "🌱", name: "ルーキー" });
  return titles;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  try {
    const data = await fetchUserDetail(name);
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    const titles = computeTitles(
      data.sleepHistory,
      data.activityHistory,
      data.sleepDetailsLong as any
    );

    const titleText = titles.map((t) => `${t.emoji} ${t.name}`).join("  ");
    const textWidth = titleText.length * 10 + 20;
    const labelWidth = 40;
    const totalWidth = labelWidth + textWidth;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="a" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${textWidth}" height="20" fill="#8b5cf6"/>
  </g>
  <rect width="${totalWidth}" height="20" fill="url(#a)"/>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">称号</text>
    <text x="${labelWidth / 2}" y="14">称号</text>
    <text x="${labelWidth + textWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(titleText)}</text>
    <text x="${labelWidth + textWidth / 2}" y="14">${escapeXml(titleText)}</text>
  </g>
</svg>`;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
