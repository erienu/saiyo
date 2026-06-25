import type { Applicant, HealthScoreConfig, PositionTarget } from '../types';

const TARGETS_KEY = 'recruitment-dashboard:targets';
const HEALTH_SCORE_CONFIGS_KEY = 'recruitment-dashboard:health-score-configs-by-position';
const APPLICANTS_KEY = 'recruitment-dashboard:applicants';
const CHANNEL_COSTS_KEY = 'recruitment-dashboard:channel-costs';

// タイムゾーンによる日付のズレを避けるため、UTC変換せずローカル日付からYYYY-MM-DDを作る。
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function currentMonthIsoRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: isoDate(start), end: isoDate(end) };
}

export function getDefaultHealthScoreConfig(): HealthScoreConfig {
  const { start, end } = currentMonthIsoRange();
  return {
    targetHireCount: 5,
    periodStart: start,
    periodEnd: end,
    rates: {
      applyToScreening: 70,
      screeningToInterview: 50,
      interviewToFinal: 70,
      finalToOffer: 80,
      offerToAccept: 90,
    },
    redBelowPercent: 50,
    yellowBelowPercent: 80,
  };
}

export function loadTargets(): PositionTarget[] {
  try {
    const raw = localStorage.getItem(TARGETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTargets(targets: PositionTarget[]): void {
  localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
}

export type HealthScoreConfigsByPosition = Record<string, HealthScoreConfig>;

/** ポジション別のKPI設定一式を読み込む。 */
export function loadHealthScoreConfigs(): HealthScoreConfigsByPosition {
  try {
    const raw = localStorage.getItem(HEALTH_SCORE_CONFIGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveHealthScoreConfigs(configs: HealthScoreConfigsByPosition): void {
  localStorage.setItem(HEALTH_SCORE_CONFIGS_KEY, JSON.stringify(configs));
}

/** 指定ポジションの設定を返す。未設定の場合はデフォルト値。 */
export function getHealthScoreConfigForPosition(
  configs: HealthScoreConfigsByPosition,
  position: string
): HealthScoreConfig {
  const fallback = getDefaultHealthScoreConfig();
  const saved = configs[position];
  if (!saved) return fallback;
  return { ...fallback, ...saved, rates: { ...fallback.rates, ...saved.rates } };
}

// 取り込んだ応募者データもブラウザのlocalStorageに保存し、再読み込み後も表示されるようにする。
// 氏名・生年月日・住所などの個人情報はApplicant型に存在しないため、保存対象にも含まれない。
export function loadApplicants(): Applicant[] {
  try {
    const raw = localStorage.getItem(APPLICANTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveApplicants(applicants: Applicant[]): void {
  try {
    localStorage.setItem(APPLICANTS_KEY, JSON.stringify(applicants));
  } catch {
    // ストレージ容量超過などは無視し、画面表示自体は継続させる。
  }
}

export function clearApplicants(): void {
  localStorage.removeItem(APPLICANTS_KEY);
}

// チャネル別の概算コスト(手入力)。CSVにコスト列がない場合の採用単価計算に使う。
export function loadChannelCosts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CHANNEL_COSTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveChannelCosts(costs: Record<string, number>): void {
  localStorage.setItem(CHANNEL_COSTS_KEY, JSON.stringify(costs));
}
