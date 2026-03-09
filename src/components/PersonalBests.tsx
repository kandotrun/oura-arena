import type { DailySleep, DailyActivity } from "@/lib/types";
import type { SleepDetail } from "@/lib/fetchUserDetail";

interface Props {
  sleepHistory: DailySleep[];
  activityHistory: DailyActivity[];
  sleepDetails: SleepDetail[];
}

interface Record {
  label: string;
  value: string;
  date: string;
  icon: string;
}

export default function PersonalBests({
  sleepHistory,
  activityHistory,
  sleepDetails,
}: Props) {
  const records: Record[] = [];

  // Best sleep score
  const bestSleep = sleepHistory
    .filter((s) => s.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  if (bestSleep?.score) {
    records.push({
      label: "最高睡眠スコア",
      value: `${bestSleep.score}`,
      date: bestSleep.day,
      icon: "😴",
    });
  }

  // Most steps
  const bestSteps = [...activityHistory].sort((a, b) => b.steps - a.steps)[0];
  if (bestSteps?.steps) {
    records.push({
      label: "最多歩数",
      value: bestSteps.steps.toLocaleString(),
      date: bestSteps.day,
      icon: "🚶",
    });
  }

  // Most calories
  const bestCal = [...activityHistory].sort(
    (a, b) => b.active_calories - a.active_calories
  )[0];
  if (bestCal?.active_calories) {
    records.push({
      label: "最高消費カロリー",
      value: `${bestCal.active_calories} kcal`,
      date: bestCal.day,
      icon: "🔥",
    });
  }

  // Longest sleep
  const longestSleep = [...sleepDetails].sort(
    (a, b) => b.total_sleep_duration - a.total_sleep_duration
  )[0];
  if (longestSleep) {
    const h = Math.floor(longestSleep.total_sleep_duration / 3600);
    const m = Math.floor((longestSleep.total_sleep_duration % 3600) / 60);
    records.push({
      label: "最長睡眠",
      value: `${h}h${m}m`,
      date: longestSleep.day,
      icon: "🛏️",
    });
  }

  // Lowest resting HR
  const bestHR = sleepDetails
    .filter((s) => s.lowest_heart_rate != null)
    .sort((a, b) => (a.lowest_heart_rate ?? 999) - (b.lowest_heart_rate ?? 999))[0];
  if (bestHR?.lowest_heart_rate) {
    records.push({
      label: "最低安静心拍",
      value: `${bestHR.lowest_heart_rate} bpm`,
      date: bestHR.day,
      icon: "❤️",
    });
  }

  // Best HRV
  const bestHRV = sleepDetails
    .filter((s) => s.average_hrv != null)
    .sort((a, b) => (b.average_hrv ?? 0) - (a.average_hrv ?? 0))[0];
  if (bestHRV?.average_hrv) {
    records.push({
      label: "最高HRV",
      value: `${bestHRV.average_hrv} ms`,
      date: bestHRV.day,
      icon: "💓",
    });
  }

  // Consecutive good sleep days (score >= 75)
  let maxStreak = 0;
  let currentStreak = 0;
  sleepHistory.forEach((s) => {
    if (s.score != null && s.score >= 75) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });
  if (maxStreak > 1) {
    records.push({
      label: "連続Good Sleep",
      value: `${maxStreak}日`,
      date: "",
      icon: "🏆",
    });
  }

  if (records.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {records.map((r) => (
        <div
          key={r.label}
          className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80"
        >
          <span className="text-xl mt-0.5">{r.icon}</span>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">{r.label}</p>
            <p className="text-sm font-bold text-slate-700 tabular-nums">
              {r.value}
            </p>
            {r.date && (
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {r.date}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
