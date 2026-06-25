import type { InterviewerStat } from '../lib/metrics';

interface Props {
  rows: InterviewerStat[];
  stageAverages: Record<string, { avgScore: number | null; passRate: number }>;
}

function Tendency({ row, stageAverages }: { row: InterviewerStat; stageAverages: Props['stageAverages'] }) {
  const avg = stageAverages[row.stage];
  if (!avg || avg.avgScore === null || row.avgScore === null) return <span className="text-slate-400">—</span>;
  const diff = Math.round((row.avgScore - avg.avgScore) * 100) / 100;
  if (Math.abs(diff) < 0.3) return <span className="text-slate-500">標準</span>;
  if (diff > 0) return <span className="text-blue-600">甘め（+{diff}）</span>;
  return <span className="text-rose-600">辛め（{diff}）</span>;
}

export default function InterviewerTable({ rows, stageAverages }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">面接官の評価データがありません。</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500">
            <th className="py-2 pr-4">面接官</th>
            <th className="py-2 pr-4">ステージ</th>
            <th className="py-2 pr-4 text-right">面接数</th>
            <th className="py-2 pr-4 text-right">平均評価</th>
            <th className="py-2 pr-4 text-right">通過率</th>
            <th className="py-2 pr-4 text-right">ステージ平均比</th>
            <th className="py-2 pr-4">傾向</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.interviewer}-${r.stage}`} className="border-b border-slate-100">
              <td className="py-2 pr-4 font-medium text-slate-700">{r.interviewer}</td>
              <td className="py-2 pr-4">{r.stage}</td>
              <td className="py-2 pr-4 text-right">{r.count}</td>
              <td className="py-2 pr-4 text-right">{r.avgScore ?? '—'}</td>
              <td className="py-2 pr-4 text-right">{r.passRate}%</td>
              <td className="py-2 pr-4 text-right text-slate-500">
                {stageAverages[r.stage]?.avgScore ?? '—'}
              </td>
              <td className="py-2 pr-4">
                <Tendency row={r} stageAverages={stageAverages} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
