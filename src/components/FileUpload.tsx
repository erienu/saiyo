import { useRef } from 'react';

interface Props {
  onLoad: (text: string) => void;
  onClear: () => void;
  errors: string[];
  count: number;
}

export default function FileUpload({ onLoad, onClear, errors, count }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer);
      let encoding = 'utf-8';
      let offset = 0;
      if (bytes[0] === 0xff && bytes[1] === 0xfe) {
        encoding = 'utf-16le';
        offset = 2;
      } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
        encoding = 'utf-16be';
        offset = 2;
      } else if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
        offset = 3;
      }
      const text = new TextDecoder(encoding).decode(bytes.slice(offset));
      onLoad(text);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">応募者データ（CSV）</h2>
          <p className="text-xs text-slate-500">
            このダッシュボード用CSV、またはHRMOSの応募者情報エクスポートをそのまま取り込めます。
            読み込んだデータはこのブラウザに保存され、次回アクセス時も表示されます。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/sample-applicants.csv"
            download
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            サンプルCSVを見る
          </a>
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
          >
            CSVを読み込む
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          {count > 0 && (
            <button
              onClick={() => {
                if (window.confirm('保存されている応募者データを削除しますか？この操作は取り消せません。')) {
                  onClear();
                }
              }}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
            >
              データを削除
            </button>
          )}
        </div>
      </div>
      {count > 0 && (
        <p className="text-xs text-emerald-600">{count}件の応募者データを読み込みました。（ブラウザに保存済み）</p>
      )}
      {errors.length > 0 && (
        <div className="rounded-md bg-amber-50 p-2 text-xs text-amber-700">
          <p className="font-medium">警告:</p>
          <ul className="ml-4 list-disc">
            {errors.slice(0, 5).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
