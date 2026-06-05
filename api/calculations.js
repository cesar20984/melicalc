import { ensureSchema, getSql, readJson, sendJson } from './db.js';

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const sql = getSql();

    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      const name = url.searchParams.get('name');

      if (name) {
        const rows = await sql`
          SELECT name, data, updated_at
          FROM melicalc_calculations
          WHERE name = ${name}
          LIMIT 1
        `;
        sendJson(res, rows[0] ? 200 : 404, rows[0] ?? { error: 'Not found' });
        return;
      }

      const rows = await sql`
        SELECT name, data, updated_at
        FROM melicalc_calculations
        ORDER BY name ASC
      `;
      sendJson(res, 200, rows);
      return;
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await readJson(req);
      const name = String(body.name ?? '').trim();

      if (!name) {
        sendJson(res, 400, { error: 'Name is required' });
        return;
      }

      const data = body.data ?? {};
      await sql`
        INSERT INTO melicalc_calculations (name, data, updated_at)
        VALUES (${name}, ${JSON.stringify(data)}::jsonb, NOW())
        ON CONFLICT (name)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `;

      sendJson(res, 200, { name, data });
      return;
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url, 'http://localhost');
      const name = url.searchParams.get('name');

      if (!name) {
        sendJson(res, 400, { error: 'Name is required' });
        return;
      }

      await sql`
        DELETE FROM melicalc_calculations
        WHERE name = ${name}
      `;
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}
