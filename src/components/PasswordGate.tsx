import { useState } from 'react';

interface Props {
  onSubmit: (password: string) => Promise<void>;
  error: string | null;
  checking: boolean;
}

export default function PasswordGate({ onSubmit, error, checking }: Props) {
  const [value, setValue] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value) onSubmit(value);
        }}
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-base font-bold text-slate-900">採用ダッシュボード</h1>
        <p className="mt-1 text-xs text-slate-500">
          このダッシュボードはパスワードで保護されています。他のPC・スマホでも同じパスワードで閲覧・編集できます。
        </p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          placeholder="パスワード"
          className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={checking || !value}
          className="mt-4 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {checking ? '確認中…' : '開く'}
        </button>
      </form>
    </div>
  );
}
