import { describe, expect, it } from "vitest";
import { buildPreferenceProfile } from "./learning";
import type { UserDecision } from "./storage";
const decision = (over: Partial<UserDecision> = {}): UserDecision => ({
  id: crypto.randomUUID(),
  carId: "1",
  decision: "like",
  createdAt: Date.now(),
  carSnapshot: {
    make: "Ford",
    model: "Kuga",
    year: 2022,
    mileage: 40000,
    transmission: "Automatic",
    fuel: "Diesel",
    price: 23000,
    vatDeductible: true,
  },
  pillFeedback: [],
  ...over,
});
describe("mechanical profile", () => {
  it("treats untouched properties only as weak implicit evidence", () => {
    const signal = buildPreferenceProfile([decision()]).find(
      (x) => x.key === "make",
    )!;
    expect(signal.positiveWeight).toBeCloseTo(0.06);
    expect(signal.explicitSamples).toBe(0);
  });
  it("makes explicit pill evidence stronger without adding implicit evidence", () => {
    const signal = buildPreferenceProfile([
      decision({
        pillFeedback: [
          { key: "make", rawValue: "Ford", sentiment: "negative" },
        ],
      }),
    ]).find((x) => x.key === "make")!;
    expect(signal.negativeWeight).toBeCloseTo(1.25);
    expect(signal.positiveWeight).toBe(0);
  });
  it("does not make one explicit sample confident", () => {
    const signal = buildPreferenceProfile([
      decision({
        pillFeedback: [
          { key: "make", rawValue: "Ford", sentiment: "positive" },
        ],
      }),
    ]).find((x) => x.key === "make")!;
    expect(signal.confidence).toBeCloseTo(1 / 3);
    expect(Math.abs(signal.score)).toBeLessThan(0.21);
  });
});
