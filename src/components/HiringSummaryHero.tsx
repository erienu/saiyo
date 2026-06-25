import type { TargetProgress } from '../lib/metrics';

export default function HiringSummaryHero({ data }: { data: TargetProgress[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
        「採用目標数の設定」でポジションごとの目標人数を設定すると、実績と進捗率がここに表示されます。
      </div>
    );
  }

  const totalTarget = data.reduce((s, d) => s + d.targetCount, 0);
  const totalHired = data.reduce((s, d) => s + d.hiredCount, 0);
  const totalRate = totalTarget > 0 ? Math.round((totalHired / totalTarget) * 1000) / 10 : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((d) => (
          <div key={d.position} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{d.position}</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className="text-2xl font-bold text-slate-900">
                {d.hiredCount} <span className="text-sm font-normal text-slate-400">/ {d.targetCount} 人</span>
              </p>
              <p
                className={`text-2xl font-bold ${
                  d.achievementRate >= 100
                    ? 'text-emerald-600'
                    : d.achievementRate >= 70
                      ? 'text-blue-600'
                      : 'text-rose-600'
                }`}
              >
                {d.achievementRate}%
              </p>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${d.achievementRate >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(d.achievementRate, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-right text-xs text-slate-400">
        全ポジション合計：{totalHired} / {totalTarget} 人（{totalRate}%）
      </p>
    </div>
  );
}
