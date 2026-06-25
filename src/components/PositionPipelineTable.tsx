import type { PositionPipeline } from '../lib/metrics';

export default function PositionPipelineTable({ data }: { data: PositionPipeline[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">データがありません。</p>;
  }

  return (
    <div className="space-y-6">
      {data.map((p) => (
        <div key={p.position}>
          <p className="mb-2 text-sm font-medium text-slate-700">
            {p.position}（応募 {p.totalApplicants} 件）
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-4">ステージ</th>
                  <th className="py-2 pr-4 text-right">人数</th>
                  <th className="py-2 pr-4 text-right">直前ステージからの遷移率</th>
                  <th className="py-2 pr-4 text-right">応募者全体に対する到達率</th>
                </tr>
              </thead>
              <tbody>
                {p.stages.map((s) => (
                  <tr key={s.stage} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-700">{s.stage}</td>
                    <td className="py-2 pr-4 text-right">{s.count}</td>
                    <td className="py-2 pr-4 text-right">
                      {s.transitionRate === null ? '—' : `${s.transitionRate}%`}
                    </td>
                    <td className="py-2 pr-4 text-right text-slate-500">{s.overallRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
