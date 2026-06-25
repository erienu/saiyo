import { get, put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PATHNAME = 'dashboard-state.json';

function checkPassword(req: VercelRequest): boolean {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return false;
  const provided = req.headers['x-dashboard-password'];
  return typeof provided === 'string' && provided === expected;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.DASHBOARD_PASSWORD) {
    res.status(500).json({ error: 'DASHBOARD_PASSWORD is not configured on the server' });
    return;
  }

  if (!checkPassword(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const result = await get(PATHNAME, { access: 'private', useCache: false });
      if (!result || result.statusCode !== 200) {
        res.status(200).json({ data: null });
        return;
      }
      const text = await new Response(result.stream).text();
      res.status(200).json({ data: JSON.parse(text) });
    } catch {
      res.status(200).json({ data: null });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await put(PATHNAME, JSON.stringify(body), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'unknown error' });
    }
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
