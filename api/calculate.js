import { calculate } from './calc-core.js';
import { readJson, sendJson } from './db.js';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function valueFromParams(params, key) {
  return params.has(key) ? params.get(key) : undefined;
}

function parseBoolean(value) {
  if (value === undefined) return undefined;
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function inputFromQuery(req) {
  const url = new URL(req.url, 'http://localhost');
  const params = url.searchParams;

  return {
    productGross: valueFromParams(params, 'productGross'),
    includeShipping: parseBoolean(valueFromParams(params, 'includeShipping')),
    shippingGross: valueFromParams(params, 'shippingGross'),
    packagingCost: valueFromParams(params, 'packagingCost'),
    marginMode: valueFromParams(params, 'marginMode'),
    profitPercent: valueFromParams(params, 'profitPercent'),
    profitAmount: valueFromParams(params, 'profitAmount'),
    manualFinalPrice: valueFromParams(params, 'manualFinalPrice'),
    finalPriceGross: valueFromParams(params, 'finalPriceGross'),
    mlRate: valueFromParams(params, 'mlRate')
  };
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (req.method === 'GET') {
      sendJson(res, 200, calculate(inputFromQuery(req)));
      return;
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      sendJson(res, 200, calculate(body));
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}
