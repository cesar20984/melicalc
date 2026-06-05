const MELICALC_BASE = 'https://melicalc-xi.vercel.app/';

const els = {
  siteBadge: document.getElementById('siteBadge'),
  extractBtn: document.getElementById('extractBtn'),
  clearWorkBtn: document.getElementById('clearWorkBtn'),
  openaiApiKey: document.getElementById('openaiApiKey'),
  openaiModel: document.getElementById('openaiModel'),
  seaM3Price: document.getElementById('seaM3Price'),
  adValoremPercent: document.getElementById('adValoremPercent'),
  handlingFee: document.getElementById('handlingFee'),
  dhlRateKg: document.getElementById('dhlRateKg'),
  upsRateKg: document.getElementById('upsRateKg'),
  fedexRateKg: document.getElementById('fedexRateKg'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  productPrice: document.getElementById('productPrice'),
  currency: document.getElementById('currency'),
  usdToClp: document.getElementById('usdToClp'),
  refreshDollarBtn: document.getElementById('refreshDollarBtn'),
  quantity: document.getElementById('quantity'),
  weightKg: document.getElementById('weightKg'),
  lengthCm: document.getElementById('lengthCm'),
  widthCm: document.getElementById('widthCm'),
  heightCm: document.getElementById('heightCm'),
  shippingPanel: document.getElementById('shippingPanel'),
  unitCbm: document.getElementById('unitCbm'),
  unitsPerM3: document.getElementById('unitsPerM3'),
  seaTotal: document.getElementById('seaTotal'),
  airBest: document.getElementById('airBest'),
  airRows: document.getElementById('airRows'),
  calcSeaBtn: document.getElementById('calcSeaBtn'),
  calcAirBtn: document.getElementById('calcAirBtn'),
  calcNoShipBtn: document.getElementById('calcNoShipBtn'),
  status: document.getElementById('status'),
  llmNotes: document.getElementById('llmNotes')
};

let currentSiteType = 'other';
let lastTotals = {
  seaUnitExtra: 0,
  airBestUnitExtra: 0
};
let restoringState = false;
let saveWorkTimer;

function num(el, fallback = 0) {
  const value = Number(el.value);
  return Number.isFinite(value) ? value : fallback;
}

function money(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return '$' + Math.round(safe).toLocaleString('es-CL');
}

function setStatus(text) {
  els.status.textContent = text;
}

function getWorkState() {
  return {
    currentSiteType,
    lastTotals,
    llmNotes: els.llmNotes.textContent,
    productPrice: els.productPrice.value,
    currency: els.currency.value,
    quantity: els.quantity.value,
    weightKg: els.weightKg.value,
    lengthCm: els.lengthCm.value,
    widthCm: els.widthCm.value,
    heightCm: els.heightCm.value
  };
}

async function saveWorkStateNow() {
  if (restoringState) return;
  await chrome.storage.local.set({ workState: getWorkState() });
}

function scheduleSaveWorkState() {
  if (restoringState) return;
  clearTimeout(saveWorkTimer);
  saveWorkTimer = setTimeout(() => {
    saveWorkStateNow().catch(() => {});
  }, 250);
}

function applyWorkState(state) {
  if (!state) return false;
  restoringState = true;
  currentSiteType = state.currentSiteType || currentSiteType;
  lastTotals = state.lastTotals || lastTotals;
  els.siteBadge.textContent = currentSiteType.toUpperCase();
  els.llmNotes.textContent = state.llmNotes || '';
  els.productPrice.value = state.productPrice ?? els.productPrice.value;
  els.currency.value = state.currency ?? els.currency.value;
  els.quantity.value = state.quantity ?? els.quantity.value;
  els.weightKg.value = state.weightKg ?? els.weightKg.value;
  els.lengthCm.value = state.lengthCm ?? els.lengthCm.value;
  els.widthCm.value = state.widthCm ?? els.widthCm.value;
  els.heightCm.value = state.heightCm ?? els.heightCm.value;
  updateModeForSite();
  recalc();
  restoringState = false;
  return true;
}

async function loadWorkState() {
  const { workState } = await chrome.storage.local.get('workState');
  return applyWorkState(workState);
}

async function clearWorkState() {
  await chrome.storage.local.remove('workState');
  restoringState = true;
  currentSiteType = 'manual';
  lastTotals = { seaUnitExtra: 0, airBestUnitExtra: 0 };
  els.siteBadge.textContent = 'MANUAL';
  els.llmNotes.textContent = '';
  els.productPrice.value = '';
  els.currency.value = 'USD';
  els.quantity.value = '1';
  els.weightKg.value = '';
  els.lengthCm.value = '';
  els.widthCm.value = '';
  els.heightCm.value = '';
  updateModeForSite();
  recalc();
  restoringState = false;
  setStatus('Cuenta limpia.');
}

function detectSiteFromUrl(url) {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes('alibaba.')) return 'alibaba';
  if (host.includes('aliexpress.')) return 'aliexpress';
  return 'manual';
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function saveSettings() {
  const settings = {
    openaiApiKey: els.openaiApiKey.value,
    openaiModel: els.openaiModel.value || 'gpt-5.2',
    seaM3Price: els.seaM3Price.value,
    adValoremPercent: els.adValoremPercent.value,
    handlingFee: els.handlingFee.value,
    dhlRateKg: els.dhlRateKg.value,
    upsRateKg: els.upsRateKg.value,
    fedexRateKg: els.fedexRateKg.value,
    usdToClp: els.usdToClp.value
  };
  await chrome.storage.local.set({ settings });
  setStatus('Configuracion guardada.');
}

async function loadSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  els.openaiApiKey.value = settings.openaiApiKey || '';
  els.openaiModel.value = settings.openaiModel || 'gpt-5.2';
  els.seaM3Price.value = settings.seaM3Price || '0';
  els.adValoremPercent.value = settings.adValoremPercent || '6';
  els.handlingFee.value = settings.handlingFee || '0';
  els.dhlRateKg.value = settings.dhlRateKg || '0';
  els.upsRateKg.value = settings.upsRateKg || '0';
  els.fedexRateKg.value = settings.fedexRateKg || '0';
  els.usdToClp.value = settings.usdToClp || '950';
}

