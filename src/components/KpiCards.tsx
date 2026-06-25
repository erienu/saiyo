interface Kpi {
  label: string;
  value: string;
  sub?: string;
}

export default function KpiCards({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">{k.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{k.value}</p>
          {k.sub && <p className="mt-0.5 text-xs text-slate-400">{k.sub}</p>}
        </div>
      ))}
    </div>
  );
}
