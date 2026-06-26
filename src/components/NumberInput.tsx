import { useEffect, useState } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

// 数値inputは「空にして打ち直す」操作をさせると、毎打鍵ごとに0へ強制変換されて
// 入力しづらくなるため、未確定の入力中文字列をローカルで保持しつつ、
// 有効な数値が確定した時だけ親へ反映する。
export default function NumberInput({ value, onChange, min, max, className }: Props) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const n = Number(raw);
        if (raw !== '' && Number.isFinite(n)) {
          onChange(n);
        }
      }}
      onBlur={() => {
        const n = Number(text);
        if (text === '' || !Number.isFinite(n)) {
          setText(String(value));
          return;
        }
        const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
        if (clamped !== n) onChange(clamped);
        setText(String(clamped));
      }}
      className={className ?? 'w-20 rounded border border-slate-300 px-2 py-1 text-sm'}
    />
  );
}
