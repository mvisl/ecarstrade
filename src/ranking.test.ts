import { describe, expect, it } from "vitest";
import {
  nextAllowedPosition,
  rankAndDiversify,
  scoreCar,
  type RankableCar,
} from "./ranking";
const car = (id: string, make: string, model: string): RankableCar => ({
  id,
  make,
  model,
  year: 2022,
  mileage: 40000,
  price: 12000,
  vatDeductible: true,
});
describe("ranking", () => {
  it("caps an unstable single preference", () => {
    const score = scoreCar(car("1", "Ford", "Kuga"), [
      {
        key: "make",
        value: "ford",
        positiveWeight: 1.25,
        negativeWeight: 0,
        explicitSamples: 1,
        implicitSamples: 0,
        effectiveSamples: 1,
        score: 0.2,
        confidence: 0.33,
        lastUpdatedAt: Date.now(),
      },
    ]);
    expect(score.preferences).toBeLessThanOrEqual(0.03);
  });
  it("limits one brand to 40 percent in a five-car batch", () => {
    const rows = [
      car("1", "Ford", "A"),
      car("2", "Ford", "B"),
      car("3", "Ford", "C"),
      car("4", "Skoda", "D"),
      car("5", "BMW", "E"),
      car("6", "Volvo", "F"),
    ];
    const batch = rankAndDiversify(rows, [], 5);
    expect(
      batch.filter((x) => x.car.make === "Ford").length,
    ).toBeLessThanOrEqual(2);
  });
  it("never repeats a model within one batch", () => {
    const rows = [
      car("1", "Citroen", "C5"),
      car("2", "Citroen", "C5"),
      car("3", "BMW", "X1"),
      car("4", "Volvo", "V40"),
    ];
    const batch = rankAndDiversify(rows, [], 4);
    expect(batch.filter((x) => x.car.model === "C5")).toHaveLength(1);
  });
  it("skips a model after session cooldown", () => {
    const rows = [
      car("1", "Ford", "Kuga"),
      car("2", "Skoda", "Octavia"),
      car("3", "Ford", "Kuga"),
      car("4", "BMW", "X1"),
    ];
    expect(nextAllowedPosition([0, 1, 2, 3], rows, 1, new Set(["Kuga"]))).toBe(
      3,
    );
  });
});
