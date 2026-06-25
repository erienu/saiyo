import type { DateRange } from '../types';

interface Props {
  range: DateRange;
  onChange: (range: DateRange) => void;
}

// タイムゾーンによる日付のズレを避けるため、UTC変換せずローカル日付からYYYY-MM-DDを作る。
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function currentMonthRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: isoDate(start), end: isoDate(end) };
}

function last30DaysRange(): DateRange {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  return { start: isoDate(start), end: isoDate(now) };
}

export default function PeriodFilter({ range, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="text-xs font-medium text-slate-500">期間(応募日基準):</span>
      <input
        type="date"
        value={range.start ?? ''}
        onChange={(e) => onChange({ ...range, start: e.target.value || null })}
        className="rounded border border-slate-300 px-2 py-1 text-xs"
      />
      <span className="text-xs text-slate-400">〜</span>
      <input
        type="date"
        value={range.end ?? ''}
        onChange={(e) => onChange({ ...range, end: e.target.value || null })}
        className="rounded border border-slate-300 px-2 py-1 text-xs"
      />
      <button
        onClick={() => onChange(currentMonthRange())}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
      >
        今月
      </button>
      <button
        onClick={() => onChange(last30DaysRange())}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
      >
        過去30日
      </button>
      <button
        onClick={() => onChange({ start: null, end: null })}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
      >
        全期間
      </button>
    </div>
  );
}

export { currentMonthRange };
