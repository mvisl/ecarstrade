export type PriceMode = "net_export" | "margin_vat_included" | "unknown";

export interface ImportCostInput {
  price: number;
  priceMode: PriceMode;
  platformFee?: number;
  exportDeclarationFee?: number;
  shipping?: number;
  customsDutyRate?: number;
  montenegroVatRate?: number;
  customsBroker?: number;
  homologation?: number;
}

export interface ImportCostEstimate {
  purchasePrice: number;
  platformFee?: number;
  exportDeclarationFee?: number;
  shipping?: number;
  customsValue?: number;
  customsDuty?: number;
  importVat?: number;
  customsBroker?: number;
  homologation?: number;
  landedCost?: number;
  missing: string[];
}

/** Only returns a landed total when every required input is known. */
export function estimateMontenegroImport(input: ImportCostInput): ImportCostEstimate {
  const missing: string[] = [];
  if (input.priceMode === "unknown") missing.push("VAT-режим");
  if (input.platformFee == null) missing.push("комиссия eCarsTrade");
  if (input.shipping == null) missing.push("доставка");
  if (input.customsDutyRate == null) missing.push("EUR.1 / ставка пошлины");
  if (input.montenegroVatRate == null) missing.push("ставка PDV");
  if (input.customsBroker == null) missing.push("špedicija");
  if (input.homologation == null) missing.push("homologation");

  const customsValue = input.shipping == null ? undefined : input.price + input.shipping;
  const customsDuty =
    customsValue == null || input.customsDutyRate == null
      ? undefined
      : customsValue * (input.customsDutyRate / 100);
  const importVat =
    customsValue == null || customsDuty == null || input.montenegroVatRate == null
      ? undefined
      : (customsValue + customsDuty) * (input.montenegroVatRate / 100);
  const complete = missing.length === 0 && customsDuty != null && importVat != null;
  const landedCost = complete
    ? input.price +
      input.platformFee! +
      (input.exportDeclarationFee ?? 0) +
      input.shipping! +
      customsDuty +
      importVat +
      input.customsBroker! +
      input.homologation!
    : undefined;
  return { ...input, purchasePrice: input.price, customsValue, customsDuty, importVat, landedCost, missing };
}
