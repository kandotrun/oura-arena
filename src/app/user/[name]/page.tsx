export const dynamic = "force-dynamic";

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

// JST変換ヘルパー
function toJSTHours(date: Date): number {
  const jst = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  return jst.getHours() + jst.getMinutes() / 60;
}
function toJSTDate(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
}
import ContributorsChart from "@/components/ContributorsChart";
import TrendChart from "@/components/TrendChart";
import WorkoutList from "@/components/WorkoutList";
import SleepTimeline from "@/components/SleepTimeline";
import BedtimeChart from "@/components/BedtimeChart";
import ActivityTimeline from "@/components/ActivityTimeline";
import DayOfWeekChart from "@/components/DayOfWeekChart";
import PersonalBests from "@/components/PersonalBests";
import Titles from "@/components/Titles";
import HealthCalendar from "@/components/HealthCalendar";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const detail = await fetchUserDetail(name);
  if (!detail) notFound();

  const { user, sleepHistory, readinessHistory, activityHistory, sleepDetails, sleepDetailsLong, workouts, heartRateDay } = detail;
  const cfg = conditionConfig[user.condition];
  const power = computePowerLevel(user.sleep, user.readiness, user.activity);
  const hasAnyData = sleepHistory.length > 0 || readinessHistory.length > 0 || activityHistory.length > 0;

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

  // Sleep timeline data (90 days)
  const sleepTimelineData = sleepDetailsLong.map((s) => {
    const bedtime = new Date(s.bedtime_start);
    const wake = new Date(s.bedtime_end);
    const bedHour = toJSTHours(bedtime);
    const wakeHour = toJSTHours(wake);
    const durationHours = s.total_sleep_duration / 3600;
    return {
      day: s.day,
      bedtimeHour: bedHour,
      wakeHour: wakeHour,
      duration: durationHours,
      score: null as number | null,
    };
  });

  // Match scores from sleepHistory
  const scoreMap = new Map(sleepHistory.map((s) => [s.day, s.score]));
  sleepTimelineData.forEach((d) => {
    d.score = scoreMap.get(d.day) ?? null;
  });

  // Bedtime/wake trend (last 30 entries)
  const bedtimeTrend = sleepTimelineData.slice(-30).map((d) => ({
    day: d.day,
    bedtimeHour: d.bedtimeHour,
    wakeHour: d.wakeHour,
  }));

  // Sleep duration trend
  const durationTrend = sleepTimelineData.map((d) => ({
    day: d.day,
    value: Math.round(d.duration * 10) / 10,
  }));

  // Average sleep stats
  const avgDuration = sleepTimelineData.length > 0
    ? (sleepTimelineData.reduce((a, b) => a + b.duration, 0) / sleepTimelineData.length).toFixed(1)
    : "—";
  const avgBedtime = sleepTimelineData.length > 0
    ? sleepTimelineData.reduce((a, b) => a + (b.bedtimeHour < 18 ? b.bedtimeHour + 24 : b.bedtimeHour), 0) / sleepTimelineData.length
    : null;
  const avgBedtimeStr = avgBedtime != null
    ? `${Math.floor(avgBedtime >= 24 ? avgBedtime - 24 : avgBedtime).toString().padStart(2, "0")}:${Math.round(((avgBedtime >= 24 ? avgBedtime - 24 : avgBedtime) % 1) * 60).toString().padStart(2, "0")}`
    : "—";

  // HRV trend from sleep details
  const hrvTrend = sleepDetailsLong
    .filter((s) => s.average_hrv != null)
    .map((s) => ({ day: s.day, value: s.average_hrv }));

  // Breathing rate trend
  const breathTrend = sleepDetailsLong
    .filter((s) => s.average_breath != null)
    .map((s) => ({ day: s.day, value: Math.round((s.average_breath ?? 0) * 10) / 10 }));

  // Resting HR trend (lowest during sleep)
  const restingHRTrend = sleepDetailsLong
    .filter((s) => s.lowest_heart_rate != null)
    .map((s) => ({ day: s.day, value: s.lowest_heart_rate }));

  // Restless periods trend
  const restlessTrend = sleepDetailsLong
    .filter((s) => s.restless_periods != null)
    .map((s) => ({ day: s.day, value: s.restless_periods }));

  // Sleep regularity (std dev of bedtime)
  const bedtimeHours = sleepDetailsLong.map((s) => {
    const h = toJSTHours(new Date(s.bedtime_start));
    return h < 18 ? h + 24 : h;
  });
  const avgBedtimeAll = bedtimeHours.length > 0 ? bedtimeHours.reduce((a, b) => a + b, 0) / bedtimeHours.length : 0;
  const bedtimeStdDev = bedtimeHours.length > 1
    ? Math.sqrt(bedtimeHours.reduce((sum, h) => sum + (h - avgBedtimeAll) ** 2, 0) / bedtimeHours.length)
    : 0;
  const regularityScore = Math.max(0, Math.round(100 - bedtimeStdDev * 20));

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
          ← ダッシュボード
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-5xl mx-auto mb-4">
        <div className="card rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight capitalize">
              {user.name}
            </h1>
            <p className="text-slate-400 text-xs font-mono mt-1">
              {user.latestDay ?? "—"} · 全{sleepHistory.length}日分のデータ
            </p>
            <div className="mt-2">
              <Titles
                sleepHistory={sleepHistory}
                activityHistory={activityHistory}
                sleepDetails={sleepDetailsLong}
              />
            </div>
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
        <p className="text-[10px] text-slate-400 mt-2 text-right font-mono">
          S(85+)　A(70+)　B(50+)　C(〜49)
        </p>
      </header>

      {/* Sticky section nav */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-100 mb-6">
        <div className="max-w-5xl mx-auto flex gap-4 overflow-x-auto py-2 px-4 text-xs text-slate-500 font-medium">
          <a href="#overview" className="hover:text-slate-800 transition whitespace-nowrap">概要</a>
          <a href="#sleep" className="hover:text-slate-800 transition whitespace-nowrap">睡眠</a>
          <a href="#activity" className="hover:text-slate-800 transition whitespace-nowrap">活動</a>
          <a href="#vitals" className="hover:text-slate-800 transition whitespace-nowrap">バイタル</a>
          <a href="#calendar" className="hover:text-slate-800 transition whitespace-nowrap">カレンダー</a>
          <a href="#bests" className="hover:text-slate-800 transition whitespace-nowrap">ベスト</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Score rings row */}
        <div id="overview" className="card rounded-2xl p-6 scroll-mt-12">
          <div className="flex justify-center gap-8">
            <ScoreRing score={user.sleep?.score ?? null} label="睡眠" size={100} />
            <ScoreRing score={user.readiness?.score ?? null} label="回復" size={100} />
            <ScoreRing score={user.activity?.score ?? null} label="活動" size={100} />
          </div>
        </div>

        {/* No data notice */}
        {!hasAnyData && (
          <div className="card rounded-2xl p-8 text-center">
            <span className="text-4xl mb-3 block">⌚</span>
            <p className="text-sm font-medium text-slate-600 mb-1">
              まだデータがありません
            </p>
            <p className="text-xs text-slate-400">
              Oura Ringを装着してデータを同期すると、ここに詳細が表示されます
            </p>
          </div>
        )}

        {/* Latest sleep detail */}
        {latestSleepDetail && (
          <div id="sleep" className="card rounded-2xl p-6 scroll-mt-12">
            <h2 className="text-sm font-bold mb-4">🌙 最新の睡眠データ</h2>
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
            <h2 className="text-sm font-bold mb-4">🛏️ 睡眠ステージ（直近7日）</h2>
            <SleepStagesChart data={sleepStagesData} />
          </div>
        )}

        {/* Sleep Analysis */}
        {sleepTimelineData.length > 0 && (
          <div className="card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold">📊 睡眠分析</h2>
              <div className="flex gap-4">
                <span className="text-xs text-slate-400">
                  平均睡眠 <strong className="text-slate-600">{avgDuration}h</strong>
                </span>
                <span className="text-xs text-slate-400">
                  平均就寝 <strong className="text-slate-600">{avgBedtimeStr}</strong>
                </span>
                <span className="text-xs text-slate-400">
                  規則性 <strong className="text-slate-600">{regularityScore}/100</strong>
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Bedtime / Wake time trends */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2">
                  就寝・起床時刻の推移
                </h3>
                <BedtimeChart data={bedtimeTrend} />
              </div>

              {/* Sleep duration */}
              <HistoryChart
                data={durationTrend}
                color="#6366f1"
                title="睡眠時間"
                unit="h"
                domain={[0, Math.max(...durationTrend.map((d) => d.value ?? 0), 12)]}
              />

              {/* Sleep timeline (last 14 days) */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2">
                  睡眠タイムライン（直近14日）
                </h3>
                <SleepTimeline data={sleepTimelineData.slice(-14)} />
              </div>
            </div>
          </div>
        )}

        {/* Vitals: HRV, Breathing, Resting HR, Restless */}
        {(hrvTrend.length > 0 || restingHRTrend.length > 0 || breathTrend.length > 0 || restlessTrend.length > 0) && (
          <div id="vitals" className="card rounded-2xl p-6 scroll-mt-12">
            <h2 className="text-sm font-bold mb-4">💓 バイタルトレンド</h2>
            <div className="space-y-6">
              {hrvTrend.length > 0 && (
                <HistoryChart
                  data={hrvTrend}
                  color="#8b5cf6"
                  title="HRV（心拍変動）"
                  unit="ms"
                  domain={[0, Math.max(...hrvTrend.map((d) => d.value ?? 0), 100)]}
                />
              )}
              {restingHRTrend.length > 0 && (
                <HistoryChart
                  data={restingHRTrend}
                  color="#ec4899"
                  title="安静時心拍"
                  unit="bpm"
                  domain={[
                    Math.max(0, Math.min(...restingHRTrend.map((d) => d.value ?? 100)) - 5),
                    Math.max(...restingHRTrend.map((d) => d.value ?? 0)) + 5,
                  ]}
                />
              )}
              {breathTrend.length > 0 && (
                <HistoryChart
                  data={breathTrend}
                  color="#06b6d4"
                  title="呼吸数"
                  unit="回/分"
                  domain={[
                    Math.max(0, Math.min(...breathTrend.map((d) => d.value ?? 20)) - 2),
                    Math.max(...breathTrend.map((d) => d.value ?? 0)) + 2,
                  ]}
                />
              )}
              {restlessTrend.length > 0 && (
                <HistoryChart
                  data={restlessTrend}
                  color="#f59e0b"
                  title="中途覚醒回数"
                  unit="回"
                  domain={[0, Math.max(...restlessTrend.map((d) => d.value ?? 0), 30)]}
                />
              )}
            </div>
          </div>
        )}

        {/* Personal Bests */}
        {hasAnyData && (
          <div id="bests" className="card rounded-2xl p-6 scroll-mt-12">
            <h2 className="text-sm font-bold mb-4">🏆 パーソナルベスト</h2>
            <PersonalBests
              sleepHistory={sleepHistory}
              activityHistory={activityHistory}
              sleepDetails={sleepDetailsLong}
            />
          </div>
        )}

        {/* Health Calendar */}
        {hasAnyData && (
          <div id="calendar" className="card rounded-2xl p-6 scroll-mt-12">
            <h2 className="text-sm font-bold mb-4">📅 体調カレンダー</h2>
            <div className="space-y-6">
              <HealthCalendar
                data={sleepHistory.map((s) => ({ day: s.day, score: s.score }))}
                title="睡眠スコア"
              />
              {activityHistory.length > 0 && (
                <HealthCalendar
                  data={activityHistory.map((a) => ({ day: a.day, score: a.score }))}
                  title="活動スコア"
                />
              )}
            </div>
          </div>
        )}

        {/* Day of week patterns */}
        {hasAnyData && (
          <div className="card rounded-2xl p-6">
            <h2 className="text-sm font-bold mb-4">📆 曜日別パターン</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <DayOfWeekChart
                data={sleepHistory.map((s) => ({ day: s.day, score: s.score }))}
                title="睡眠スコア"
                color="#6366f1"
              />
              <DayOfWeekChart
                data={activityHistory.map((a) => ({ day: a.day, score: a.score }))}
                title="活動スコア"
                color="#f59e0b"
              />
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        {workouts.length > 0 && (
          <div id="activity" className="card rounded-2xl p-6 scroll-mt-12">
            <h2 className="text-sm font-bold mb-4">
              🏃 アクティビティ時間帯
              <span className="text-slate-400 font-normal ml-2 text-xs">
                いつ運動したか
              </span>
            </h2>
            <ActivityTimeline workouts={workouts.slice(-60)} />
          </div>
        )}

        {/* Contributors radar charts */}
        {(sleepContribs.length > 0 || readinessContribs.length > 0 || activityContribs.length > 0) && (
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
        )}

        {/* 90-day history charts */}
        {hasAnyData && (
          <div className="card rounded-2xl p-6">
            <h2 className="text-sm font-bold mb-4">📈 スコア推移（90日）</h2>
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
        )}

        {/* Steps & Calories history */}
        {activityHistory.length > 0 && (
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
        )}

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
            <h2 className="text-sm font-bold mb-4">⚡ Gen4データ</h2>
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
            💪 ワークアウト履歴
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
