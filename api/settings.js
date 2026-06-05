import { ensureSchema, getSql, readJson, sendJson } from './db.js';

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const sql = getSql();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT value
        FROM melicalc_settings
        WHERE key = 'defaults'
        LIMIT 1
      `;
      sendJson(res, 200, rows[0]?.value ?? null);
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readJson(req);
      const value = {
        shippingGross: body.shippingGross ?? '3500',
        packagingCost: body.packagingCost ?? '150'
      };

      await sql`
        INSERT INTO melicalc_settings (key, value, updated_at)
        VALUES ('defaults', ${JSON.stringify(value)}::jsonb, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;

      sendJson(res, 200, value);
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}
