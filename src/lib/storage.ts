import type { PositionTarget } from '../types';

const TARGETS_KEY = 'recruitment-dashboard:targets';

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
