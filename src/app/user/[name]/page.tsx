import { notFound } from "next/navigation";
import Link from "next/link";
import {
  fetchUserDetail,
  getAvailableUsers,
} from "@/lib/fetchUserDetail";
import { conditionConfig, computePowerLevel } from "@/lib/condition";
import ScoreRing from "@/components/ScoreRing";
import HistoryChart from "@/components/HistoryChart";
import SleepStagesChart from "@/components/SleepStagesChart";
import ContributorsChart from "@/components/ContributorsChart";
import TrendChart from "@/components/TrendChart";
import WorkoutList from "@/components/WorkoutList";

export const revalidate = 300;

export async function generateStaticParams() {
  const users = await getAvailableUsers();
  return users.map((name) => ({ name: name.toLowerCase() }));
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const detail = await fetchUserDetail(name);
  if (!detail) notFound();

  const { user, sleepHistory, readinessHistory, activityHistory, sleepDetails, workouts, heartRateDay } = detail;
  const cfg = conditionConfig[user.condition];
  const power = computePowerLevel(user.sleep, user.readiness, user.activity);

  // Sleep contributors
  const sleepContribs = user.sleep?.contributors
    ? [
        { label: "深い睡眠", value: user.sleep.contributors.deep_sleep },
        { label: "効率", value: user.sleep.contributors.efficiency },
        { label: "入眠", value: user.sleep.contributors.latency },
        { label: "REM", value: user.sleep.contributors.rem_sleep },
        { label: "安定性", value: user.sleep.contributors.restfulness },
        { label: "タイミング", value: user.sleep.contributors.timing },
        { label: "総睡眠", value: user.sleep.contributors.total_sleep },
      ]
    : [];

  // Readiness contributors
  const readinessContribs = user.readiness?.contributors
    ? [
        { label: "活動バランス", value: user.readiness.contributors.activity_balance },
        { label: "体温", value: user.readiness.contributors.body_temperature },
        { label: "HRVバランス", value: user.readiness.contributors.hrv_balance },
        { label: "前日活動", value: user.readiness.contributors.previous_day_activity },
        { label: "前夜睡眠", value: user.readiness.contributors.previous_night },
        { label: "回復指数", value: user.readiness.contributors.recovery_index },
        { label: "安静時心拍", value: user.readiness.contributors.resting_heart_rate },
        { label: "睡眠バランス", value: user.readiness.contributors.sleep_balance },
      ]
    : [];

  // Activity contributors
  const activityContribs = user.activity?.contributors
    ? [
        { label: "目標達成", value: user.activity.contributors.meet_daily_targets },
        { label: "毎時移動", value: user.activity.contributors.move_every_hour },
        { label: "回復時間", value: user.activity.contributors.recovery_time },
        { label: "活動量", value: user.activity.contributors.stay_active },
        { label: "運動頻度", value: user.activity.contributors.training_frequency },
        { label: "運動量", value: user.activity.contributors.training_volume },
      ]
    : [];

  // Sleep stages data
  const sleepStagesData = sleepDetails.map((s) => ({
    day: s.day,
    deep: s.deep_sleep_duration,
    rem: s.rem_sleep_duration,
    light: s.light_sleep_duration,
    awake: s.awake_time,
  }));

  // Latest sleep detail
  const latestSleepDetail = sleepDetails.at(-1);

  // Heart rate for chart
  const hrData = heartRateDay.map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    bpm: h.bpm,
  }));

  return (
    <main className="min-h-screen py-10 px-4 sm:px-6">
      {/* Back link */}
      <div className="max-w-5xl mx-auto mb-6">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-slate-600 transition font-mono"
        >
          ← arena
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-5xl mx-auto mb-8">
        <div className="card rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight capitalize">
              {user.name}
            </h1>
            <p className="text-slate-400 text-xs font-mono mt-1">
              {user.latestDay ?? "—"} · 過去90日のデータ
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className={`text-4xl font-black ${cfg.color}`}>
                {cfg.rank}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">{cfg.label}</p>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold tabular-nums font-mono">
                {power}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">戦闘力</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Score rings row */}
        <div className="card rounded-2xl p-6">
          <div className="flex justify-center gap-8">
            <ScoreRing score={user.sleep?.score ?? null} label="睡眠" size={100} />
            <ScoreRing score={user.readiness?.score ?? null} label="回復" size={100} />
            <ScoreRing score={user.activity?.score ?? null} label="活動" size={100} />
          </div>
        </div>

        {/* Latest sleep detail */}
        {latestSleepDetail && (
          <div className="card rounded-2xl p-6">
            <h2 className="text-sm font-bold mb-4">最新の睡眠データ</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <DetailStat
                label="就寝"
                value={new Date(latestSleepDetail.bedtime_start).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })}
              />
              <DetailStat
                label="起床"
                value={new Date(latestSleepDetail.bedtime_end).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })}
              />
              <DetailStat
                label="睡眠時間"
                value={formatDuration(latestSleepDetail.total_sleep_duration)}
              />
              <DetailStat
                label="睡眠効率"
                value={`${latestSleepDetail.efficiency}%`}
              />
              <DetailStat
                label="深い睡眠"
                value={formatDuration(latestSleepDetail.deep_sleep_duration)}
              />
              <DetailStat
                label="REM"
                value={formatDuration(latestSleepDetail.rem_sleep_duration)}
              />
              <DetailStat
                label="平均心拍"
                value={latestSleepDetail.average_heart_rate ? `${Math.round(latestSleepDetail.average_heart_rate)} bpm` : "—"}
              />
              <DetailStat
                label="最低心拍"
                value={latestSleepDetail.lowest_heart_rate ? `${latestSleepDetail.lowest_heart_rate} bpm` : "—"}
              />
            </div>
          </div>
        )}

        {/* Sleep stages chart */}
        {sleepStagesData.length > 0 && (
          <div className="card rounded-2xl p-6">
            <h2 className="text-sm font-bold mb-4">睡眠ステージ（直近7日）</h2>
            <SleepStagesChart data={sleepStagesData} />
          </div>
        )}

        {/* Contributors radar charts */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sleepContribs.length > 0 && (
            <div className="card rounded-2xl p-5">
              <ContributorsChart
                data={sleepContribs}
                color="#6366f1"
                title="睡眠スコア要因"
              />
            </div>
          )}
          {readinessContribs.length > 0 && (
            <div className="card rounded-2xl p-5">
              <ContributorsChart
                data={readinessContribs}
                color="#10b981"
                title="回復スコア要因"
              />
            </div>
          )}
          {activityContribs.length > 0 && (
            <div className="card rounded-2xl p-5">
              <ContributorsChart
                data={activityContribs}
                color="#f59e0b"
                title="活動スコア要因"
              />
            </div>
          )}
        </div>

        {/* 90-day history charts */}
        <div className="card rounded-2xl p-6">
          <h2 className="text-sm font-bold mb-4">スコア推移（90日）</h2>
          <div className="space-y-6">
            <HistoryChart
              data={sleepHistory.map((s) => ({ day: s.day, value: s.score }))}
              color="#6366f1"
              title="睡眠スコア"
            />
            <HistoryChart
              data={readinessHistory.map((r) => ({ day: r.day, value: r.score }))}
              color="#10b981"
              title="回復スコア"
            />
            <HistoryChart
              data={activityHistory.map((a) => ({ day: a.day, value: a.score }))}
              color="#f59e0b"
              title="活動スコア"
            />
          </div>
        </div>

        {/* Steps & Calories history */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card rounded-2xl p-6">
            <HistoryChart
              data={activityHistory.map((a) => ({ day: a.day, value: a.steps }))}
              color="#8b5cf6"
              title="歩数"
              domain={[0, Math.max(...activityHistory.map((a) => a.steps), 10000)]}
            />
          </div>
          <div className="card rounded-2xl p-6">
            <HistoryChart
              data={activityHistory.map((a) => ({ day: a.day, value: a.active_calories }))}
              color="#f43f5e"
              title="消費カロリー"
              unit="kcal"
              domain={[0, Math.max(...activityHistory.map((a) => a.active_calories), 500)]}
            />
          </div>
        </div>

        {/* Temperature deviation */}
        {readinessHistory.some((r) => r.temperature_deviation != null) && (
          <div className="card rounded-2xl p-6">
            <HistoryChart
              data={readinessHistory
                .filter((r) => r.temperature_deviation != null)
                .map((r) => ({
                  day: r.day,
                  value: r.temperature_deviation != null ? Math.round(r.temperature_deviation * 100) / 100 : null,
                }))}
              color="#06b6d4"
              title="体温偏差"
              unit="°C"
              domain={[-2, 2]}
            />
          </div>
        )}

        {/* Gen4 data */}
        {(user.spo2 || user.stress || user.resilience || user.cardiovascularAge || user.vo2Max) && (
          <div className="card rounded-2xl p-6">
            <h2 className="text-sm font-bold mb-4">Gen4データ</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {user.spo2?.spo2_percentage && (
                <DetailStat label="血中酸素" value={`${user.spo2.spo2_percentage.average}%`} />
              )}
              {user.stress?.day_summary && (
                <DetailStat label="ストレス" value={user.stress.day_summary} />
              )}
              {user.resilience?.level && (
                <DetailStat label="回復力" value={user.resilience.level} />
              )}
              {user.cardiovascularAge?.vascular_age != null && (
                <DetailStat label="血管年齢" value={`${user.cardiovascularAge.vascular_age}歳`} />
              )}
              {user.vo2Max?.vo2_max != null && (
                <DetailStat label="最大酸素摂取量" value={`${user.vo2Max.vo2_max}`} />
              )}
            </div>
          </div>
        )}

        {/* Workouts */}
        <div className="card rounded-2xl p-6">
          <h2 className="text-sm font-bold mb-4">
            ワークアウト履歴
            <span className="text-slate-400 font-normal ml-2 text-xs">
              {workouts.length}件
            </span>
          </h2>
          <WorkoutList workouts={workouts} />
        </div>
      </div>

      <footer className="max-w-5xl mx-auto mt-10 text-center">
        <span className="text-[10px] text-slate-300 font-mono tracking-widest">
          refresh · 5min
        </span>
      </footer>
    </main>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-slate-400 font-medium">{label}</span>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}時間${m > 0 ? `${m}分` : ""}`;
  return `${m}分`;
}
