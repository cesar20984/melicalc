const IVA = 0.19;
const IVA_FACTOR = 1 + IVA;

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getFixedFeeGross(finalGross) {
  if (finalGross > 0 && finalGross <= 9990) return 700;
  if (finalGross > 0 && finalGross <= 19990) return 1000;
  return 0;
}

function fixedFeeRule(finalGross) {
  if (finalGross <= 0) return 'sin precio final calculado';
  if (finalGross <= 9990) return 'precio final <= $9.990, aplica $700 bruto';
  if (finalGross <= 19990) return 'precio final <= $19.990, aplica $1.000 bruto';
  return 'precio final > $19.990, aplica $0';
}

export function calculate(input = {}) {
  const productGross = toNumber(input.productGross);
  const includeShipping = input.includeShipping === undefined ? true : Boolean(input.includeShipping);
  const shippingGross = toNumber(input.shippingGross, 3500);
  const packagingCost = toNumber(input.packagingCost, 150);
  const marginMode = input.marginMode || 'percent';
  const profitPercent = toNumber(input.profitPercent, 40) / 100;
  const profitAmount = toNumber(input.profitAmount);
  const manualFinalPrice = toNumber(input.manualFinalPrice || input.finalPriceGross);
  const mlRate = toNumber(input.mlRate, 19) / 100;

  const productNet = productGross / IVA_FACTOR;
  const shippingNet = includeShipping ? shippingGross / IVA_FACTOR : 0;
  const packagingNet = packagingCost / IVA_FACTOR;
  const costNet = productNet + shippingNet + packagingNet;

  let finalNet = 0;
  let finalGross = 0;
  let fixedFeeGross = 0;
  let fixedFeeNet = 0;
  let targetProfit = 0;

  if (marginMode === 'price') {
    finalGross = manualFinalPrice;
    fixedFeeGross = getFixedFeeGross(finalGross);
    fixedFeeNet = fixedFeeGross / IVA_FACTOR;
    finalNet = finalGross / IVA_FACTOR;
    targetProfit = finalNet - (finalNet * mlRate) - fixedFeeNet - costNet;
  } else {
    targetProfit = marginMode === 'amount' ? profitAmount : costNet * profitPercent;
    for (let i = 0; i < 8; i++) {
      fixedFeeGross = getFixedFeeGross(finalGross);
      fixedFeeNet = fixedFeeGross / IVA_FACTOR;
      finalNet = (costNet + targetProfit + fixedFeeNet) / (1 - mlRate);
      const nextGross = finalNet * IVA_FACTOR;
      if (Math.abs(nextGross - finalGross) < 1) {
        finalGross = nextGross;
        break;
      }
      finalGross = nextGross;
    }
    fixedFeeGross = getFixedFeeGross(finalGross);
    fixedFeeNet = fixedFeeGross / IVA_FACTOR;
    finalNet = (costNet + targetProfit + fixedFeeNet) / (1 - mlRate);
    finalGross = finalNet * IVA_FACTOR;
  }

  const commissionNet = finalNet * mlRate;
  const commissionVat = commissionNet * IVA;
  const saleVat = finalNet * IVA;
  const productVatCredit = productGross - productNet;
  const shippingVatCredit = includeShipping ? shippingGross - shippingNet : 0;
  const packagingVatCredit = packagingCost - packagingNet;
  const fixedFeeVatCredit = fixedFeeGross - fixedFeeNet;
  const vatCredit = productVatCredit + shippingVatCredit + packagingVatCredit + commissionVat + fixedFeeVatCredit;
  const vatToPay = saleVat - vatCredit;
  const realProfit = finalNet - commissionNet - fixedFeeNet - costNet;
  const marginPercent = costNet > 0 ? (realProfit / costNet) * 100 : 0;
  const acosMaxPercent = finalGross > 0 ? (realProfit / finalGross) * 100 : 0;

  return {
    inputs: {
      productGross,
      includeShipping,
      shippingGross,
      packagingCost,
      marginMode,
      profitPercent: profitPercent * 100,
      profitAmount,
      manualFinalPrice,
      mlRate: mlRate * 100
    },
    summary: {
      finalGross,
      finalNet,
      realProfit,
      marginPercent,
      acosMaxPercent
    },
    costs: {
      productNet,
      shippingNet,
      packagingNet,
      costNet,
      fixedFeeGross,
      fixedFeeNet,
      fixedFeeRule: fixedFeeRule(finalGross)
    },
    marketplace: {
      commissionNet,
      commissionVat,
      mlRate: mlRate * 100
    },
    vat: {
      debit: saleVat,
      credits: {
        product: productVatCredit,
        shipping: shippingVatCredit,
        packaging: packagingVatCredit,
        commission: commissionVat,
        fixedFee: fixedFeeVatCredit
      },
      totalCredit: vatCredit,
      estimatedToPay: vatToPay
    },
    advertising: [5, 10, 15, 20, 25, 30, 35, 40].map((percent) => ({
      percent,
      profitAfterAds: realProfit - (finalGross * (percent / 100))
    }))
  };
}
