import { useState } from 'react';
import type { HealthScoreConfig } from '../types';

interface Props {
  config: HealthScoreConfig;
  onChange: (config: HealthScoreConfig) => void;
}

export default function KpiSettings({ config, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-slate-700"
      >
        <span>KPI設定（面談設定率ヘルススコア）</span>
        <span className="text-xs text-slate-400">{open ? '閉じる' : '開く'}</span>
      </button>
      {open && (
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1 text-xs text-slate-500">
            期間内の面談設定目標数
            <input
              type="number"
              min={0}
              value={config.intervalTargetCount}
              onChange={(e) =>
                onChange({ ...config, intervalTargetCount: Number(e.target.value) || 0 })
              }
              className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
            />
            件
          </label>
          <label className="flex items-center gap-1 text-xs text-slate-500">
            赤信号(未満)
            <input
              type="number"
              min={0}
              max={100}
              value={config.redBelowPercent}
              onChange={(e) =>
                onChange({ ...config, redBelowPercent: Number(e.target.value) || 0 })
              }
              className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
            />
            %
          </label>
          <label className="flex items-center gap-1 text-xs text-slate-500">
            黄信号(未満)
            <input
              type="number"
              min={0}
              max={100}
              value={config.yellowBelowPercent}
              onChange={(e) =>
                onChange({ ...config, yellowBelowPercent: Number(e.target.value) || 0 })
              }
              className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
            />
            %（これ以上は緑信号）
          </label>
        </div>
      )}
    </div>
  );
}
