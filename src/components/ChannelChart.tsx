import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ChannelStat } from '../lib/metrics';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

export default function ChannelChart({ data }: { data: ChannelStat[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">データがありません。</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="applicants"
            nameKey="channel"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
          >
            {data.map((entry, i) => (
              <Cell key={entry.channel} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, _name, props) => [`${value}件`, props.payload.channel]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
