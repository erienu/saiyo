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
