import { NextRequest, NextResponse } from "next/server";
import { fetchUserDetail } from "@/lib/fetchUserDetail";
import { computeTitles } from "@/lib/titles";

export const revalidate = 300;

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
      data.activityHistory as any,
      data.sleepDetailsLong as any
    );

    // 最大8個表示（バッジ用に絞る）
    const shown = titles.slice(0, 8);
    const extra = titles.length - shown.length;

    const titleText = shown.map((t) => `${t.emoji}${t.name}`).join(" ") + (extra > 0 ? ` +${extra}` : "");
    const textWidth = titleText.length * 11 + 30;
    const labelWidth = 50;
    const totalWidth = labelWidth + textWidth;
    const height = 28;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <linearGradient id="a" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="${height}" rx="4" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="#555"/>
    <rect x="${labelWidth}" width="${textWidth}" height="${height}" fill="#8b5cf6"/>
  </g>
  <rect width="${totalWidth}" height="${height}" fill="url(#a)"/>
  <g fill="#fff" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="13">
    <text x="${labelWidth / 2}" y="${height / 2 + 5}" fill="#010101" fill-opacity=".3">称号</text>
    <text x="${labelWidth / 2}" y="${height / 2 + 4}">称号</text>
    <text x="${labelWidth + textWidth / 2}" y="${height / 2 + 5}" fill="#010101" fill-opacity=".3">${escapeXml(titleText)}</text>
    <text x="${labelWidth + textWidth / 2}" y="${height / 2 + 4}">${escapeXml(titleText)}</text>
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