async function refreshDollarRate() {
  setStatus('Actualizando dolar...');
  const response = await fetch('https://mindicador.cl/api/dolar');
  const data = await response.json();
  const value = Number(data?.serie?.[0]?.valor);
  if (!Number.isFinite(value)) {
    throw new Error('No se pudo obtener el dolar.');
  }
  els.usdToClp.value = value.toFixed(2);
  await saveSettings();
  recalc();
  setStatus('Dolar actualizado: ' + value.toLocaleString('es-CL'));
}

async function scrapeCurrentPage() {
  const tab = await activeTab();
  currentSiteType = detectSiteFromUrl(tab.url);
  els.siteBadge.textContent = currentSiteType.toUpperCase();

  try {
    return await chrome.tabs.sendMessage(tab.id, { type: 'MELICALC_SCRAPE_PAGE' });
  } catch (error) {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    return await chrome.tabs.sendMessage(tab.id, { type: 'MELICALC_SCRAPE_PAGE' });
  }
}

function extractionSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['siteType', 'productTitle', 'unitPrice', 'currency', 'dimensionsCm', 'weightKg', 'notes', 'confidence'],
    properties: {
      siteType: { type: 'string', enum: ['alibaba', 'aliexpress', 'other'] },
      productTitle: { type: 'string' },
      unitPrice: { type: 'number' },
      currency: { type: 'string' },
      dimensionsCm: {
        type: 'object',
        additionalProperties: false,
        required: ['length', 'width', 'height'],
        properties: {
          length: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' }
        }
      },
      weightKg: { type: 'number' },
      notes: { type: 'string' },
      confidence: { type: 'number' }
    }
  };
}

