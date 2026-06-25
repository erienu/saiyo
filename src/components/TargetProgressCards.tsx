import type { TargetProgress } from '../lib/metrics';

export default function TargetProgressCards({ data }: { data: TargetProgress[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">目標数を設定すると達成率が表示されます。</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
  );
}
