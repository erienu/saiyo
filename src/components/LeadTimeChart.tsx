import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LeadTimeStat } from '../lib/metrics';

export default function LeadTimeChart({ data }: { data: LeadTimeStat[] }) {
  const chartData = data.map((d) => ({
    label: `${d.fromStage}→${d.toStage}`,
    avgDays: d.avgDays ?? 0,
    sampleSize: d.sampleSize,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} unit="日" />
          <Tooltip
            formatter={(value, _name, props) => [
              `${value}日 (n=${props.payload.sampleSize})`,
              '平均リードタイム',
            ]}
          />
          <Bar dataKey="avgDays" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
