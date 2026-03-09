export interface Title {
  emoji: string;
  name: string;
  reason: string;
  category: string;
}

interface SleepDay {
  day: string;
  score: number | null;
}

interface ActivityDay {
  day: string;
  score: number | null;
  steps: number;
  active_calories: number;
}

interface SleepDetail {
  bedtime_start: string;
  bedtime_end: string;
  efficiency: number;
  deep_sleep_duration: number;
  rem_sleep_duration: number;
  light_sleep_duration: number;
  awake_time: number;
  total_sleep_duration: number;
  average_hrv: number | null;
  lowest_heart_rate: number | null;
  average_heart_rate: number | null;
  average_breath: number | null;
}

function avg(nums: number[]): number {
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = avg(nums);
  return Math.sqrt(nums.reduce((sum, n) => sum + (n - m) ** 2, 0) / nums.length);
}

function getBedtimeHour(s: SleepDetail): number {
  const h = new Date(s.bedtime_start).getHours();
  const m = new Date(s.bedtime_start).getMinutes();
  const hour = h + m / 60;
  return hour < 12 ? hour + 24 : hour; // normalize: 0-11 → 24-35
}

function getWakeHour(s: SleepDetail): number {
  const d = new Date(s.bedtime_end);
  return d.getHours() + d.getMinutes() / 60;
}

function toMin(sec: number): number {
  return Math.round(sec / 60);
}

function getDayOfWeek(day: string): number {
  return new Date(day + "T00:00:00").getDay();
}

