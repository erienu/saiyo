import type { Applicant, DateRange, HealthScoreConfig, PositionTarget, SignalColor, Stage } from '../types';
import { STAGES } from '../types';

/** 応募日が指定期間(両端含む)に含まれる応募者のみを残す。start/endがnullなら無制限。 */
export function filterByPeriod(applicants: Applicant[], range: DateRange): Applicant[] {
  if (!range.start && !range.end) return applicants;
  const startMs = range.start ? new Date(range.start).getTime() : -Infinity;
  const endMs = range.end ? new Date(range.end).getTime() : Infinity;
  return applicants.filter((a) => {
    if (!a.appliedDate) return false;
    const t = new Date(a.appliedDate).getTime();
    return t >= startMs && t <= endMs;
  });
}

export function getPositions(applicants: Applicant[]): string[] {
  return Array.from(new Set(applicants.map((a) => a.position))).sort();
}

export function getChannels(applicants: Applicant[]): string[] {
  return Array.from(new Set(applicants.map((a) => a.channel))).sort();
}

// カジュアル面談は実施しないポジションもあるため、メインのパイプライン・リードタイム集計からは外し別管理する。
export const MAIN_PIPELINE_STAGES: Stage[] = ['応募', '書類選考', '1次面接', '最終面接', '内定', '内定承諾'];

export interface TargetProgress {
  position: string;
  targetCount: number;
  hiredCount: number;
  achievementRate: number; // 0-100
}

