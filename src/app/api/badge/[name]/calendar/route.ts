import { NextRequest, NextResponse } from "next/server";
import { fetchUserDetail } from "@/lib/fetchUserDetail";

export const revalidate = 300;

function scoreColor(score: number | null): string {
  if (score == null) return "#ebedf0";
  if (score >= 85) return "#22c55e";
  if (score >= 75) return "#4ade80";
  if (score >= 65) return "#86efac";
  if (score >= 50) return "#fbbf24";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const weeks = parseInt(req.nextUrl.searchParams.get("weeks") ?? "26");
  const metric = req.nextUrl.searchParams.get("metric") ?? "sleep";

  try {
    const data = await fetchUserDetail(name);
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    const raw: { day: string; score: number | null }[] =
      metric === "activity"
        ? data.activityHistory.map((a) => ({ day: a.day, score: a.score }))
        : data.sleepHistory.map((s) => ({ day: s.day, score: s.score }));

    if (raw.length === 0) {
      return NextResponse.json({ error: "no data" }, { status: 404 });
    }

    const scoreMap = new Map(raw.map((d) => [d.day, d.score]));
    const sortedDays = raw.map((d) => d.day).sort();
    const lastDay = sortedDays[sortedDays.length - 1];
    const endDate = new Date(lastDay + "T00:00:00");
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - weeks * 7 + 1);

    const current = new Date(startDate);
    current.setDate(current.getDate() - current.getDay());

    const cellSize = 10;
    const cellGap = 2;
    const totalCell = cellSize + cellGap;
    const labelW = 36;
    const headerH = 18;

    const allWeeks: { day: string; date: Date; score: number | null; dow: number }[][] = [];
    let weekBuf: typeof allWeeks[0] = [];

    while (current <= endDate || weekBuf.length > 0) {
      const dayStr = current.toISOString().slice(0, 10);
      const inRange = current >= startDate && current <= endDate;
      weekBuf.push({
        day: dayStr,
        date: new Date(current),
        score: inRange ? (scoreMap.get(dayStr) ?? null) : null,
        dow: current.getDay(),
      });
      if (weekBuf.length === 7) {
        allWeeks.push(weekBuf);
        weekBuf = [];
      }
      current.setDate(current.getDate() + 1);
      if (current > endDate && weekBuf.length === 0) break;
    }
    if (weekBuf.length > 0) allWeeks.push(weekBuf);

    const svgW = labelW + allWeeks.length * totalCell + 8;
    const svgH = headerH + 7 * totalCell + 4;

    const title = metric === "activity" ? "Activity" : "Sleep";
    const scores = raw.filter((d) => d.score != null).map((d) => d.score!);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    let cells = "";
    for (let wi = 0; wi < allWeeks.length; wi++) {
      for (const d of allWeeks[wi]) {
        const inRange = d.date >= startDate && d.date <= endDate;
        if (!inRange) continue;
        const x = labelW + wi * totalCell;
        const y = headerH + d.dow * totalCell;
        const color = scoreColor(d.score);
        const opacity = d.score == null ? 0.4 : 0.6 + (d.score / 100) * 0.4;
        cells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}" opacity="${opacity}"><title>${d.day}: ${d.score ?? "—"}</title></rect>`;
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}">
  <rect width="${svgW}" height="${svgH}" rx="4" fill="#fff" stroke="#e5e7eb" stroke-width="1"/>
  <text x="4" y="12" font-size="10" font-family="Verdana,sans-serif" fill="#555" font-weight="600">${title} avg:${avg}</text>
  <text x="4" y="${headerH + 1 * totalCell + 8}" font-size="8" font-family="Verdana,sans-serif" fill="#94a3b8">Mo</text>
  <text x="4" y="${headerH + 3 * totalCell + 8}" font-size="8" font-family="Verdana,sans-serif" fill="#94a3b8">We</text>
  <text x="4" y="${headerH + 5 * totalCell + 8}" font-size="8" font-family="Verdana,sans-serif" fill="#94a3b8">Fr</text>
  ${cells}
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
