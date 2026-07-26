import type { UserDecision } from "./storage";
import { buildProfiles } from "./learning";
const META_KEY = "ecarstrade:llm-review-meta",
  PENDING_KEY = "ecarstrade:llm-review-pending";
let timer: number | undefined;
interface ReviewMeta {
  reviewedDecisionCount: number;
  lastAutomaticReviewAt?: number;
  status?: "idle" | "waiting" | "running" | "ready" | "error";
  lastAttemptAt?: number;
  lastSuccessAt?: number;
  lastHttpStatus?: number;
  lastRequestId?: string;
  lastInsightCount?: number;
  reason?: string;
}
export const getReviewMeta = (): ReviewMeta => {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '{"reviewedDecisionCount":0,"status":"idle"}') as ReviewMeta; }
  catch { return { reviewedDecisionCount: 0, status: "idle" }; }
};
const writeReviewMeta = (patch: Partial<ReviewMeta>) => localStorage.setItem(META_KEY, JSON.stringify({ ...getReviewMeta(), ...patch }));
export const buildReviewInput = (decisions: UserDecision[]) => {
  const profiles = buildProfiles(decisions);
  return {
    requestId: crypto.randomUUID(),
    newDecisionCount: decisions.length - getReviewMeta().reviewedDecisionCount,
    longTermProfile: profiles.longTermProfile,
    recentProfile: profiles.recentProfile,
    strongestNewSignals: profiles.recentProfile.slice().sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 8),
    representativeDecisions: decisions.slice(-15).map((item) => ({ id: item.id, decision: item.decision, car: item.carSnapshot, pills: item.pillFeedback })),
    requestedAt: Date.now(),
  };
};
export async function runReviewNow(decisions: UserDecision[]) {
  const endpoint = import.meta.env.VITE_GEMINI_REVIEW_ENDPOINT as string | undefined;
  const input = buildReviewInput(decisions);
  localStorage.setItem(PENDING_KEY, JSON.stringify(input));
  writeReviewMeta({ status: endpoint ? "running" : "error", reason: endpoint ? "Ручная проверка выполняется" : "Endpoint не задан", lastAttemptAt: Date.now(), lastRequestId: input.requestId });
  if (!endpoint) throw new Error("missing_endpoint");
  const installationId = localStorage.getItem("ecarstrade:installation-id") || crypto.randomUUID();
  localStorage.setItem("ecarstrade:installation-id", installationId);
  const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", "X-Installation-Id": installationId }, body: JSON.stringify(input) });
  const result = await response.json().catch(() => ({}));
  writeReviewMeta({ status: response.ok ? "ready" : "error", reason: response.ok ? "Готово" : String(result.error || `HTTP ${response.status}`), lastHttpStatus: response.status, lastSuccessAt: response.ok ? Date.now() : getReviewMeta().lastSuccessAt, lastInsightCount: Array.isArray(result.insights) ? result.insights.length : 0 });
  if (!response.ok) throw new Error(String(result.error || `review_${response.status}`));
  localStorage.setItem("ecarstrade:llm-review-result", JSON.stringify({ ...result, receivedAt: Date.now() }));
  localStorage.removeItem(PENDING_KEY);
  markReviewCompleted(decisions.length);
  return result;
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
    window.dispatchEvent(
      new CustomEvent("ecarstrade:llm-review-requested", { detail: { newDecisionCount: check.newDecisionCount } }),
    );
    runReviewNow(decisions).then((result) => window.dispatchEvent(new CustomEvent("ecarstrade:llm-review-completed", { detail: result }))).catch(() => window.dispatchEvent(new CustomEvent("ecarstrade:llm-review-failed")));
  }, delayMs);
  return true;
}
export function markReviewCompleted(
  totalDecisionCount: number,
  now = Date.now(),
) {
  writeReviewMeta({ reviewedDecisionCount: totalDecisionCount, lastAutomaticReviewAt: now, status: "ready" });
  localStorage.removeItem(PENDING_KEY);
}
