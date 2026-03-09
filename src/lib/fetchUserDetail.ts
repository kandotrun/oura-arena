import type {
  UserHealth,
  DailySleep,
  DailyReadiness,
  DailyActivity,
  HeartRateEntry,
} from "./types";
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

export interface SleepDetail {
  bedtime_start: string;
  bedtime_end: string;
  total_sleep_duration: number;
  rem_sleep_duration: number;
  deep_sleep_duration: number;
  light_sleep_duration: number;
  awake_time: number;
  efficiency: number;
  average_heart_rate: number | null;
  lowest_heart_rate: number | null;
  average_hrv: number | null;
  average_breath: number | null;
  type: string;
  day: string;
}

export interface WorkoutEntry {
  id: string;
  activity: string;
  calories: number | null;
  day: string;
  distance: number | null;
  start_datetime: string;
  end_datetime: string;
  intensity: string;
  source: string;
}

export interface UserDetailData {
  user: UserHealth;
  sleepHistory: DailySleep[];
  readinessHistory: DailyReadiness[];
  activityHistory: DailyActivity[];
  sleepDetails: SleepDetail[];
  sleepDetailsLong: SleepDetail[];
  workouts: WorkoutEntry[];
  heartRateDay: HeartRateEntry[];
}

async function ouraFetchRaw<T>(
  endpoint: string,
  token: string,
  params?: Record<string, string>
): Promise<T[]> {
  const url = new URL(
    `https://api.ouraring.com/v2/usercollection/${endpoint}`
  );
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export async function fetchUserDetail(
  userName: string
): Promise<UserDetailData | null> {
  const users = parseUsersEnv(process.env.OURA_USERS);
  const userConfig = users.find(
    (u) => u.name.toLowerCase() === userName.toLowerCase()
  );
  if (!userConfig) return null;

  const { token } = userConfig;
  const today = formatDate(new Date());

  // Find latest data
  let sleepRecent = await fetchDailySleep(token, daysAgo(7), today);
  if (sleepRecent.length === 0) {
    const probe = await fetchDailySleep(token, daysAgo(365), today);
    if (probe.length > 0) {
      const latestDay = probe[probe.length - 1].day;
      sleepRecent = await fetchDailySleep(
        token,
        daysBeforeDate(latestDay, 7),
        latestDay
      );
    }
  }

  const latestDay =
    sleepRecent.length > 0
      ? sleepRecent[sleepRecent.length - 1].day
      : today;

  const historyStart = daysBeforeDate(latestDay, 90);

  const [
    sleepHistory,
    readinessHistory,
    activityHistory,
    heartRateDay,
    personalInfo,
    sleepDetails,
    workouts,
    spo2Data,
    stressData,
    resilienceData,
    cvAgeData,
    vo2Data,
  ] = await Promise.all([
    fetchDailySleep(token, historyStart, latestDay),
    fetchDailyReadiness(token, historyStart, latestDay),
    fetchDailyActivity(token, historyStart, latestDay),
    fetchHeartRate(token, latestDay),
    fetchPersonalInfo(token),
    ouraFetchRaw<SleepDetail>("sleep", token, {
      start_date: daysBeforeDate(latestDay, 7),
      end_date: latestDay,
    }),
    ouraFetchRaw<WorkoutEntry>("workout", token, {
      start_date: historyStart,
      end_date: latestDay,
    }),
    fetchDailySpO2(token, daysBeforeDate(latestDay, 1), latestDay).catch(
      () => []
    ),
    fetchDailyStress(token, daysBeforeDate(latestDay, 1), latestDay).catch(
      () => []
    ),
    fetchDailyResilience(
      token,
      daysBeforeDate(latestDay, 1),
      latestDay
    ).catch(() => []),
    fetchDailyCardiovascularAge(
      token,
      daysBeforeDate(latestDay, 1),
      latestDay
    ).catch(() => []),
    fetchVO2Max(token, daysBeforeDate(latestDay, 1), latestDay).catch(
      () => []
    ),
  ]);

  const sleep = sleepHistory.at(-1) ?? null;
  const readiness = readinessHistory.at(-1) ?? null;
  const activity = activityHistory.at(-1) ?? null;
  const condition = computeCondition(sleep, readiness);

  return {
    user: {
      name: userConfig.name,
      personalInfo,
      sleep,
      readiness,
      activity,
      heartRate: heartRateDay,
      spo2: spo2Data.at(-1) ?? null,
      stress: stressData.at(-1) ?? null,
      resilience: resilienceData.at(-1) ?? null,
      cardiovascularAge: cvAgeData.at(-1) ?? null,
      vo2Max: vo2Data.at(-1) ?? null,
      sleepTrend: sleepRecent,
      readinessTrend: [],
      condition,
      latestDay,
    },
    sleepHistory,
    readinessHistory,
    activityHistory,
    sleepDetails: sleepDetails.filter((s) => s.type === "long_sleep" || s.type === "sleep"),
    sleepDetailsLong: await ouraFetchRaw<SleepDetail>("sleep", token, {
      start_date: historyStart,
      end_date: latestDay,
    }).then((d) => d.filter((s) => s.type === "long_sleep" || s.type === "sleep")),
    workouts,
    heartRateDay,
  };
}

export async function getAvailableUsers(): Promise<string[]> {
  return parseUsersEnv(process.env.OURA_USERS).map((u) => u.name);
}
