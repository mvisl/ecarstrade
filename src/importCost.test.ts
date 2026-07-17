import { describe, expect, it } from "vitest";
import { estimateMontenegroImport } from "./importCost";
describe("Montenegro import estimate", () => {
  it("does not remove VAT from an already net price", () => {
    const result = estimateMontenegroImport({
      price: 10000,
      priceMode: "net_export",
      shipping: 900,
      customsRateWithoutOriginProof: 5,
      montenegroVatRate: 21,
      customsBroker: 300,
      homologation: 200,
      transferTaxApplicable: "unknown",
    });
    expect(result.sourceNetLow).toBe(10000);
    expect(result.withOriginProofLow.importVat).toBe(2289);
  });
  it("removes source VAT when gross price is supplied", () => {
    const result = estimateMontenegroImport({
      price: 12100,
      priceMode: "gross_vat_refundable",
      sourceVatRate: 21,
      shipping: 0,
      customsRateWithoutOriginProof: 5,
      montenegroVatRate: 21,
      customsBroker: 0,
      homologation: 0,
      transferTaxApplicable: "unknown",
    });
    expect(result.sourceNetLow).toBeCloseTo(10000);
  });
  it("explains the previous Citroen range without transfer tax or reserve", () => {
    const result = estimateMontenegroImport({
      price: 9850,
      priceMode: "net_export",
      shipping: 900,
      customsRateWithoutOriginProof: 5,
      montenegroVatRate: 21,
      customsBroker: 300,
      homologation: 200,
      transferTaxApplicable: "unknown",
    });
    expect(result.withOriginProofHigh.landedCost).toBeCloseTo(13507.5);
    expect(result.withoutOriginProofHigh.landedCost).toBeCloseTo(14157.88, 1);
  });
});
