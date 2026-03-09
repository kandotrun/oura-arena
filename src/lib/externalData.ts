import { put, list } from "@vercel/blob";

// 外部デバイス（Xiaomi等）から送信されるヘルスデータの型
export interface ExternalHealthData {
  name: string;
  device: string; // "xiaomi", "fitbit", etc.
  timestamp: string; // ISO
  day: string; // YYYY-MM-DD
  sleep?: {
    score: number | null;
    bedtime_start: string;
    bedtime_end: string;
    total_duration_seconds: number;
    deep_seconds: number;
    rem_seconds: number;
    light_seconds: number;
    awake_seconds: number;
    efficiency: number;
    average_heart_rate: number | null;
    lowest_heart_rate: number | null;
    average_hrv: number | null;
    average_breath: number | null;
  };
  activity?: {
    steps: number;
    active_calories: number;
    total_calories: number;
    score: number | null;
  };
  heart_rate?: {
    resting: number | null;
    average: number | null;
  };
  spo2?: number | null;
}

export interface ExternalUserConfig {
  name: string;
  apiKey: string;
}

export function parseExternalUsersEnv(
  raw?: string
): ExternalUserConfig[] {
  if (!raw) return [];
  return raw.split(",").map((pair) => {
    const [name, apiKey] = pair.split(":");
    return { name: name.trim(), apiKey: apiKey.trim() };
  });
}

const BLOB_PREFIX = "health-data";

// 最新データを保存
export async function saveHealthData(
  data: ExternalHealthData
): Promise<void> {
  const key = `${BLOB_PREFIX}/${data.name.toLowerCase()}/latest.json`;
  await put(key, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
  });

  // 日次データも保存（履歴用）
  const dayKey = `${BLOB_PREFIX}/${data.name.toLowerCase()}/days/${data.day}.json`;
  await put(dayKey, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
  });
}

// 最新データを取得
export async function getLatestHealthData(
  name: string
): Promise<ExternalHealthData | null> {
  const key = `${BLOB_PREFIX}/${name.toLowerCase()}/latest.json`;
  try {
    const res = await fetch(
      `${process.env.BLOB_STORE_URL ?? ""}/${key}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// 履歴データ取得
export async function getHealthHistory(
  name: string,
  limit = 90
): Promise<ExternalHealthData[]> {
  const prefix = `${BLOB_PREFIX}/${name.toLowerCase()}/days/`;
  try {
    const { blobs } = await list({ prefix, limit });
    const results: ExternalHealthData[] = [];
    for (const blob of blobs.slice(-limit)) {
      try {
        const res = await fetch(blob.url);
        if (res.ok) {
          results.push(await res.json());
        }
      } catch {
        // skip
      }
    }
    return results.sort((a, b) => a.day.localeCompare(b.day));
  } catch {
    return [];
  }
}
