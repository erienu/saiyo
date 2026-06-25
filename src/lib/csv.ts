import Papa from 'papaparse';
import type { Applicant, InterviewRecord, Stage, Status } from '../types';
import { STAGES } from '../types';

const STAGE_COLUMN_PREFIX: Record<Stage, string | null> = {
  応募: null,
  書類選考: '書類選考',
  カジュアル面談: 'カジュアル面談',
  '1次面接': '1次面接',
  最終面接: '最終面接',
  内定: '内定',
  内定承諾: '内定承諾',
};

function emptyToNull(v: string | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return t === '' ? null : t;
}

function parseScore(v: string | undefined): number | null {
  const s = emptyToNull(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseResult(v: string | undefined): '通過' | '不通過' | null {
  const s = emptyToNull(v);
  if (s === '通過' || s === '不通過') return s;
  return null;
}

// 氏名・生年月日・性別・住所・郵便番号・電話番号などの個人情報列がCSVに含まれていても、
// このパーサーは明示的に許可した項目しか読み取らないため、アプリ内に取り込まれない。
export function rowToApplicant(row: Record<string, string>): Applicant {
  const stageDates: Record<Stage, string | null> = {
    応募: emptyToNull(row['応募日']),
    書類選考: emptyToNull(row['書類選考_日付']),
    カジュアル面談: emptyToNull(row['カジュアル面談_日付']),
    '1次面接': emptyToNull(row['1次面接_日付']),
    最終面接: emptyToNull(row['最終面接_日付']),
    内定: emptyToNull(row['内定_日付']),
    内定承諾: emptyToNull(row['内定承諾_日付']),
  };

  const interviews: InterviewRecord[] = (
    ['カジュアル面談', '1次面接', '最終面接'] as Stage[]
  )
    .map((stage) => {
      const prefix = STAGE_COLUMN_PREFIX[stage]!;
      return {
        stage,
        date: emptyToNull(row[`${prefix}_日付`]),
        interviewer: emptyToNull(row[`${prefix}_面接官`]),
        score: parseScore(row[`${prefix}_評価`]),
        result: parseResult(row[`${prefix}_結果`]),
      };
    })
    .filter((iv) => iv.date || iv.interviewer || iv.score !== null);

  const status = (emptyToNull(row['ステータス']) ?? '進行中') as Status;
  const currentStage = (emptyToNull(row['現在ステージ']) ?? '応募') as Stage;

  return {
    id: row['応募者ID']?.trim() ?? '',
    position: emptyToNull(row['ポジション']) ?? '未分類',
    appliedDate: emptyToNull(row['応募日']) ?? '',
    channel: emptyToNull(row['チャネル']) ?? '不明',
    cost: Number(row['コスト']) || 0,
    currentStage: STAGES.includes(currentStage) ? currentStage : '応募',
    status,
    dropoutDate: emptyToNull(row['離脱日']),
    dropoutReason: emptyToNull(row['離脱理由']),
    stageDates,
    interviews,
  };
}

export function parseApplicantsCsv(
  text: string
): { applicants: Applicant[]; errors: string[] } {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const errors = result.errors.map(
    (e) => `行${e.row ?? '?'}: ${e.message}`
  );

  const applicants = result.data
    .filter((row) => row['応募者ID'] && row['応募者ID'].trim() !== '')
    .map(rowToApplicant);

  return { applicants, errors };
}
