export interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
  APP_SHARED_TOKEN?: string;
  ALLOWED_ORIGIN?: string;
}

const json = (data: unknown, status = 200, origin?: string) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    ...(origin ? { "access-control-allow-origin": origin } : {}),
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "Content-Type, X-App-Token, X-Installation-Id",
    vary: "Origin",
  },
});
const clamp = (n: unknown, min: number, max: number, fallback = 0) => {
  const value = Number(n);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
};
const validOrigin = (request: Request, env: Env) => {
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "https://mvisl.github.io";
  return origin === allowed || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};
const normalize = (raw: any) => ({
  summary: String(raw?.summary || "").slice(0, 300),
  insights: Array.isArray(raw?.insights) ? raw.insights.slice(0, 4).map((x: any) => ({
    text: String(x?.text || "").slice(0, 300),
    confidence: clamp(x?.confidence, 0, 1),
    supportingDecisionIds: Array.isArray(x?.supportingDecisionIds) ? x.supportingDecisionIds.slice(0, 8).map(String) : [],
  })) : [],
  proposedAdjustment: raw?.proposedAdjustment ? {
    signalKey: String(raw.proposedAdjustment.signalKey || "").slice(0, 80),
    multiplier: clamp(raw.proposedAdjustment.multiplier, 0.92, 1.08, 1),
    reason: String(raw.proposedAdjustment.reason || "").slice(0, 300),
    confidence: clamp(raw.proposedAdjustment.confidence, 0, 1),
  } : null,
  clarifyingQuestion: raw?.clarifyingQuestion ? {
    text: String(raw.clarifyingQuestion.text || "").slice(0, 240),
    options: Array.isArray(raw.clarifyingQuestion.options) ? raw.clarifyingQuestion.options.slice(0, 4).map((x: unknown) => String(x).slice(0, 100)) : [],
  } : null,
  sessionPhrase: raw?.sessionPhrase ? String(raw.sessionPhrase).slice(0, 140) : null,
});

export default { async fetch(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("Origin") || env.ALLOWED_ORIGIN || "https://mvisl.github.io";
  if (request.method === "OPTIONS") return validOrigin(request, env) ? json({ ok: true }, 204, origin) : json({ error: "forbidden_origin" }, 403);
  const url = new URL(request.url);
  if (url.pathname === "/health" && request.method === "GET") return json({ ok: true }, 200, origin);
  if (url.pathname !== "/gemini-review" || request.method !== "POST") return json({ error: "not_found" }, 404, origin);
  if (!validOrigin(request, env)) return json({ error: "forbidden_origin" }, 403);
  if (env.APP_SHARED_TOKEN && request.headers.get("X-App-Token") !== env.APP_SHARED_TOKEN) return json({ error: "unauthorized" }, 401, origin);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 64 * 1024) return json({ error: "payload_too_large" }, 413, origin);
  let payload: any;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400, origin); }
  if (!payload || typeof payload !== "object" || typeof payload.requestId !== "string" || !Array.isArray(payload.representativeDecisions) || payload.representativeDecisions.length > 15) return json({ error: "invalid_schema" }, 400, origin);
  if (!env.GEMINI_API_KEY) return json({ error: "missing_api_key" }, 503, origin);
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `You audit a mechanical car preference profile. Return JSON only with keys summary, insights, proposedAdjustment, clarifyingQuestion, sessionPhrase. Do not sort cars, create hard filters, rewrite the profile, or change absolute budgets. Maximum 4 insights, one soft adjustment (multiplier 0.92-1.08), one question. Input:\n${JSON.stringify(payload)}`;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }) });
    if (!response.ok) return json({ error: "gemini_error" }, 502, origin);
    const body: any = await response.json();
    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let parsed: any; try { parsed = JSON.parse(text); } catch { return json({ error: "invalid_gemini_json" }, 502, origin); }
    return json(normalize(parsed), 200, origin);
  } catch { return json({ error: "gemini_unavailable" }, 502, origin); }
} };