export function buildTargetProgress(
  applicants: Applicant[],
  targets: PositionTarget[]
): TargetProgress[] {
  return targets.map((t) => {
    const hiredCount = applicants.filter(
      (a) => a.position === t.position && a.status === '内定承諾'
    ).length;
    return {
      position: t.position,
      targetCount: t.targetCount,
      hiredCount,
      achievementRate:
        t.targetCount > 0 ? Math.round((hiredCount / t.targetCount) * 1000) / 10 : 0,
    };
  });
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

export interface LeadTimeStat {
  fromStage: Stage;
  toStage: Stage;
  avgDays: number | null;
  sampleSize: number;
}

/** 隣接ステージ間の平均リードタイム（日数）。カジュアル面談は除外したメインフローのみ対象。 */
export function buildLeadTimes(applicants: Applicant[]): LeadTimeStat[] {
  const stats: LeadTimeStat[] = [];
  for (let i = 0; i < MAIN_PIPELINE_STAGES.length - 1; i++) {
    const from = MAIN_PIPELINE_STAGES[i];
    const to = MAIN_PIPELINE_STAGES[i + 1];
    const diffs: number[] = [];
    for (const a of applicants) {
      const fromDate = a.stageDates[from];
      const toDate = a.stageDates[to];
      if (fromDate && toDate) {
        diffs.push(daysBetween(fromDate, toDate));
      }
    }
    stats.push({
      fromStage: from,
      toStage: to,
      avgDays:
        diffs.length > 0
          ? Math.round((diffs.reduce((s, v) => s + v, 0) / diffs.length) * 10) / 10
          : null,
      sampleSize: diffs.length,
    });
  }
  return stats;
}

/** 応募から内定承諾までの平均リードタイム（日数） */
export function buildOverallLeadTime(applicants: Applicant[]): number | null {
  const diffs: number[] = [];
  for (const a of applicants) {
    if (a.stageDates['応募'] && a.stageDates['内定承諾']) {
      diffs.push(daysBetween(a.stageDates['応募']!, a.stageDates['内定承諾']!));
    }
  }
  if (diffs.length === 0) return null;
  return Math.round((diffs.reduce((s, v) => s + v, 0) / diffs.length) * 10) / 10;
}

export interface ChannelStat {
  channel: string;
  applicants: number;
  hired: number;
  conversionRate: number; // %
  totalCost: number;
  costPerHire: number | null;
}

/**
 * 流入経路（チャネル）別の応募数・通過率・コスト・採用単価。
 * `channelCosts`でチャネルごとの「応募者1人あたりの概算コスト」(手入力)を渡すと、
 * 応募者数を掛けた額をそのチャネルの合計コストとして使う。
 * 未設定の場合はCSVのコスト列(applicant.cost)の合計を使う。
 */
export function buildChannelStats(
  applicants: Applicant[],
  channelCostPerApplicant: Record<string, number> = {}
): ChannelStat[] {
  const channels = getChannels(applicants);
  return channels
    .map((channel) => {
      const rows = applicants.filter((a) => a.channel === channel);
      const hired = rows.filter((a) => a.status === '内定承諾').length;
      const manualCostPerApplicant = channelCostPerApplicant[channel];
      const totalCost =
        manualCostPerApplicant !== undefined
          ? manualCostPerApplicant * rows.length
          : rows.reduce((s, a) => s + a.cost, 0);
      return {
        channel,
        applicants: rows.length,
        hired,
        conversionRate:
          rows.length > 0 ? Math.round((hired / rows.length) * 1000) / 10 : 0,
        totalCost,
        costPerHire: hired > 0 && totalCost > 0 ? Math.round(totalCost / hired) : null,
      };
    })
    .sort((a, b) => b.applicants - a.applicants);
}

export interface InterviewerStat {
  interviewer: string;
  stage: Stage;
  count: number;
  avgScore: number | null;
  passRate: number; // %
}

/** 面接官の甘辛分析: 同ステージ全体平均と比較できるよう全行を返す */
export function buildInterviewerStats(applicants: Applicant[]): {
  rows: InterviewerStat[];
  stageAverages: Record<string, { avgScore: number | null; passRate: number }>;
} {
  const byKey = new Map<string, InterviewRecordWithKey[]>();

  interface InterviewRecordWithKey {
    interviewer: string;
    stage: Stage;
    score: number | null;
    result: '通過' | '不通過' | null;
  }

  for (const a of applicants) {
    for (const iv of a.interviews) {
      if (!iv.interviewer) continue;
      const key = `${iv.interviewer}__${iv.stage}`;
      const list = byKey.get(key) ?? [];
      list.push({ interviewer: iv.interviewer, stage: iv.stage, score: iv.score, result: iv.result });
      byKey.set(key, list);
    }
  }

  const rows: InterviewerStat[] = Array.from(byKey.entries()).map(([, list]) => {
    const scores = list.map((l) => l.score).filter((s): s is number => s !== null);
    const passed = list.filter((l) => l.result === '通過').length;
    return {
      interviewer: list[0].interviewer,
      stage: list[0].stage,
      count: list.length,
      avgScore:
        scores.length > 0
          ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100
          : null,
      passRate: list.length > 0 ? Math.round((passed / list.length) * 1000) / 10 : 0,
    };
  });

  const stageAverages: Record<string, { avgScore: number | null; passRate: number }> = {};
  for (const stage of STAGES) {
    const stageRows = rows.filter((r) => r.stage === stage);
    const allScores = stageRows
      .filter((r) => r.avgScore !== null)
      .flatMap((r) => Array(r.count).fill(r.avgScore as number));
    const totalCount = stageRows.reduce((s, r) => s + r.count, 0);
    const totalPassed = stageRows.reduce((s, r) => s + (r.passRate / 100) * r.count, 0);
    stageAverages[stage] = {
      avgScore:
        allScores.length > 0
          ? Math.round((allScores.reduce((s, v) => s + v, 0) / allScores.length) * 100) / 100
          : null,
      passRate: totalCount > 0 ? Math.round((totalPassed / totalCount) * 1000) / 10 : 0,
    };
  }

  return { rows: rows.sort((a, b) => a.stage.localeCompare(b.stage) || a.interviewer.localeCompare(b.interviewer)), stageAverages };
}

export interface MonthlyTrendPoint {
  month: string; // YYYY-MM
  applicants: number;
}

/** 月別応募数推移 */
export function buildMonthlyTrend(applicants: Applicant[]): MonthlyTrendPoint[] {
  const counts = new Map<string, number>();
  for (const a of applicants) {
    if (!a.appliedDate) continue;
    const month = a.appliedDate.slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, applicants]) => ({ month, applicants }));
}

export interface PipelineStagePoint {
  stage: Stage;
  count: number;
  transitionRate: number | null; // 直前ステージからの遷移率(%)
  overallRate: number; // 応募者数に対する到達率(%)
}

export interface CasualInterviewStat {
  count: number;
  rateOfScreening: number; // 書類選考通過者に対する実施率(%)
}

export interface PositionPipeline {
  position: string;
  totalApplicants: number;
  stages: PipelineStagePoint[];
  casualInterview: CasualInterviewStat;
}

