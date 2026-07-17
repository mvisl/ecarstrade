import { describe, expect, it } from "vitest";
import { parseHardExclusions, violatesHardExclusions } from "./initialPreferences";

describe("initial preferences", () => {
  it("understands the user's original hard exclusions", () => {
    expect(parseHardExclusions("Никаких пирожков, минивэнов и машин без заднего ряда сидений")).toEqual({
      commercialVans: true, minibuses: true, rearSeatsRequired: true,
    });
  });

  it("never admits a Berlingo cargo van into the feed", () => {
    expect(violatesHardExclusions({ name: "Citroen Berlingo furgón", model: "Berlingo", body: "Легковой" })).toBe(true);
  });
});
