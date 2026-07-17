import { describe, expect, it } from "vitest";
import { estimateMontenegroImport } from "./importCost";

describe("Montenegro import estimate", () => {
  it("never removes VAT from an eCarsTrade VAT-deductible net price", () => {
    const result = estimateMontenegroImport({
      price: 9850, priceMode: "net_export", platformFee: 250,
      exportDeclarationFee: 50, shipping: 900, customsDutyRate: 0,
      montenegroVatRate: 21, customsBroker: 300, homologation: 200,
    });
    expect(result.purchasePrice).toBe(9850);
    expect(result.importVat).toBeCloseTo(2257.5);
    expect(result.landedCost).toBeCloseTo(13807.5);
  });

  it("does not produce a magic total when a required quote is missing", () => {
    const result = estimateMontenegroImport({
      price: 9850, priceMode: "net_export", platformFee: 250,
      exportDeclarationFee: 50, montenegroVatRate: 21,
    });
    expect(result.landedCost).toBeUndefined();
    expect(result.missing).toContain("доставка");
    expect(result.missing).toContain("EUR.1 / ставка пошлины");
  });

  it("keeps repair reserve outside landed cost", () => {
    const result = estimateMontenegroImport({
      price: 9850, priceMode: "net_export", platformFee: 250,
      exportDeclarationFee: 50, shipping: 0, customsDutyRate: 0,
      montenegroVatRate: 21, customsBroker: 0, homologation: 0,
    });
    expect(result.landedCost).toBeCloseTo(12218.5);
  });
});