function outputText(response) {
  if (response.output_text) return response.output_text;
  const parts = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) parts.push(content.text);
    }
  }
  return parts.join('\n');
}

async function extractWithOpenAI(page) {
  const key = els.openaiApiKey.value.trim();
  if (!key) throw new Error('Falta OpenAI API key.');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: els.openaiModel.value.trim() || 'gpt-5.2',
      input: [
        {
          role: 'system',
          content: 'Extrae datos de producto para importacion a Chile. Responde solo con el JSON del schema. Si no ves un dato, usa 0 o string vacio. Dimensiones siempre en centimetros y peso en kg.'
        },
        {
          role: 'user',
          content: JSON.stringify(page)
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'melicalc_product_extraction',
          strict: true,
          schema: extractionSchema()
        }
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI error');
  }
  return JSON.parse(outputText(data));
}

function applyExtraction(extracted) {
  currentSiteType = extracted.siteType || currentSiteType;
  els.siteBadge.textContent = currentSiteType.toUpperCase();
  els.productPrice.value = extracted.unitPrice || '';
  els.currency.value = extracted.currency || 'USD';
  els.lengthCm.value = extracted.dimensionsCm?.length || '';
  els.widthCm.value = extracted.dimensionsCm?.width || '';
  els.heightCm.value = extracted.dimensionsCm?.height || '';
  els.weightKg.value = extracted.weightKg || '';
  els.llmNotes.textContent = extracted.notes ? `LLM: ${extracted.notes}` : '';
  updateModeForSite();
  recalc();
  saveWorkStateNow().catch(() => {});
}

function productPriceClp() {
  const price = num(els.productPrice);
  const currency = els.currency.value.trim().toUpperCase();
  if (currency === 'CLP') return price;
  if (currency === 'USD' || currency === 'US') return price * num(els.usdToClp, 950);
  return price * num(els.usdToClp, 950);
}

function usdToClp(valueUsd) {
  return valueUsd * num(els.usdToClp, 950);
}

function importTotals(extraFreightClp) {
  const qty = Math.max(1, num(els.quantity, 1));
  const product = productPriceClp() * num(els.quantity, 1);
  const adValorem = (product + extraFreightClp) * (num(els.adValoremPercent, 6) / 100);
  const handling = usdToClp(num(els.handlingFee));
  const subtotal = product + extraFreightClp + adValorem + handling;
  const iva = subtotal * 0.19;
  const total = subtotal + iva;
  const extra = extraFreightClp + adValorem + handling + iva;
  return {
    total,
    extra,
    extraPerUnit: extra / qty
  };
}

function recalc() {
  const qty = Math.max(1, num(els.quantity, 1));
  const cbmUnit = (num(els.lengthCm) * num(els.widthCm) * num(els.heightCm)) / 1000000;
  const unitsM3 = cbmUnit > 0 ? Math.floor(1 / cbmUnit) : 0;
  const totalCbm = cbmUnit * qty;
  const totalKg = num(els.weightKg) * qty;

  const seaFreight = usdToClp(totalCbm * num(els.seaM3Price));
  const airRows = [
    { name: 'DHL', freight: usdToClp(totalKg * num(els.dhlRateKg)) },
    { name: 'UPS', freight: usdToClp(totalKg * num(els.upsRateKg)) },
    { name: 'FedEx', freight: usdToClp(totalKg * num(els.fedexRateKg)) }
  ].map((row) => ({ ...row, totals: importTotals(row.freight) }));

  const activeAir = airRows.filter((row) => row.freight > 0);
  const bestAir = activeAir.length ? activeAir.reduce((best, row) => row.totals.total < best.totals.total ? row : best) : null;
  const seaTotals = importTotals(seaFreight);

  lastTotals = {
    seaUnitExtra: seaTotals.extraPerUnit,
    airBestUnitExtra: bestAir?.totals.extraPerUnit || 0
  };

  els.unitCbm.textContent = cbmUnit ? cbmUnit.toFixed(4) : '0';
  els.unitsPerM3.textContent = unitsM3 ? String(unitsM3) : '0';
  els.seaTotal.textContent = money(seaTotals.total);
  els.airBest.textContent = bestAir ? `${bestAir.name} ${money(bestAir.totals.total)}` : '$0';
  els.airRows.innerHTML = airRows.map((row) => `<div><span>${row.name}</span><strong>${money(row.totals.total)}</strong></div>`).join('');
  scheduleSaveWorkState();
}

