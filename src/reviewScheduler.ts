import type { UserDecision } from "./storage";
import { buildProfiles } from "./learning";
const META_KEY = "ecarstrade:llm-review-meta",
  PENDING_KEY = "ecarstrade:llm-review-pending";
let timer: number | undefined;
interface ReviewMeta {
  reviewedDecisionCount: number;
  lastAutomaticReviewAt?: number;
}
export function shouldScheduleReview(
  decisions: UserDecision[],
  now = Date.now(),
) {
  const meta = JSON.parse(
    localStorage.getItem(META_KEY) || '{"reviewedDecisionCount":0}',
  ) as ReviewMeta;
  const newDecisionCount = decisions.length - meta.reviewedDecisionCount;
  const last = meta.lastAutomaticReviewAt
    ? new Date(meta.lastAutomaticReviewAt)
    : null;
  const today = new Date(now);
  const alreadyToday =
    last &&
    last.getFullYear() === today.getFullYear() &&
    last.getMonth() === today.getMonth() &&
    last.getDate() === today.getDate();
  return {
    eligible: newDecisionCount >= 8 && !alreadyToday,
    newDecisionCount,
    meta,
  };
}
export function scheduleReviewAfterIdle(
  decisions: UserDecision[],
  delayMs = 60000,
) {
  const check = shouldScheduleReview(decisions);
  if (!check.eligible) return false;
  if (timer) clearTimeout(timer);
  timer = window.setTimeout(() => {
    const profiles = buildProfiles(decisions);
    const representative = decisions
      .slice(-15)
      .map((item) => ({
        id: item.id,
        decision: item.decision,
        car: item.carSnapshot,
        pills: item.pillFeedback,
      }));
    const input = {
      newDecisionCount: check.newDecisionCount,
      longTermProfile: profiles.longTermProfile,
      recentProfile: profiles.recentProfile,
      strongestNewSignals: profiles.recentProfile
        .slice()
        .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
        .slice(0, 8),
      representativeDecisions: representative,
      requestedAt: Date.now(),
    };
    localStorage.setItem(PENDING_KEY, JSON.stringify(input));
    window.dispatchEvent(
      new CustomEvent("ecarstrade:llm-review-requested", { detail: input }),
    );
  }, delayMs);
  return true;
}
export function markReviewCompleted(
  totalDecisionCount: number,
  now = Date.now(),
) {
  localStorage.setItem(
    META_KEY,
    JSON.stringify({
      reviewedDecisionCount: totalDecisionCount,
      lastAutomaticReviewAt: now,
    }),
  );
  localStorage.removeItem(PENDING_KEY);
}
