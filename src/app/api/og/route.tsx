export const dynamic = "force-dynamic";

import { ImageResponse } from "next/og";
import { fetchAllUsers } from "@/lib/fetchAllUsers";
import { computePowerLevel, getRank } from "@/lib/condition";

function rankColor(score: number): string {
  if (score >= 85) return "#6366f1"; // S - indigo
  if (score >= 70) return "#3b82f6"; // A - blue
  if (score >= 50) return "#22c55e"; // B - green
  return "#94a3b8"; // C - slate
}

export async function GET() {
  const users = await fetchAllUsers();

  const sorted = users
    .map((u) => ({
      name: u.name,
      power: computePowerLevel(u.sleep, u.readiness, u.activity),
      sleep: u.sleep?.score ?? 0,
      readiness: u.readiness?.score ?? 0,
      activity: u.activity?.score ?? 0,
      rank: getRank(computePowerLevel(u.sleep, u.readiness, u.activity)),
    }))
    .sort((a, b) => b.power - a.power);

  const winner = sorted.length > 0 ? sorted[0] : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #f0f4f8 0%, #e2e8f0 100%)",
          fontFamily: "system-ui, sans-serif",
          color: "#1e293b",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <span style={{ fontSize: "36px" }}>⚔️</span>
          <span
            style={{
              fontSize: "42px",
              fontWeight: 800,
              color: "#1e293b",
            }}
          >
            Oura Arena
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "16px",
            color: "#64748b",
            marginBottom: "32px",
          }}
        >
          チームウェルネスバトルダッシュボード
        </div>

        {/* User cards */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "flex-end",
          }}
        >
          {sorted.map((u) => {
            const isWinner =
              winner && sorted.length > 1 && u.name === winner.name && winner.power > 0;
            return (
              <div
                key={u.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "#ffffff",
                  borderRadius: "20px",
                  padding: isWinner ? "28px 44px 24px" : "24px 40px 20px",
                  border: isWinner
                    ? "2px solid #6366f1"
                    : "1px solid rgba(0,0,0,0.06)",
                  boxShadow: isWinner
                    ? "0 4px 24px rgba(99,102,241,0.15)"
                    : "0 1px 3px rgba(0,0,0,0.04)",
                  position: "relative",
                }}
              >
                {/* Winner badge */}
                {isWinner && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-14px",
                      fontSize: "24px",
                    }}
                  >
                    👑
                  </div>
                )}

                {/* Name */}
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    textTransform: "capitalize",
                    marginBottom: "8px",
                    color: "#334155",
                  }}
                >
                  {u.name}
                </span>

                {/* Rank badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#fff",
                      background: rankColor(u.power),
                      borderRadius: "6px",
                      padding: "2px 8px",
                    }}
                  >
                    {u.rank}
                  </span>
                </div>

                {/* Power */}
                <span
                  style={{
                    fontSize: "56px",
                    fontWeight: 800,
                    color: rankColor(u.power),
                    lineHeight: 1,
                  }}
                >
                  {u.power}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#94a3b8",
                    marginTop: "4px",
                    marginBottom: "12px",
                  }}
                >
                  戦闘力
                </span>

                {/* Metrics */}
                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
                  <span>😴 {u.sleep}</span>
                  <span>💚 {u.readiness}</span>
                  <span>🔥 {u.activity}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            fontSize: "14px",
            color: "#94a3b8",
          }}
        >
          oura-arena.vercel.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