export function computeTitles(
  sleepHistory: SleepDay[],
  activityHistory: ActivityDay[],
  sleepDetails: SleepDetail[]
): Title[] {
  const titles: Title[] = [];
  const t = (emoji: string, name: string, reason: string, category: string) => {
    titles.push({ emoji, name, reason, category });
  };

  // ========== 基本データ準備 ==========
  const recent7Sleep = sleepHistory.slice(-7);
  const recent14Sleep = sleepHistory.slice(-14);
  const recent30Sleep = sleepHistory.slice(-30);
  const recent7Activity = activityHistory.slice(-7);
  const recent30Activity = activityHistory.slice(-30);
  const recent7Details = sleepDetails.slice(-7);
  const recent14Details = sleepDetails.slice(-14);
  const recent30Details = sleepDetails.slice(-30);

  const sleepScores7 = recent7Sleep.map((s) => s.score).filter((s): s is number => s != null);
  const sleepScores30 = recent30Sleep.map((s) => s.score).filter((s): s is number => s != null);
  const avgSleep7 = avg(sleepScores7);
  const avgSleep30 = avg(sleepScores30);

  const actScores7 = recent7Activity.map((a) => a.score).filter((s): s is number => s != null);
  const actScores30 = recent30Activity.map((a) => a.score).filter((s): s is number => s != null);
  const avgAct7 = avg(actScores7);

  const steps7 = recent7Activity.map((a) => a.steps);
  const steps30 = recent30Activity.map((a) => a.steps);
  const avgSteps7 = avg(steps7);
  const avgSteps30 = avg(steps30);
  const maxSteps = Math.max(...activityHistory.map((a) => a.steps), 0);
  const maxStepsDay = activityHistory.reduce((best, a) => a.steps > (best?.steps ?? 0) ? a : best, activityHistory[0]);

  const cals7 = recent7Activity.map((a) => a.active_calories);
  const avgCals7 = avg(cals7);
  const avgCals30 = avg(recent30Activity.map((a) => a.active_calories));

  const bedtimes7 = recent7Details.map(getBedtimeHour);
  const bedtimes30 = recent30Details.map(getBedtimeHour);
  const avgBedtime7 = avg(bedtimes7);
  const avgBedtime30 = avg(bedtimes30);

  const wakeTimes7 = recent7Details.map(getWakeHour);
  const avgWake7 = avg(wakeTimes7);

  const efficiencies7 = recent7Details.map((s) => s.efficiency);
  const efficiencies30 = recent30Details.map((s) => s.efficiency);
  const avgEff7 = avg(efficiencies7);
  const avgEff30 = avg(efficiencies30);

  const deepMin7 = recent7Details.map((s) => toMin(s.deep_sleep_duration));
  const avgDeep7 = avg(deepMin7);
  const remMin7 = recent7Details.map((s) => toMin(s.rem_sleep_duration));
  const avgRem7 = avg(remMin7);
  const lightMin7 = recent7Details.map((s) => toMin(s.light_sleep_duration));
  const avgLight7 = avg(lightMin7);
  const totalMin7 = recent7Details.map((s) => toMin(s.total_sleep_duration));
  const avgTotal7 = avg(totalMin7);
  const awakeMin7 = recent7Details.map((s) => toMin(s.awake_time));
  const avgAwake7 = avg(awakeMin7);

  const hrvValues = recent7Details.map((s) => s.average_hrv).filter((h): h is number => h != null);
  const hrvAll = sleepDetails.map((s) => s.average_hrv).filter((h): h is number => h != null);
  const avgHrv7 = avg(hrvValues);
  const avgHrvAll = avg(hrvAll);
  const maxHrv = hrvAll.length > 0 ? Math.max(...hrvAll) : 0;

  const rhrValues = recent7Details.map((s) => s.lowest_heart_rate).filter((h): h is number => h != null);
  const avgRhr7 = avg(rhrValues);

  const breathValues = recent7Details.map((s) => s.average_breath).filter((b): b is number => b != null);
  const avgBreath7 = avg(breathValues);

  // ========== 睡眠スコア系 (15種) ==========
  if (avgSleep7 >= 95) t("👑", "睡眠の神", "7日間平均睡眠スコア95+", "睡眠");
  else if (avgSleep7 >= 90) t("🏅", "睡眠マスター", "7日間平均睡眠スコア90+", "睡眠");
  else if (avgSleep7 >= 85) t("😴", "安眠の達人", "7日間平均睡眠スコア85+", "睡眠");
  else if (avgSleep7 >= 80) t("💤", "良眠家", "7日間平均睡眠スコア80+", "睡眠");
  else if (avgSleep7 >= 70) t("🛏️", "まあまあ寝てる", "7日間平均睡眠スコア70+", "睡眠");
  else if (avgSleep7 < 40) t("💀", "睡眠崩壊", "7日間平均睡眠スコア40未満", "睡眠");
  else if (avgSleep7 < 50) t("🦉", "夜更かしの帝王", "7日間平均睡眠スコア50未満", "睡眠");
  else if (avgSleep7 < 60) t("😵", "寝不足気味", "7日間平均睡眠スコア60未満", "睡眠");

  if (avgSleep30 >= 85 && sleepScores30.length >= 20) t("🌟", "安定の眠り", "30日間平均睡眠スコア85+", "睡眠");
  if (avgSleep30 < 50 && sleepScores30.length >= 20) t("🆘", "慢性寝不足", "30日間平均睡眠スコア50未満", "睡眠");

  // 睡眠スコアの変動
  if (sleepScores7.length >= 5) {
    const sd = stdDev(sleepScores7);
    if (sd < 3) t("📏", "精密睡眠", "睡眠スコアのブレが極小（σ<3）", "睡眠");
    else if (sd > 15) t("🎢", "ジェットコースター睡眠", "睡眠スコアの変動激しい（σ>15）", "睡眠");
  }

  // 最高/最低スコア
  const maxSleepScore = sleepScores30.length > 0 ? Math.max(...sleepScores30) : 0;
  const minSleepScore = sleepScores30.length > 0 ? Math.min(...sleepScores30) : 0;
  if (maxSleepScore === 100) t("💯", "パーフェクトスリープ", "睡眠スコア100達成", "睡眠");
  if (maxSleepScore >= 95) t("✨", "神の一夜", "睡眠スコア95以上を記録", "睡眠");
  if (minSleepScore <= 20 && sleepScores30.length > 0) t("😱", "地獄の夜", "睡眠スコア20以下を経験", "睡眠");

  // ========== 就寝時刻系 (10種) ==========
  if (recent7Details.length >= 3) {
    if (avgBedtime7 <= 22) t("🐓", "超早寝", "平均就寝22時前", "就寝");
    else if (avgBedtime7 <= 23) t("🌙", "早寝の鬼", "平均就寝23時前", "就寝");
    else if (avgBedtime7 >= 28) t("🧛", "夜行性", "平均就寝4時以降", "就寝");
    else if (avgBedtime7 >= 27) t("🦇", "ミッドナイトクリーチャー", "平均就寝3時以降", "就寝");
    else if (avgBedtime7 >= 26) t("🌃", "深夜族", "平均就寝2時以降", "就寝");
    else if (avgBedtime7 >= 25) t("🌜", "夜型人間", "平均就寝1時以降", "就寝");

    const bedtimeStd = stdDev(bedtimes7);
    if (bedtimeStd < 0.25) t("⏰", "体内時計完璧", "就寝時刻のブレ15分未満", "就寝");
    else if (bedtimeStd < 0.5) t("🎯", "リズムキーパー", "就寝時刻のブレ30分未満", "就寝");
    else if (bedtimeStd > 2) t("🌀", "カオス就寝", "就寝時刻のブレ2時間超", "就寝");
  }

  // ========== 起床時刻系 (6種) ==========
  if (recent7Details.length >= 3) {
    if (avgWake7 <= 5.5) t("🌅", "ご来光ハンター", "平均起床5:30前", "起床");
    else if (avgWake7 <= 6.5) t("🐦", "アーリーバード", "平均起床6:30前", "起床");
    else if (avgWake7 >= 11) t("🐌", "お昼起き", "平均起床11時以降", "起床");
    else if (avgWake7 >= 10) t("😪", "朝が苦手", "平均起床10時以降", "起床");

    const wakeStd = stdDev(wakeTimes7);
    if (wakeStd < 0.25) t("🔔", "目覚まし不要", "起床時刻のブレ15分未満", "起床");
    else if (wakeStd > 2) t("🎲", "ランダム起床", "起床時刻のブレ2時間超", "起床");
  }

  // ========== 睡眠効率系 (6種) ==========
  if (recent7Details.length >= 3) {
    if (avgEff7 >= 95) t("🔬", "効率の鬼", "平均睡眠効率95%+", "効率");
    else if (avgEff7 >= 92) t("💎", "睡眠効率マスター", "平均睡眠効率92%+", "効率");
    else if (avgEff7 >= 88) t("📈", "効率良好", "平均睡眠効率88%+", "効率");
    else if (avgEff7 < 70) t("😤", "寝つき悪い", "平均睡眠効率70%未満", "効率");
    else if (avgEff7 < 80) t("🐑", "羊を数える人", "平均睡眠効率80%未満", "効率");
  }
  if (avgEff30 >= 92 && efficiencies30.length >= 20) t("🏆", "効率キング", "30日間平均効率92%+", "効率");

  // ========== 睡眠時間系 (10種) ==========
  if (recent7Details.length >= 3) {
    if (avgTotal7 >= 540) t("🐨", "コアラ", "平均睡眠9時間+", "睡眠時間");
    else if (avgTotal7 >= 480) t("🐼", "たっぷり睡眠", "平均睡眠8時間+", "睡眠時間");
    else if (avgTotal7 >= 420) t("😊", "理想の睡眠時間", "平均睡眠7時間+", "睡眠時間");
    else if (avgTotal7 < 240) t("⚡", "ショートスリーパー疑惑", "平均睡眠4時間未満", "睡眠時間");
    else if (avgTotal7 < 300) t("🔋", "充電不足", "平均睡眠5時間未満", "睡眠時間");
    else if (avgTotal7 < 360) t("⏳", "もう少し寝よう", "平均睡眠6時間未満", "睡眠時間");

    // 最長/最短
    const maxTotal = Math.max(...totalMin7);
    const minTotal = Math.min(...totalMin7);
    if (maxTotal >= 600) t("🏔️", "10時間の壁突破", "一晩で10時間以上睡眠", "睡眠時間");
    if (minTotal <= 180) t("💨", "ほぼ仮眠", "一晩3時間以下の日あり", "睡眠時間");
    if (maxTotal - minTotal >= 180) t("📊", "睡眠時間バラバラ", "最長と最短の差が3時間+", "睡眠時間");
  }

  // ========== 深い睡眠系 (6種) ==========
  if (recent7Details.length >= 3) {
    if (avgDeep7 >= 120) t("🌊", "深海の眠り手", "平均深い睡眠120分+", "深い睡眠");
    else if (avgDeep7 >= 90) t("🐳", "ディープダイバー", "平均深い睡眠90分+", "深い睡眠");
    else if (avgDeep7 >= 60) t("🐬", "まあまあ深い", "平均深い睡眠60分+", "深い睡眠");
    else if (avgDeep7 < 30) t("🏜️", "深い睡眠不足", "平均深い睡眠30分未満", "深い睡眠");
    else if (avgDeep7 < 45) t("🌵", "もっと深く", "平均深い睡眠45分未満", "深い睡眠");

    const deepRatio = avgDeep7 / (avgTotal7 || 1);
    if (deepRatio >= 0.25) t("💠", "ディープ比率王", "深い睡眠が全体の25%+", "深い睡眠");
  }

  // ========== REM睡眠系 (5種) ==========
  if (recent7Details.length >= 3) {
    if (avgRem7 >= 120) t("🎭", "夢見がち", "平均REM 120分+", "REM");
    else if (avgRem7 >= 90) t("🌈", "REM豊富", "平均REM 90分+", "REM");
    else if (avgRem7 < 30) t("🚫", "REM枯渇", "平均REM 30分未満", "REM");
    else if (avgRem7 < 60) t("💭", "もっと夢を", "平均REM 60分未満", "REM");

    const remRatio = avgRem7 / (avgTotal7 || 1);
    if (remRatio >= 0.25) t("🎪", "REM比率王", "REMが全体の25%+", "REM");
  }

  // ========== 中途覚醒系 (4種) ==========
  if (recent7Details.length >= 3) {
    if (avgAwake7 <= 10) t("🪨", "岩のように眠る", "平均中途覚醒10分以下", "覚醒");
    else if (avgAwake7 <= 20) t("🧊", "熟睡タイプ", "平均中途覚醒20分以下", "覚醒");
    else if (avgAwake7 >= 60) t("👀", "目が覚めがち", "平均中途覚醒60分+", "覚醒");
    else if (avgAwake7 >= 90) t("🚨", "覚醒しすぎ", "平均中途覚醒90分+", "覚醒");
  }

  // ========== HRV系 (8種) ==========
  if (hrvValues.length >= 3) {
    if (avgHrv7 >= 120) t("🫀", "HRVモンスター", "平均HRV 120ms+", "HRV");
    else if (avgHrv7 >= 100) t("💖", "HRVエリート", "平均HRV 100ms+", "HRV");
    else if (avgHrv7 >= 80) t("💓", "HRV王", "平均HRV 80ms+", "HRV");
    else if (avgHrv7 >= 60) t("💗", "HRV良好", "平均HRV 60ms+", "HRV");
    else if (avgHrv7 < 20) t("💔", "HRV危険域", "平均HRV 20ms未満", "HRV");
    else if (avgHrv7 < 30) t("🩺", "HRV低め", "平均HRV 30ms未満", "HRV");

    const hrvStd = stdDev(hrvValues);
    if (hrvStd < 3) t("📐", "HRV安定", "HRVのブレ極小（σ<3）", "HRV");
    if (hrvStd > 20) t("📉", "HRV乱高下", "HRVのブレ大きい（σ>20）", "HRV");
  }
  if (maxHrv >= 150) t("🏋️", "HRV最高記録150+", `最高HRV ${Math.round(maxHrv)}ms`, "HRV");

  // ========== 安静時心拍系 (5種) ==========
  if (rhrValues.length >= 3) {
    if (avgRhr7 <= 45) t("🧘", "アスリート心拍", "平均安静時心拍45以下", "心拍");
    else if (avgRhr7 <= 55) t("🫁", "低心拍", "平均安静時心拍55以下", "心拍");
    else if (avgRhr7 >= 80) t("💢", "心拍高め", "平均安静時心拍80+", "心拍");
    else if (avgRhr7 >= 70) t("🫂", "少し高い", "平均安静時心拍70+", "心拍");

    const rhrStd = stdDev(rhrValues);
    if (rhrStd < 2) t("🎻", "心拍安定", "安静時心拍のブレ極小", "心拍");
  }

  // ========== 呼吸数系 (3種) ==========
  if (breathValues.length >= 3) {
    if (avgBreath7 <= 12) t("🧘‍♀️", "深呼吸マスター", "平均呼吸数12以下", "呼吸");
    else if (avgBreath7 >= 20) t("🌬️", "呼吸早め", "平均呼吸数20+", "呼吸");
    else if (avgBreath7 >= 14 && avgBreath7 <= 16) t("🍃", "呼吸ちょうどいい", "平均呼吸数14-16", "呼吸");
  }

  // ========== 歩数系 (12種) ==========
  if (avgSteps7 >= 20000) t("🦿", "マラソンランナー", "7日間平均2万歩+", "歩数");
  else if (avgSteps7 >= 15000) t("🏃‍♂️", "ハイウォーカー", "7日間平均1.5万歩+", "歩数");
  else if (avgSteps7 >= 10000) t("🚶", "歩数マシーン", "7日間平均1万歩+", "歩数");
  else if (avgSteps7 >= 7000) t("👟", "ウォーカー", "7日間平均7000歩+", "歩数");
  else if (avgSteps7 >= 5000) t("🚶‍♀️", "まあまあ歩く", "7日間平均5000歩+", "歩数");
  else if (avgSteps7 < 1000) t("🛋️", "引きこもり", "7日間平均1000歩未満", "歩数");
  else if (avgSteps7 < 2000) t("🏠", "インドア派", "7日間平均2000歩未満", "歩数");
  else if (avgSteps7 < 3000) t("🐢", "のんびり派", "7日間平均3000歩未満", "歩数");

  if (maxSteps >= 30000) t("🗻", "3万歩の壁突破", `最高${maxSteps.toLocaleString()}歩`, "歩数");
  else if (maxSteps >= 20000) t("🏆", "2万歩の壁突破", `最高${maxSteps.toLocaleString()}歩`, "歩数");

  if (avgSteps30 >= 10000 && steps30.length >= 20) t("🥇", "歩数キング", "30日間平均1万歩+", "歩数");

  if (steps7.length >= 5) {
    const stepsStd = stdDev(steps7);
    const stepsCoV = avgSteps7 > 0 ? stepsStd / avgSteps7 : 0;
    if (stepsCoV > 0.8) t("🎰", "歩数ギャンブラー", "歩数の日差が激しい", "歩数");
  }

  // ========== カロリー系 (6種) ==========
  if (avgCals7 >= 800) t("🌋", "カロリー大爆発", "平均消費800kcal+", "カロリー");
  else if (avgCals7 >= 500) t("🔥", "カロリーバーナー", "平均消費500kcal+", "カロリー");
  else if (avgCals7 >= 300) t("🔆", "まあまあ燃焼", "平均消費300kcal+", "カロリー");
  else if (avgCals7 < 50) t("🧊", "省エネモード", "平均消費50kcal未満", "カロリー");
  else if (avgCals7 < 100) t("🪫", "低燃費", "平均消費100kcal未満", "カロリー");

  if (avgCals30 >= 500 && recent30Activity.length >= 20) t("♨️", "月間バーナー", "30日間平均消費500kcal+", "カロリー");

  // ========== 活動スコア系 (5種) ==========
  if (avgAct7 >= 90) t("🥊", "活動の鬼", "7日間平均活動スコア90+", "活動");
  else if (avgAct7 >= 80) t("💪", "アクティブ", "7日間平均活動スコア80+", "活動");
  else if (avgAct7 >= 70) t("🏋️‍♀️", "まあまあ動いてる", "7日間平均活動スコア70+", "活動");
  else if (actScores7.length > 0 && avgAct7 < 30) t("🦥", "スローライフ", "7日間平均活動スコア30未満", "活動");
  else if (actScores7.length > 0 && avgAct7 < 50) t("🐾", "おとなしめ", "7日間平均活動スコア50未満", "活動");

  // ========== 連続記録系 (10種) ==========
  // Good Sleep連続
  let streak = 0;
  let maxStreak = 0;
  for (const s of sleepHistory) {
    if (s.score != null && s.score >= 75) { streak++; maxStreak = Math.max(maxStreak, streak); }
    else { streak = 0; }
  }
  if (maxStreak >= 30) t("🔱", "Good Sleep 30日連続", `${maxStreak}日連続75+`, "連続");
  else if (maxStreak >= 14) t("⚡", "Good Sleep 2週間", `${maxStreak}日連続75+`, "連続");
  else if (maxStreak >= 7) t("🔥", "連勝街道", `${maxStreak}日連続Good Sleep`, "連続");

  // Bad Sleep連続
  streak = 0;
  let maxBadStreak = 0;
  for (const s of sleepHistory) {
    if (s.score != null && s.score < 60) { streak++; maxBadStreak = Math.max(maxBadStreak, streak); }
    else { streak = 0; }
  }
  if (maxBadStreak >= 7) t("☠️", "暗黒の1週間", `${maxBadStreak}日連続Bad Sleep`, "連続");
  else if (maxBadStreak >= 3) t("🌧️", "スランプ", `${maxBadStreak}日連続Bad Sleep`, "連続");

  // 歩数1万連続
  streak = 0;
  let maxStepStreak = 0;
  for (const a of activityHistory) {
    if (a.steps >= 10000) { streak++; maxStepStreak = Math.max(maxStepStreak, streak); }
    else { streak = 0; }
  }
  if (maxStepStreak >= 30) t("🏅", "1万歩チャレンジ30日", `${maxStepStreak}日連続`, "連続");
  else if (maxStepStreak >= 14) t("🎖️", "1万歩チャレンジ2週間", `${maxStepStreak}日連続`, "連続");
  else if (maxStepStreak >= 7) t("🪙", "1万歩チャレンジ1週間", `${maxStepStreak}日連続`, "連続");

  // データ継続日数
  const totalDays = sleepHistory.length;
  if (totalDays >= 365) t("📅", "1年選手", `${totalDays}日分のデータ`, "継続");
  else if (totalDays >= 180) t("🗓️", "半年選手", `${totalDays}日分のデータ`, "継続");
  else if (totalDays >= 90) t("📆", "3ヶ月選手", `${totalDays}日分のデータ`, "継続");
  else if (totalDays >= 30) t("📋", "1ヶ月選手", `${totalDays}日分のデータ`, "継続");

  // ========== トレンド系 (8種) ==========
  if (sleepScores7.length >= 5 && sleepScores30.length >= 10) {
    const prev7 = sleepScores30.slice(-14, -7);
    if (prev7.length >= 5) {
      const prevAvg = avg(prev7);
      const diff = avgSleep7 - prevAvg;
      if (diff >= 10) t("📈", "急上昇中", `睡眠スコア先週比+${Math.round(diff)}`, "トレンド");
      else if (diff >= 5) t("🔼", "改善中", `睡眠スコア先週比+${Math.round(diff)}`, "トレンド");
      else if (diff <= -10) t("📉", "急降下中", `睡眠スコア先週比${Math.round(diff)}`, "トレンド");
      else if (diff <= -5) t("🔽", "下降気味", `睡眠スコア先週比${Math.round(diff)}`, "トレンド");
    }
  }

  if (steps7.length >= 5 && steps30.length >= 10) {
    const prevSteps = steps30.slice(-14, -7);
    if (prevSteps.length >= 5) {
      const prevAvg = avg(prevSteps);
      const ratio = avgSteps7 / (prevAvg || 1);
      if (ratio >= 1.5) t("🚀", "歩数急増", `先週比${Math.round((ratio - 1) * 100)}%増`, "トレンド");
      else if (ratio <= 0.5) t("📉", "歩数急減", `先週比${Math.round((1 - ratio) * 100)}%減`, "トレンド");
    }
  }

  if (hrvValues.length >= 3 && hrvAll.length >= 10) {
    const prevHrv = hrvAll.slice(-14, -7);
    if (prevHrv.length >= 3) {
      const diff = avgHrv7 - avg(prevHrv);
      if (diff >= 10) t("💚", "HRV改善中", `先週比+${Math.round(diff)}ms`, "トレンド");
      else if (diff <= -10) t("💛", "HRV低下中", `先週比${Math.round(diff)}ms`, "トレンド");
    }
  }

  // ========== 曜日パターン系 (6種) ==========
  if (sleepHistory.length >= 14) {
    const weekendScores = sleepHistory.filter((s) => {
      const dow = getDayOfWeek(s.day);
      return dow === 0 || dow === 6;
    }).map((s) => s.score).filter((s): s is number => s != null);
    const weekdayScores = sleepHistory.filter((s) => {
      const dow = getDayOfWeek(s.day);
      return dow >= 1 && dow <= 5;
    }).map((s) => s.score).filter((s): s is number => s != null);

    if (weekendScores.length >= 4 && weekdayScores.length >= 8) {
      const weDiff = avg(weekendScores) - avg(weekdayScores);
      if (weDiff >= 10) t("🛌", "週末寝だめ型", `週末+${Math.round(weDiff)}pt`, "パターン");
      else if (weDiff <= -10) t("🏄", "週末アクティブ型", `週末${Math.round(weDiff)}pt`, "パターン");
      else if (Math.abs(weDiff) <= 3) t("⚖️", "平日週末均一", "平日と週末の差3pt以内", "パターン");
    }
  }

  if (sleepDetails.length >= 14) {
    const weekendBedtimes = sleepDetails.filter((_, i) => {
      const day = sleepHistory[i]?.day;
      if (!day) return false;
      const dow = getDayOfWeek(day);
      return dow === 5 || dow === 6; // 金土の夜
    }).map(getBedtimeHour);
    const weekdayBedtimes = sleepDetails.filter((_, i) => {
      const day = sleepHistory[i]?.day;
      if (!day) return false;
      const dow = getDayOfWeek(day);
      return dow >= 0 && dow <= 4;
    }).map(getBedtimeHour);

    if (weekendBedtimes.length >= 2 && weekdayBedtimes.length >= 4) {
      const diff = avg(weekendBedtimes) - avg(weekdayBedtimes);
      if (diff >= 1.5) t("🎉", "金土の夜更かし", `週末+${Math.round(diff * 60)}分遅い`, "パターン");
      else if (diff <= -0.5) t("🤔", "週末の方が早寝", `週末${Math.round(Math.abs(diff) * 60)}分早い`, "パターン");
    }
  }

  // ========== バランス系 (5種) ==========
  if (sleepScores7.length >= 3 && actScores7.length >= 3) {
    const both = (avgSleep7 + avgAct7) / 2;
    const diff = Math.abs(avgSleep7 - avgAct7);
    if (both >= 80 && diff <= 10) t("🏅", "文武両道", "睡眠も活動もハイスコア", "バランス");
    if (avgSleep7 >= 80 && avgAct7 < 40) t("💤", "寝るだけの人", "睡眠◎だけど活動×", "バランス");
    if (avgSleep7 < 50 && avgAct7 >= 80) t("🏃", "寝ないで走る人", "睡眠×だけど活動◎", "バランス");
  }

  if (hrvValues.length >= 3 && avgHrv7 >= 60 && avgSleep7 >= 80 && avgAct7 >= 70) {
    t("🌿", "ウェルネスの達人", "HRV/睡眠/活動すべて良好", "バランス");
  }

  if (avgEff7 >= 90 && avgDeep7 >= 60 && avgRem7 >= 60 && recent7Details.length >= 3) {
    t("🧬", "睡眠の質パーフェクト", "効率/深い/REMすべて良好", "バランス");
  }

  // ========== 記録・マイルストーン系 (5種) ==========
  const totalSteps = activityHistory.reduce((a, b) => a + b.steps, 0);
  if (totalSteps >= 10_000_000) t("🌍", "1000万歩達成", `累計${(totalSteps / 1_000_000).toFixed(1)}M歩`, "記録");
  else if (totalSteps >= 5_000_000) t("🗺️", "500万歩達成", `累計${(totalSteps / 1_000_000).toFixed(1)}M歩`, "記録");
  else if (totalSteps >= 1_000_000) t("🌐", "100万歩達成", `累計${(totalSteps / 1_000_000).toFixed(1)}M歩`, "記録");

  const totalCals = activityHistory.reduce((a, b) => a + b.active_calories, 0);
  if (totalCals >= 100_000) t("☀️", "10万kcal燃焼", `累計${(totalCals / 1000).toFixed(0)}kkcal`, "記録");
  else if (totalCals >= 50_000) t("🌤️", "5万kcal燃焼", `累計${(totalCals / 1000).toFixed(0)}kkcal`, "記録");

  // ========== ユニーク系 (4種) ==========
  if (recent7Details.length >= 3) {
    const totalHours = avgTotal7 / 60;
    const deepRatio = avgDeep7 / (avgTotal7 || 1);
    const remRatio = avgRem7 / (avgTotal7 || 1);
    if (totalHours >= 8 && deepRatio >= 0.2 && remRatio >= 0.2) {
      t("🦄", "ユニコーン睡眠", "8h+かつ深い/REMどちらも20%+", "ユニーク");
    }
    if (totalHours <= 6 && avgSleep7 >= 85) {
      t("⚡", "効率型ショートスリーパー", "6h以下でスコア85+", "ユニーク");
    }
  }

  if (avgSteps7 >= 10000 && avgSleep7 >= 80) {
    t("🐺", "狼モード", "1万歩+かつ睡眠80+", "ユニーク");
  }

  if (avgCals7 >= 500 && avgHrv7 >= 60 && hrvValues.length >= 3) {
    t("🔋", "フル充電", "高燃焼+高HRV", "ユニーク");
  }

  // ========== フォールバック ==========
  if (titles.length === 0) {
    t("🌱", "ルーキー", "データ蓄積中", "その他");
  }

  return titles;
}
