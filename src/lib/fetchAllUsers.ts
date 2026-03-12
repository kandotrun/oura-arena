import type { UserHealth } from "./types";
import {
  parseUsersEnv,
  fetchDailySleep,
  fetchDailyReadiness,
  fetchDailyActivity,
  fetchHeartRate,
  fetchPersonalInfo,
  fetchDailySpO2,
  fetchDailyStress,
  fetchDailyResilience,
  fetchDailyCardiovascularAge,
  fetchVO2Max,
} from "./oura";
import { computeCondition } from "./condition";
import {
  parseExternalUsersEnv,
  getLatestHealthData,
} from "./externalData";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBeforeDate(base: string, n: number): string {
  const d = new Date(base + "T00:00:00Z");
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

async function fetchOuraUser(name: string, token: string): Promise<UserHealth> {
  const today = formatDate(new Date());
  try {
    let sleepRecent = await fetchDailySleep(token, daysAgo(7), today);
    if (sleepRecent.length === 0) {
      const probe = await fetchDailySleep(token, daysAgo(365), today);
      if (probe.length > 0) {
        const latestDay = probe[probe.length - 1].day;
        sleepRecent = await fetchDailySleep(token, daysBeforeDate(latestDay, 7), latestDay);
      }
    }

    // Use today as fallback for API calls, but track whether real data exists
    const apiDay = sleepRecent.length > 0 ? sleepRecent[sleepRecent.length - 1].day : today;
    const weekBefore = daysBeforeDate(apiDay, 7);

    const [
      readinessTrend,
      activityTrend,
      heartRate,
      personalInfo,
      spo2Data,
      stressData,
      resilienceData,
      cvAgeData,
      vo2Data,
    ] = await Promise.all([
      fetchDailyReadiness(token, weekBefore, apiDay).catch(() => []),
      fetchDailyActivity(token, weekBefore, apiDay).catch(() => []),
      fetchHeartRate(token, apiDay).catch(() => []),
      fetchPersonalInfo(token),
      fetchDailySpO2(token, daysBeforeDate(apiDay, 1), apiDay).catch(() => []),
      fetchDailyStress(token, daysBeforeDate(apiDay, 1), apiDay).catch(() => []),
      fetchDailyResilience(token, daysBeforeDate(apiDay, 1), apiDay).catch(() => []),
      fetchDailyCardiovascularAge(token, daysBeforeDate(apiDay, 1), apiDay).catch(() => []),
      fetchVO2Max(token, daysBeforeDate(apiDay, 1), apiDay).catch(() => []),
    ]);

    const sleep = sleepRecent.at(-1) ?? null;
    const readiness = readinessTrend.at(-1) ?? null;
    const activity = activityTrend.at(-1) ?? null;
    const condition = computeCondition(sleep, readiness);

    // Only report latestDay if we actually have data
    const hasAnyData = sleep || readiness || activity;
    const latestDay = hasAnyData ? apiDay : null;

    return {
      name,
      personalInfo,
      sleep,
      readiness,
      activity,
      heartRate,
      spo2: spo2Data.at(-1) ?? null,
      stress: stressData.at(-1) ?? null,
      resilience: resilienceData.at(-1) ?? null,
      cardiovascularAge: cvAgeData.at(-1) ?? null,
      vo2Max: vo2Data.at(-1) ?? null,
      sleepTrend: sleepRecent,
      readinessTrend,
      condition,
      latestDay,
    };
  } catch (err) {
    return {
      name,
      personalInfo: null,
      sleep: null,
      readiness: null,
      activity: null,
      heartRate: [],
      spo2: null,
      stress: null,
      resilience: null,
      cardiovascularAge: null,
      vo2Max: null,
      sleepTrend: [],
      readinessTrend: [],
      condition: "fair",
      latestDay: null,
      error: err instanceof Error ? err.message : "Oura APIからデータ取得に失敗",
    };
  }
}

async function fetchExternalUser(name: string): Promise<UserHealth> {
  try {
    const data = await getLatestHealthData(name);
    if (!data) {
      return {
        name,
        personalInfo: null,
        sleep: null,
        readiness: null,
        activity: null,
        heartRate: [],
        spo2: null,
        stress: null,
        resilience: null,
        cardiovascularAge: null,
        vo2Max: null,
        sleepTrend: [],
        readinessTrend: [],
        condition: "fair",
        latestDay: null,
        error: "データ未送信",
      };
    }

    const sleep = data.sleep
      ? {
          id: `ext-${data.name}-${data.day}`,
          day: data.day,
          timestamp: data.timestamp,
          score: data.sleep.score ?? 0,
          contributors: {
            deep_sleep: null,
            efficiency: null,
            latency: null,
            rem_sleep: null,
            restfulness: null,
            timing: null,
            total_sleep: null,
          },
        }
      : null;

    const activity = data.activity
      ? {
          id: `ext-${data.name}-${data.day}-act`,
          day: data.day,
          timestamp: data.timestamp,
          score: data.activity.score ?? 0,
          steps: data.activity.steps,
          active_calories: data.activity.active_calories,
          total_calories: data.activity.total_calories,
          equivalent_walking_distance: 0,
          high_activity_met_minutes: 0,
          medium_activity_met_minutes: 0,
          low_activity_met_minutes: 0,
          sedentary_met_minutes: 0,
          contributors: {
            meet_daily_targets: null,
            move_every_hour: null,
            recovery_time: null,
            stay_active: null,
            training_frequency: null,
            training_volume: null,
          },
        }
      : null;

    const condition = computeCondition(sleep, null);

    return {
      name,
      personalInfo: null,
      sleep,
      readiness: null,
      activity,
      heartRate: [],
      spo2: data.spo2 ? { id: `ext-spo2-${data.day}`, day: data.day, spo2_percentage: { average: data.spo2 }, breathing_disturbance_index: 0 } : null,
      stress: null,
      resilience: null,
      cardiovascularAge: null,
      vo2Max: null,
      sleepTrend: sleep ? [sleep] : [],
      readinessTrend: [],
      condition,
      latestDay: data.day,
    };
  } catch {
    return {
      name,
      personalInfo: null,
      sleep: null,
      readiness: null,
      activity: null,
      heartRate: [],
      spo2: null,
      stress: null,
      resilience: null,
      cardiovascularAge: null,
      vo2Max: null,
      sleepTrend: [],
      readinessTrend: [],
      condition: "fair",
      latestDay: null,
      error: "外部データの取得に失敗",
    };
  }
}

export async function fetchAllUsers(): Promise<UserHealth[]> {
  const ouraUsers = parseUsersEnv(process.env.OURA_USERS);
  const externalUsers = parseExternalUsersEnv(process.env.EXTERNAL_USERS);

  if (ouraUsers.length === 0 && externalUsers.length === 0) {
    return [
      {
        name: "demo",
        personalInfo: null,
        sleep: null,
        readiness: null,
        activity: null,
        heartRate: [],
        spo2: null,
        stress: null,
        resilience: null,
        cardiovascularAge: null,
        vo2Max: null,
        sleepTrend: [],
        readinessTrend: [],
        condition: "fair",
        latestDay: null,
        error: "ユーザー未設定。OURA_USERS または EXTERNAL_USERS を設定してください。",
      },
    ];
  }

  const [ouraResults, externalResults] = await Promise.all([
    Promise.all(ouraUsers.map((u) => fetchOuraUser(u.name, u.token))),
    Promise.all(externalUsers.map((u) => fetchExternalUser(u.name))),
  ]);

  return [...ouraResults, ...externalResults];
}
