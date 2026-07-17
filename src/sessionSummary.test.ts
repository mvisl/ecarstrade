import { describe, expect, it } from "vitest";
import { buildSessionSummary } from "./sessionSummary";

describe("session summary", () => {
  it("calls out price when it is the dominant rejection reason", () => {
    const rows = Array.from({ length: 6 }, (_, index) => ({
      id: String(index),
      carId: String(index),
      decision: "dislike" as const,
      createdAt: index,
      carSnapshot: { make: "Any", model: String(index), price: 20000 },
      pillFeedback: [
        { key: "price", rawValue: 20000, sentiment: "negative" as const },
      ],
    }));
    expect(buildSessionSummary(rows).phrase.toLowerCase()).toContain("цена валит");
  });
});
