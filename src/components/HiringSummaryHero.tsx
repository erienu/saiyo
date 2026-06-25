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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-medium text-slate-500">全体 採用実績 / 計画</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {totalHired} <span className="text-base font-normal text-slate-400">/ {totalTarget} 人</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-slate-500">計画進捗率</p>
          <p
            className={`mt-1 text-3xl font-bold ${
              totalRate >= 100 ? 'text-emerald-600' : totalRate >= 70 ? 'text-blue-600' : 'text-rose-600'
            }`}
          >
            {totalRate}%
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((d) => (
          <div key={d.position} className="rounded-lg border border-slate-100 p-3">
            <p className="text-sm font-medium text-slate-700">{d.position}</p>
            <p className="mt-1 text-xs text-slate-500">
              {d.hiredCount} / {d.targetCount} 人
            </p>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${d.achievementRate >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(d.achievementRate, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs font-semibold text-slate-600">{d.achievementRate}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
