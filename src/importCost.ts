export interface ImportCostInput {
  price: number;
  priceIncludesVat: boolean;
  sourceVatRate?: number;
  shipping: number;
  customsRateWithoutOriginProof: number;
  montenegroVatRate: number;
  fees: number;
  localMarketPrice?: number;
}
export interface ImportCostEstimate {
  sourceNet: number;
  customsValue: number;
  dutyWithOriginProof: number;
  dutyWithoutOriginProof: number;
  vatWithOriginProof: number;
  vatWithoutOriginProof: number;
  totalLow: number;
  totalHigh: number;
  localMarketPrice?: number;
  savingsLow?: number;
  savingsHigh?: number;
}
export function estimateMontenegroImport(
  input: ImportCostInput,
): ImportCostEstimate {
  const sourceNet = input.priceIncludesVat
    ? input.price / (1 + (input.sourceVatRate ?? 21) / 100)
    : input.price;
  const customsValue = sourceNet + input.shipping;
  const dutyWithOriginProof = 0;
  const dutyWithoutOriginProof =
    (customsValue * input.customsRateWithoutOriginProof) / 100;
  const vatWithOriginProof =
    ((customsValue + dutyWithOriginProof) * input.montenegroVatRate) / 100;
  const vatWithoutOriginProof =
    ((customsValue + dutyWithoutOriginProof) * input.montenegroVatRate) / 100;
  const totalLow =
    customsValue + dutyWithOriginProof + vatWithOriginProof + input.fees;
  const totalHigh =
    customsValue + dutyWithoutOriginProof + vatWithoutOriginProof + input.fees;
  return {
    sourceNet,
    customsValue,
    dutyWithOriginProof,
    dutyWithoutOriginProof,
    vatWithOriginProof,
    vatWithoutOriginProof,
    totalLow,
    totalHigh,
    localMarketPrice: input.localMarketPrice,
    savingsLow:
      input.localMarketPrice != null
        ? input.localMarketPrice - totalHigh
        : undefined,
    savingsHigh:
      input.localMarketPrice != null
        ? input.localMarketPrice - totalLow
        : undefined,
  };
}
