import { beforeEach, describe, expect, it } from "vitest";
import { shouldScheduleReview } from "./reviewScheduler";
import type { UserDecision } from "./storage";
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
    clear: () => memory.clear(),
  },
});
const rows = (count: number) =>
  Array.from(
    { length: count },
    (_, i) =>
      ({
        id: String(i),
        carId: String(i),
        decision: "like" as const,
        createdAt: Date.now(),
        carSnapshot: { make: "X", model: "Y" },
        pillFeedback: [],
      }) satisfies UserDecision,
  );
describe("review scheduler", () => {
  beforeEach(() => localStorage.clear());
  it("waits for eight new decisions", () => {
    expect(shouldScheduleReview(rows(7)).eligible).toBe(false);
    expect(shouldScheduleReview(rows(8)).eligible).toBe(true);
  });
  it("does not schedule twice in one day", () => {
    localStorage.setItem(
      "ecarstrade:llm-review-meta",
      JSON.stringify({
        reviewedDecisionCount: 0,
        lastAutomaticReviewAt: Date.now(),
      }),
    );
    expect(shouldScheduleReview(rows(20)).eligible).toBe(false);
  });
});
