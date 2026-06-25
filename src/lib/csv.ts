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

const HRMOS_DATE_RE = /^(\d{4})年(\d{1,2})月(\d{1,2})日/;

function hrmosToIso(s: string | undefined): string {
  const t = (s ?? '').trim();
  if (!t) return '';
  const m = HRMOS_DATE_RE.exec(t);
  if (!m) return t;
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

const HRMOS_STATUS_MAP: Record<string, Status> = {
  入社: '内定承諾',
  内定: '進行中',
  選考中: '進行中',
  新着応募: '進行中',
  不合格: '離脱',
  辞退: '離脱',
  重複応募: '離脱',
};

const HRMOS_STEP_STAGE: Record<string, Stage> = {
  カジュアル面談: 'カジュアル面談',
  '1次面接': '1次面接',
  最終面接: '最終面接',
};

// HRMOS(採用管理システム)の生エクスポートを直接読み取る。
// 個人情報列(氏名相当・生年月日・性別・郵便番号・住所・レジュメ本文・学歴・職歴など)は
// 明示的にアクセスしないため、アプリ内に取り込まれない。
function hrmosRowToApplicant(row: Record<string, string>): Applicant | null {
  const id = (row['応募ID'] ?? '').trim();
  if (!id) return null;

  const appliedDate = hrmosToIso(row['応募日']);
  const senkoStatus = (row['選考ステータス'] ?? '').trim();
  const status: Status = HRMOS_STATUS_MAP[senkoStatus] ?? '進行中';

  const stageDates: Record<Stage, string | null> = {
    応募: emptyToNull(appliedDate),
    書類選考: emptyToNull(hrmosToIso(row['1次ステップ実施日'])),
    カジュアル面談: null,
    '1次面接': null,
    最終面接: null,
    内定: emptyToNull(hrmosToIso(row['内定日'])),
    内定承諾: emptyToNull(hrmosToIso(row['内定承諾日'])),
  };

  const interviews: InterviewRecord[] = [];
  for (let n = 2; n <= 10; n++) {
    const stepName = (row[`${n}次ステップ`] ?? '').trim();
    const stage = HRMOS_STEP_STAGE[stepName];
    if (!stage) continue;
    const date = emptyToNull(hrmosToIso(row[`${n}次ステップ実施日`]));
    const result = parseResult(row[`${n}次ステップステータス`]);
    stageDates[stage] = date;
    interviews.push({ stage, date, interviewer: null, score: null, result });
  }

  let currentStage: Stage = '応募';
  if (senkoStatus === '入社') currentStage = '内定承諾';
  else if (senkoStatus === '内定') currentStage = '内定';
  else {
    for (const s of STAGES) {
      if (stageDates[s]) currentStage = s;
    }
  }

  const isDropped = status === '離脱';
  const dropoutDateRaw = row['辞退日'] || row['不合格・重複終了日'];
  const reasonCategory = (row['辞退理由（分類）'] ?? '').trim();
  const reasonDetail = (row['辞退理由（詳細）'] ?? '').trim();
  const dropoutReason = reasonCategory
    ? reasonDetail
      ? `${reasonCategory}：${reasonDetail}`
      : reasonCategory
    : null;

  return {
    id,
    position: emptyToNull(row['選考ポジション名']) ?? '未分類',
    appliedDate,
    channel: emptyToNull(row['応募経路']) ?? '不明',
    cost: 0,
    currentStage,
    status,
    dropoutDate: isDropped ? emptyToNull(hrmosToIso(dropoutDateRaw)) : null,
    dropoutReason: isDropped ? dropoutReason : null,
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

  const fields = result.meta.fields ?? [];
  const isHrmosExport = fields.includes('応募ID') && fields.includes('選考ステータス');

  const applicants = isHrmosExport
    ? result.data
        .map(hrmosRowToApplicant)
        .filter((a): a is Applicant => a !== null)
    : result.data
        .filter((row) => row['応募者ID'] && row['応募者ID'].trim() !== '')
        .map(rowToApplicant);

  return { applicants, errors };
}