/** ポジション別の応募〜内定承諾パイプライン(各ステージの人数・遷移率・全体到達率)。カジュアル面談は別集計。 */
export function buildPositionPipelines(applicants: Applicant[]): PositionPipeline[] {
  const positions = getPositions(applicants);
  return positions.map((position) => {
    const rows = applicants.filter((a) => a.position === position);
    const totalApplicants = rows.length;
    let prevCount: number | null = null;
    const stages: PipelineStagePoint[] = MAIN_PIPELINE_STAGES.map((stage) => {
      const count = rows.filter((a) => a.stageDates[stage] !== null).length;
      const transitionRate =
        prevCount !== null ? (prevCount > 0 ? Math.round((count / prevCount) * 1000) / 10 : 0) : null;
      const overallRate = totalApplicants > 0 ? Math.round((count / totalApplicants) * 1000) / 10 : 0;
      prevCount = count;
      return { stage, count, transitionRate, overallRate };
    });

    const screeningCount = rows.filter((a) => a.stageDates['書類選考'] !== null).length;
    const casualCount = rows.filter((a) => a.stageDates['カジュアル面談'] !== null).length;
    const casualInterview: CasualInterviewStat = {
      count: casualCount,
      rateOfScreening: screeningCount > 0 ? Math.round((casualCount / screeningCount) * 1000) / 10 : 0,
    };

    return { position, totalApplicants, stages, casualInterview };
  });
}

export interface FunnelForecast {
  requiredApply: number;
  requiredScreening: number;
  requiredInterview: number; // 面談設定(カジュアル面談/1次面接)の必要件数
  requiredFinal: number;
  requiredOffer: number;
  targetHireCount: number;
}

function toFraction(percent: number): number {
  return Math.max(percent, 0.01) / 100;
}

/** 目標採用人数と各区間の遷移率から、逆算で各ステージに必要な件数を算出する */
export function computeFunnelForecast(config: HealthScoreConfig): FunnelForecast {
  const { targetHireCount, rates } = config;
  const requiredOffer = targetHireCount / toFraction(rates.offerToAccept);
  const requiredFinal = requiredOffer / toFraction(rates.finalToOffer);
  const requiredInterview = requiredFinal / toFraction(rates.interviewToFinal);
  const requiredScreening = requiredInterview / toFraction(rates.screeningToInterview);
  const requiredApply = requiredScreening / toFraction(rates.applyToScreening);
  return {
    requiredApply: Math.ceil(requiredApply),
    requiredScreening: Math.ceil(requiredScreening),
    requiredInterview: Math.ceil(requiredInterview),
    requiredFinal: Math.ceil(requiredFinal),
    requiredOffer: Math.ceil(requiredOffer),
    targetHireCount,
  };
}

export interface HealthScoreResult {
  actualCount: number;
  targetCount: number; // 逆算された面談設定の必要件数
  elapsedPercent: number; // 期間の経過率(%)
  expectedByNow: number;
  achievementRate: number | null; // expectedByNowに対する達成率(%)。目標未設定/期間未指定ならnull
  signal: SignalColor;
  periodDefined: boolean; // 開始日・終了日が両方指定されているか
  forecast: FunnelForecast;
}

/**
 * 「1次面接 or カジュアル面談 設定率」ヘルススコア。
 * 目標採用人数・期間・各区間の遷移率から逆算した「期間内に必要な面談設定件数」を目標とし、
 * 経過日数に応じたペースに対する実際の設定件数の達成率を信号で示す。
 */
export function buildHealthScore(
  applicants: Applicant[],
  config: HealthScoreConfig,
  today: Date = new Date()
): HealthScoreResult {
  const periodDefined = Boolean(config.periodStart && config.periodEnd);
  const periodApplicants = periodDefined
    ? filterByPeriod(applicants, { start: config.periodStart, end: config.periodEnd })
    : applicants;

  const actualCount = periodApplicants.filter(
    (a) => a.stageDates['カジュアル面談'] !== null || a.stageDates['1次面接'] !== null
  ).length;

  const forecast = computeFunnelForecast(config);
  const targetCount = forecast.requiredInterview;

  let elapsedPercent = 0;
  if (config.periodStart && config.periodEnd) {
    const startMs = new Date(config.periodStart).getTime();
    const endMs = new Date(config.periodEnd).getTime();
    const nowMs = today.getTime();
    if (endMs > startMs) {
      elapsedPercent = Math.round(
        (Math.min(Math.max(nowMs - startMs, 0), endMs - startMs) / (endMs - startMs)) * 1000
      ) / 10;
    }
  }

  const expectedByNow = periodDefined ? Math.round(targetCount * (elapsedPercent / 100) * 10) / 10 : 0;
  const achievementRate =
    periodDefined && targetCount > 0
      ? expectedByNow > 0
        ? Math.round((actualCount / expectedByNow) * 1000) / 10
        : 100
      : null;

  let signal: SignalColor = 'green';
  if (achievementRate === null) {
    signal = 'green';
  } else if (achievementRate < config.redBelowPercent) {
    signal = 'red';
  } else if (achievementRate < config.yellowBelowPercent) {
    signal = 'yellow';
  }

  return {
    periodDefined,
    actualCount,
    targetCount,
    elapsedPercent,
    expectedByNow,
    achievementRate,
    signal,
    forecast,
  };
}