function updateModeForSite() {
  const isAliExpress = currentSiteType === 'aliexpress';
  els.shippingPanel.classList.toggle('hidden', isAliExpress);
  els.calcSeaBtn.classList.toggle('hidden', isAliExpress);
  els.calcAirBtn.classList.toggle('hidden', isAliExpress);
}

async function openCalculator(shippingGross, includeShipping) {
  await saveWorkStateNow();
  const params = new URLSearchParams({
    productGross: Math.round(productPriceClp()).toString(),
    includeShipping: includeShipping ? 'true' : 'false',
    shippingGross: Math.round(shippingGross).toString(),
    packagingCost: '150',
    profitPercent: '40',
    mlRate: '19'
  });
  await chrome.tabs.create({ url: `${MELICALC_BASE}?${params.toString()}` });
}

async function extractCurrent() {
  setStatus('Leyendo pagina...');
  const page = await scrapeCurrentPage();
  currentSiteType = page.siteType || currentSiteType;
  els.siteBadge.textContent = currentSiteType.toUpperCase();
  setStatus('Consultando OpenAI...');
  const extracted = await extractWithOpenAI(page);
  applyExtraction(extracted);
  await saveWorkStateNow();
  setStatus('Datos extraidos.');
}

async function init() {
  await loadSettings();
  await refreshDollarRate().catch(() => setStatus('Usando dolar guardado/manual.'));
  const tab = await activeTab();
  const restored = await loadWorkState();
  if (!restored) {
    currentSiteType = detectSiteFromUrl(tab.url);
    els.siteBadge.textContent = currentSiteType.toUpperCase();
    updateModeForSite();
    recalc();
  }
}

els.extractBtn.addEventListener('click', () => {
  extractCurrent().catch((error) => setStatus(error.message));
});

els.clearWorkBtn.addEventListener('click', () => {
  clearWorkState().catch((error) => setStatus(error.message));
});

els.saveSettingsBtn.addEventListener('click', () => {
  saveSettings().catch((error) => setStatus(error.message));
});

els.refreshDollarBtn.addEventListener('click', () => {
  refreshDollarRate().catch((error) => setStatus(error.message));
});

[
  els.productPrice,
  els.currency,
  els.usdToClp,
  els.quantity,
  els.weightKg,
  els.lengthCm,
  els.widthCm,
  els.heightCm,
  els.seaM3Price,
  els.adValoremPercent,
  els.handlingFee,
  els.dhlRateKg,
  els.upsRateKg,
  els.fedexRateKg
].forEach((el) => el.addEventListener('input', recalc));

els.calcSeaBtn.addEventListener('click', () => {
  openCalculator(lastTotals.seaUnitExtra, true).catch((error) => setStatus(error.message));
});
els.calcAirBtn.addEventListener('click', () => {
  openCalculator(lastTotals.airBestUnitExtra, true).catch((error) => setStatus(error.message));
});
els.calcNoShipBtn.addEventListener('click', async () => {
  await saveWorkStateNow();
  const aliExpressGross = currentSiteType === 'aliexpress' ? productPriceClp() * 1.19 : productPriceClp();
  const params = new URLSearchParams({
    productGross: Math.round(aliExpressGross).toString(),
    includeShipping: 'false',
    shippingGross: '0',
    packagingCost: '150',
    profitPercent: '40',
    mlRate: '19'
  });
  await chrome.tabs.create({ url: `${MELICALC_BASE}?${params.toString()}` });
});

init().catch((error) => setStatus(error.message));
