import { NextRequest, NextResponse } from "next/server";
import {
  parseExternalUsersEnv,
  saveHealthData,
  type ExternalHealthData,
} from "@/lib/externalData";

export async function POST(request: NextRequest) {
  // API Key認証
  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  if (!apiKey) {
    return NextResponse.json(
      { error: "認証が必要です" },
      { status: 401 }
    );
  }

  const externalUsers = parseExternalUsersEnv(
    process.env.EXTERNAL_USERS
  );
  const user = externalUsers.find((u) => u.apiKey === apiKey);

  if (!user) {
    return NextResponse.json(
      { error: "無効なAPIキー" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as Partial<ExternalHealthData>;

    // バリデーション
    if (!body.day || !body.timestamp) {
      return NextResponse.json(
        { error: "day と timestamp は必須です" },
        { status: 400 }
      );
    }

    const data: ExternalHealthData = {
      name: user.name,
      device: body.device ?? "unknown",
      timestamp: body.timestamp,
      day: body.day,
      sleep: body.sleep,
      activity: body.activity,
      heart_rate: body.heart_rate,
      spo2: body.spo2,
    };

    await saveHealthData(data);

    return NextResponse.json({
      ok: true,
      message: `${user.name} のデータを保存しました`,
      day: data.day,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "データの処理に失敗しました", detail: String(e) },
      { status: 500 }
    );
  }
}

// ヘルスチェック
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Oura Arena Submit API",
    usage: "POST /api/submit with Bearer token",
  });
}
