import type { HealthScoreResult } from '../lib/metrics';

const SIGNAL_STYLE: Record<HealthScoreResult['signal'], { bg: string; ring: string; label: string; emoji: string }> = {
  red: { bg: 'bg-rose-50', ring: 'ring-rose-300', label: '赤信号', emoji: '🔴' },
  yellow: { bg: 'bg-amber-50', ring: 'ring-amber-300', label: '黄信号', emoji: '🟡' },
  green: { bg: 'bg-emerald-50', ring: 'ring-emerald-300', label: '青信号', emoji: '🟢' },
};

export default function HealthScoreSignal({
  health,
  advice,
}: {
  health: HealthScoreResult;
  advice: string[];
}) {
  const style = health.periodDefined ? SIGNAL_STYLE[health.signal] : SIGNAL_STYLE.green;

  return (
    <div className={`rounded-xl border border-slate-200 p-4 shadow-sm ${style.bg} ring-1 ${style.ring}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{health.periodDefined ? style.emoji : '⚪'}</span>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              最重要ヘルススコア：1次面接・カジュアル面談 設定率
            </p>
            <p className="text-xs text-slate-500">
              {health.periodDefined
                ? `${style.label}・逆算目標${health.targetCount}件中、経過${health.elapsedPercent}%時点でのペース目標${health.expectedByNow}件に対し${health.actualCount}件設定済み`
                : 'KPI設定で目標採用人数と期間を指定するとペースに対する達成率が表示されます。'}
            </p>
          </div>
        </div>
        <p className="text-3xl font-bold text-slate-900">
          {health.achievementRate === null ? '—' : `${health.achievementRate}%`}
        </p>
      </div>
      {advice.length > 0 && (
        <div className="mt-3 rounded-md bg-white/70 p-3">
          <p className="mb-1 text-xs font-semibold text-slate-600">推奨アクション(自動生成)</p>
          <ul className="ml-4 list-disc space-y-1 text-xs text-slate-600">
            {advice.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
