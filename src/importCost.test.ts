import { describe, expect, it } from "vitest";
import { estimateMontenegroImport } from "./importCost";
describe("Montenegro import estimate", () => {
  it("does not remove VAT from an already net price", () => {
    const result = estimateMontenegroImport({
      price: 10000,
      priceIncludesVat: false,
      shipping: 900,
      customsRateWithoutOriginProof: 5,
      montenegroVatRate: 21,
      fees: 500,
    });
    expect(result.sourceNet).toBe(10000);
    expect(result.vatWithOriginProof).toBe(2289);
  });
  it("removes source VAT when gross price is supplied", () => {
    const result = estimateMontenegroImport({
      price: 12100,
      priceIncludesVat: true,
      sourceVatRate: 21,
      shipping: 0,
      customsRateWithoutOriginProof: 5,
      montenegroVatRate: 21,
      fees: 0,
    });
    expect(result.sourceNet).toBeCloseTo(10000);
  });
});
