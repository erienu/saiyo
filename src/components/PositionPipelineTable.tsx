import type { PositionPipeline } from '../lib/metrics';

export default function PositionPipelineTable({ data }: { data: PositionPipeline[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">データがありません。</p>;
  }

  const stageNames = data[0].stages.map((s) => s.stage);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500">
            <th className="py-2 pr-4">ポジション</th>
            {stageNames.map((stage) => (
              <th key={stage} className="py-2 pr-4 text-right">
                {stage}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.position} className="border-b border-slate-100 align-top">
              <td className="py-2 pr-4 font-medium text-slate-700">
                {p.position}
                <p className="text-xs font-normal text-slate-400">応募 {p.totalApplicants} 件</p>
              </td>
              {p.stages.map((s) => (
                <td key={s.stage} className="py-2 pr-4 text-right">
                  <div className="font-medium text-slate-700">{s.count}件</div>
                  <div className="text-xs text-slate-400">
                    {s.transitionRate === null ? '—' : `遷移 ${s.transitionRate}%`}
                  </div>
                  <div className="text-xs text-slate-400">全体 {s.overallRate}%</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
