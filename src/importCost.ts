export type PriceMode =
  | "net_export"
  | "gross_vat_refundable"
  | "gross_vat_included"
  | "unknown";
export type CalculationConfidence = "high" | "medium" | "low";

export interface ImportCostInput {
  price: number;
  priceMode: PriceMode;
  sourceVatRate?: number;
  shipping: number;
  platformFee?: number;
  customsRateWithoutOriginProof: number;
  montenegroVatRate: number;
  customsBroker: number;
  homologation: number;
  registration?: number;
  transferTaxApplicable: true | false | "unknown";
  localMarketPrice?: number;
}
export interface CostScenario {
  purchaseNetPrice: number;
  customsValue: number;
  customsDuty: number;
  importVat: number;
  landedCost: number;
}
export interface ImportCostEstimate {
  priceMode: PriceMode;
  calculationConfidence: CalculationConfidence;
  sourceNetLow: number;
  sourceNetHigh: number;
  withOriginProofLow: CostScenario;
  withOriginProofHigh: CostScenario;
  withoutOriginProofLow: CostScenario;
  withoutOriginProofHigh: CostScenario;
  shipping: number;
  platformFee?: number;
  customsBroker: number;
  homologation: number;
  registration?: number;
  transferTaxApplicable: true | false | "unknown";
  localMarketPrice?: number;
}

const scenario = (input: ImportCostInput, purchaseNetPrice: number, dutyRate: number): CostScenario => {
  const customsValue = purchaseNetPrice + input.shipping;
  const customsDuty = customsValue * dutyRate;
  const importVat =
    (customsValue + customsDuty) * (input.montenegroVatRate / 100);
  const landedCost =
    purchaseNetPrice +
    (input.platformFee ?? 0) +
    input.shipping +
    customsDuty +
    importVat +
    input.customsBroker +
    input.homologation;
  return { purchaseNetPrice, customsValue, customsDuty, importVat, landedCost };
};

export function estimateMontenegroImport(input: ImportCostInput): ImportCostEstimate {
  const vatRate = (input.sourceVatRate ?? 21) / 100;
  const refundableNet = input.price / (1 + vatRate);
  const sourceNetLow =
    input.priceMode === "net_export" || input.priceMode === "gross_vat_included"
      ? input.price
      : refundableNet;
  const sourceNetHigh = input.priceMode === "unknown" ? input.price : sourceNetLow;
  const dutyRate = input.customsRateWithoutOriginProof / 100;
  const unknownCore = input.priceMode === "unknown";
  const unknownFee = input.platformFee == null || input.registration == null;
  return {
    priceMode: input.priceMode,
    calculationConfidence: unknownCore ? "low" : unknownFee ? "medium" : "high",
    sourceNetLow,
    sourceNetHigh,
    withOriginProofLow: scenario(input, sourceNetLow, 0),
    withOriginProofHigh: scenario(input, sourceNetHigh, 0),
    withoutOriginProofLow: scenario(input, sourceNetLow, dutyRate),
    withoutOriginProofHigh: scenario(input, sourceNetHigh, dutyRate),
    shipping: input.shipping,
    platformFee: input.platformFee,
    customsBroker: input.customsBroker,
    homologation: input.homologation,
    registration: input.registration,
    transferTaxApplicable: input.transferTaxApplicable,
    localMarketPrice: input.localMarketPrice,
  };
}
