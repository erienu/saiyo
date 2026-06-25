export const STAGES = [
  '応募',
  '書類選考',
  'カジュアル面談',
  '1次面接',
  '最終面接',
  '内定',
  '内定承諾',
] as const;

export type Stage = (typeof STAGES)[number];

export type Status = '進行中' | '内定承諾' | '離脱';

export interface InterviewRecord {
  stage: Stage;
  date: string | null;
  interviewer: string | null;
  score: number | null; // 1-5
  result: '通過' | '不通過' | null;
}

// 個人情報(氏名・生年月日・住所・性別・電話番号など)は意図的に取り込まない。
// CSVにこれらの列があってもパース時に無視される。
export interface Applicant {
  id: string;
  position: string;
  appliedDate: string;
  channel: string;
  cost: number;
  currentStage: Stage;
  status: Status;
  dropoutDate: string | null;
  dropoutReason: string | null;
  stageDates: Record<Stage, string | null>;
  interviews: InterviewRecord[];
}

export interface PositionTarget {
  position: string;
  targetCount: number;
  period: string;
}

export interface DateRange {
  start: string | null; // YYYY-MM-DD
  end: string | null; // YYYY-MM-DD
}

// 採用ファネル各区間の遷移率(%)。カジュアル面談・1次面接は「面談設定」として1区間にまとめる。
export interface PipelineRates {
  applyToScreening: number; // 応募 → 書類選考
  screeningToInterview: number; // 書類選考 → 面談設定(カジュアル面談/1次面接)
  interviewToFinal: number; // 面談設定 → 最終面接
  finalToOffer: number; // 最終面接 → 内定
  offerToAccept: number; // 内定 → 内定承諾
}

// 「1次面接 or カジュアル面談 設定率」ヘルススコアのKPI設定。
// 目標採用人数・期間・各区間の遷移率から、期間内に設定すべき面談件数を逆算する。
export interface HealthScoreConfig {
  targetHireCount: number;
  periodStart: string | null; // YYYY-MM-DD
  periodEnd: string | null; // YYYY-MM-DD
  rates: PipelineRates;
  redBelowPercent: number; // この%未満は赤
  yellowBelowPercent: number; // この%未満(赤以上)は黄、以上は緑
}

export type SignalColor = 'red' | 'yellow' | 'green';
