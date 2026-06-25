import type { ChannelStat } from '../lib/metrics';

export default function ChannelTable({ data }: { data: ChannelStat[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">データがありません。</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500">
            <th className="py-2 pr-4">チャネル</th>
            <th className="py-2 pr-4 text-right">応募数</th>
            <th className="py-2 pr-4 text-right">採用数</th>
            <th className="py-2 pr-4 text-right">通過率</th>
            <th className="py-2 pr-4 text-right">コスト合計</th>
            <th className="py-2 pr-4 text-right">採用単価</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.channel} className="border-b border-slate-100">
              <td className="py-2 pr-4 font-medium text-slate-700">{c.channel}</td>
              <td className="py-2 pr-4 text-right">{c.applicants}</td>
              <td className="py-2 pr-4 text-right">{c.hired}</td>
              <td className="py-2 pr-4 text-right">{c.conversionRate}%</td>
              <td className="py-2 pr-4 text-right">¥{c.totalCost.toLocaleString()}</td>
              <td className="py-2 pr-4 text-right">
                {c.costPerHire !== null ? `¥${c.costPerHire.toLocaleString()}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
