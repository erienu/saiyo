import { useState } from 'react';
import type { PositionTarget } from '../types';

interface Props {
  positions: string[];
  targets: PositionTarget[];
  onChange: (targets: PositionTarget[]) => void;
  defaultOpen?: boolean;
}

export default function TargetSettings({ positions, targets, onChange, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const targetFor = (position: string) =>
    targets.find((t) => t.position === position) ?? { position, targetCount: 0, period: '' };

  const updateTarget = (position: string, patch: Partial<PositionTarget>) => {
    const existing = targets.find((t) => t.position === position);
    const next = existing
      ? targets.map((t) => (t.position === position ? { ...t, ...patch } : t))
      : [...targets, { position, targetCount: 0, period: '', ...patch }];
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-slate-700"
      >
        <span>採用目標数の設定</span>
        <span className="text-xs text-slate-400">{open ? '閉じる' : '開く'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {positions.length === 0 && (
            <p className="text-xs text-slate-400">先にCSVを読み込むとポジション一覧が表示されます。</p>
          )}
          {positions.map((p) => {
            const t = targetFor(p);
            return (
              <div key={p} className="flex flex-wrap items-center gap-3 rounded-md border border-slate-100 p-2">
                <span className="min-w-[10rem] text-sm font-medium text-slate-700">{p}</span>
                <label className="flex items-center gap-1 text-xs text-slate-500">
                  目標人数
                  <input
                    type="number"
                    min={0}
                    value={t.targetCount}
                    onChange={(e) => updateTarget(p, { targetCount: Number(e.target.value) || 0 })}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-slate-500">
                  期間
                  <input
                    type="text"
                    placeholder="例: 2026年度上期"
                    value={t.period}
                    onChange={(e) => updateTarget(p, { period: e.target.value })}
                    className="w-40 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
