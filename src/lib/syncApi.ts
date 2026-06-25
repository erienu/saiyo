// サーバー(Vercel Blob)とのデータ同期。パスワードはセッション中のみメモリに保持し、
// リクエストヘッダーで送るだけで、保存処理自体はパスワードをサーバーに永続化しない。

export interface DashboardState {
  applicants: unknown[];
  targets: unknown[];
  healthScoreConfigs: Record<string, unknown>;
}

export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized');
  }
}

export async function fetchDashboardState(password: string): Promise<DashboardState | null> {
  const res = await fetch('/api/data', {
    headers: { 'x-dashboard-password': password },
  });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new Error(`サーバーエラー(${res.status})`);
  const json = await res.json();
  return (json.data as DashboardState) ?? null;
}

export async function saveDashboardState(password: string, state: DashboardState): Promise<void> {
  const res = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-dashboard-password': password },
    body: JSON.stringify(state),
  });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new Error(`サーバーエラー(${res.status})`);
}
