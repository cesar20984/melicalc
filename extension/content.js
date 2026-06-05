function visibleText(selector) {
  return Array.from(document.querySelectorAll(selector))
    .map((node) => node.innerText || node.textContent || '')
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 20);
}

function meta(name) {
  return document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.content || '';
}

function detectSite() {
  const host = location.hostname.toLowerCase();
  if (host.includes('alibaba.')) return 'alibaba';
  if (host.includes('aliexpress.')) return 'aliexpress';
  return 'other';
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'MELICALC_SCRAPE_PAGE') return false;

  const bodyText = document.body?.innerText || '';
  const compactText = bodyText.replace(/\s+/g, ' ').trim().slice(0, 18000);

  sendResponse({
    siteType: detectSite(),
    url: location.href,
    title: document.title,
    meta: {
      title: meta('og:title') || meta('twitter:title'),
      description: meta('og:description') || meta('description')
    },
    visibleHints: {
      prices: visibleText('[class*="price" i], [class*="Price" i], [data-price], [itemprop="price"]'),
      specs: visibleText('[class*="spec" i], [class*="Spec" i], [class*="shipping" i], [class*="Shipping" i], table, dl')
    },
    text: compactText
  });

  return true;
});
