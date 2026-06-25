import { useState } from 'react';
import { computeFunnelForecast } from '../lib/metrics';
import type { HealthScoreConfig, PipelineRates } from '../types';

interface Props {
  config: HealthScoreConfig;
  onChange: (config: HealthScoreConfig) => void;
}

const RATE_FIELDS: { key: keyof PipelineRates; label: string }[] = [
  { key: 'applyToScreening', label: '応募 → 書類選考' },
  { key: 'screeningToInterview', label: '書類選考 → 面談設定（カジュアル面談/1次面接）' },
  { key: 'interviewToFinal', label: '面談設定 → 最終面接' },
  { key: 'finalToOffer', label: '最終面接 → 内定' },
  { key: 'offerToAccept', label: '内定 → 内定承諾' },
];

export default function KpiSettings({ config, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const forecast = computeFunnelForecast(config);

  const updateRate = (key: keyof PipelineRates, value: number) => {
    onChange({ ...config, rates: { ...config.rates, [key]: value } });
  };

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
        <div className="mt-3 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1 text-xs text-slate-500">
              目標採用人数
              <input
                type="number"
                min={0}
                value={config.targetHireCount}
                onChange={(e) => onChange({ ...config, targetHireCount: Number(e.target.value) || 0 })}
                className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
              />
              人
            </label>
            <label className="flex items-center gap-1 text-xs text-slate-500">
              期間
              <input
                type="date"
                value={config.periodStart ?? ''}
                onChange={(e) => onChange({ ...config, periodStart: e.target.value || null })}
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              />
              〜
              <input
                type="date"
                value={config.periodEnd ?? ''}
                onChange={(e) => onChange({ ...config, periodEnd: e.target.value || null })}
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">各パイプラインの遷移率（%）</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {RATE_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{f.label}</span>
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={config.rates[f.key]}
                      onChange={(e) => updateRate(f.key, Number(e.target.value) || 0)}
                      className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                    %
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
            <label className="flex items-center gap-1 text-xs text-slate-500">
              赤信号(未満)
              <input
                type="number"
                min={0}
                max={100}
                value={config.redBelowPercent}
                onChange={(e) => onChange({ ...config, redBelowPercent: Number(e.target.value) || 0 })}
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
                onChange={(e) => onChange({ ...config, yellowBelowPercent: Number(e.target.value) || 0 })}
                className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
              />
              %（これ以上は緑信号）
            </label>
          </div>

          <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            <p className="mb-1 font-medium">逆算された必要件数（自動計算）</p>
            <p>
              応募 {forecast.requiredApply}件 → 書類選考 {forecast.requiredScreening}件 → 面談設定{' '}
              <span className="font-semibold text-slate-900">{forecast.requiredInterview}件</span> →
              最終面接 {forecast.requiredFinal}件 → 内定 {forecast.requiredOffer}件 → 内定承諾{' '}
              {forecast.targetHireCount}件
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
