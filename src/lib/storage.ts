import type { HealthScoreConfig, PositionTarget } from '../types';

const TARGETS_KEY = 'recruitment-dashboard:targets';
const HEALTH_SCORE_CONFIG_KEY = 'recruitment-dashboard:health-score-config';

export const DEFAULT_HEALTH_SCORE_CONFIG: HealthScoreConfig = {
  intervalTargetCount: 10,
  redBelowPercent: 50,
  yellowBelowPercent: 80,
};

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

export function loadHealthScoreConfig(): HealthScoreConfig {
  try {
    const raw = localStorage.getItem(HEALTH_SCORE_CONFIG_KEY);
    return raw ? { ...DEFAULT_HEALTH_SCORE_CONFIG, ...JSON.parse(raw) } : DEFAULT_HEALTH_SCORE_CONFIG;
  } catch {
    return DEFAULT_HEALTH_SCORE_CONFIG;
  }
}

export function saveHealthScoreConfig(config: HealthScoreConfig): void {
  localStorage.setItem(HEALTH_SCORE_CONFIG_KEY, JSON.stringify(config));
}
