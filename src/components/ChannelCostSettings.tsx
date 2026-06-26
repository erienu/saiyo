import { useState } from 'react';
import NumberInput from './NumberInput';

interface Props {
  channels: string[];
  costs: Record<string, number>;
  onChange: (costs: Record<string, number>) => void;
  defaultOpen?: boolean;
}

export default function ChannelCostSettings({ channels, costs, onChange, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const updateCost = (channel: string, value: number) => {
    onChange({ ...costs, [channel]: value });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-slate-700"
      >
        <span>チャネル別コストの設定（概算）</span>
        <span className="text-xs text-slate-400">{open ? '閉じる' : '開く'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-slate-400">
            CSVにコスト情報がない場合、チャネルごとの概算費用（媒体費・エージェント費用など合計）を入力すると採用単価が計算されます。
          </p>
          {channels.length === 0 && (
            <p className="text-xs text-slate-400">先にCSVを読み込むとチャネル一覧が表示されます。</p>
          )}
          {channels.map((channel) => (
            <div key={channel} className="flex flex-wrap items-center gap-3 rounded-md border border-slate-100 p-2">
              <span className="min-w-[10rem] text-sm font-medium text-slate-700">{channel}</span>
              <label className="flex items-center gap-1 text-xs text-slate-500">
                概算コスト
                <NumberInput
                  min={0}
                  value={costs[channel] ?? 0}
                  onChange={(n) => updateCost(channel, n)}
                  className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                />
                円
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
