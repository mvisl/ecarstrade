import { PRIOR_STRENGTH, PROFILE_HALF_LIFE_DAYS } from "./config";
import type { CarSnapshot, UserDecision } from "./storage";

export interface PreferenceSignal {
  key: string;
  value: string;
  positiveWeight: number;
  negativeWeight: number;
  explicitSamples: number;
  implicitSamples: number;
  effectiveSamples: number;
  score: number;
  confidence: number;
  lastUpdatedAt: number;
}
const norm = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();
const bucket = (
  value: number | undefined,
  steps: number[],
  labels: string[],
) => {
  if (value == null || Number.isNaN(value)) return null;
  const index = steps.findIndex((step) => value < step);
  return labels[index < 0 ? labels.length - 1 : index];
};
export function snapshotFeatures(car: CarSnapshot) {
  const pairs: [string, string | number | boolean | undefined | null][] = [
    ["make", car.make],
    ["model", car.model],
    [
      "year",
      bucket(
        car.year,
        [2018, 2021, 2024],
        ["до 2018", "2018-2020", "2021-2023", "2024+"],
      ),
    ],
    [
      "mileage",
      bucket(
        car.mileage,
        [50000, 100000, 150000],
        ["0-50000", "50000-100000", "100000-150000", "150000+"],
      ),
    ],
    ["transmission", car.transmission],
    ["fuel", car.fuel],
    ["engine", car.engine],
    ["body", car.bodyType],
    [
      "price",
      bucket(
        car.price,
        [10000, 15000, 20000, 25000],
        ["до 10000", "10000-15000", "15000-20000", "20000-25000", "25000+"],
      ),
    ],
    ["color", car.color],
    ["vat", car.vatDeductible ? "deductible" : "not-deductible"],
    ["damage", car.damageStatus],
  ];
  return pairs
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => ({ key, value: norm(value) }));
}
export function buildPreferenceProfile(
  decisions: UserDecision[],
  now = Date.now(),
) {
  const signals = new Map<string, PreferenceSignal>();
  for (const decision of decisions) {
    const ageDays = Math.max(0, (now - decision.createdAt) / 86400000);
    const decay = 0.5 ** (ageDays / PROFILE_HALF_LIFE_DAYS);
    const explicit = new Map(
      decision.pillFeedback.map((item) => [item.key, item]),
    );
    const features = snapshotFeatures(decision.carSnapshot);
    const featureKeys = new Set(features.map((feature) => feature.key));
    for (const feature of features) {
      const id = `${feature.key}:${feature.value}`;
      const current = signals.get(id) ?? {
        key: feature.key,
        value: feature.value,
        positiveWeight: 0,
        negativeWeight: 0,
        explicitSamples: 0,
        implicitSamples: 0,
        effectiveSamples: 0,
        score: 0,
        confidence: 0,
        lastUpdatedAt: 0,
      };
      const pill = explicit.get(feature.key);
      if (!pill && explicit.size > 0) continue;
      if (pill) {
        const weight = (feature.key === "price" ? 2.5 : 1.25) * decay;
        if (pill.sentiment === "positive") current.positiveWeight += weight;
        else current.negativeWeight += weight;
        current.explicitSamples += 1;
        current.effectiveSamples += decay;
      } else {
        const weight = 0.06 * decay;
        if (decision.decision === "like") current.positiveWeight += weight;
        else current.negativeWeight += weight;
        current.implicitSamples += 1;
        current.effectiveSamples += decay * 0.25;
      }
      current.lastUpdatedAt = Math.max(
        current.lastUpdatedAt,
        decision.createdAt,
      );
      signals.set(id, current);
    }
    // Keep explicit qualitative feedback (for example "design") even when
    // it has no objective field in the listing. The periodic reviewer sees
    // it together with the car and can understand deliberate exceptions.
    for (const pill of decision.pillFeedback.filter((item) => !featureKeys.has(item.key))) {
      const value = norm(pill.normalizedValue ?? pill.rawValue);
      const id = `${pill.key}:${value}`;
      const current = signals.get(id) ?? {
        key: pill.key, value, positiveWeight: 0, negativeWeight: 0,
        explicitSamples: 0, implicitSamples: 0, effectiveSamples: 0,
        score: 0, confidence: 0, lastUpdatedAt: 0,
      };
      const weight = 1.25 * decay;
      if (pill.sentiment === "positive") current.positiveWeight += weight;
      else current.negativeWeight += weight;
      current.explicitSamples += 1;
      current.effectiveSamples += decay;
      current.lastUpdatedAt = Math.max(current.lastUpdatedAt, decision.createdAt);
      signals.set(id, current);
    }
  }
  for (const signal of signals.values()) {
    signal.score =
      (signal.positiveWeight - signal.negativeWeight) /
      (signal.positiveWeight + signal.negativeWeight + PRIOR_STRENGTH);
    const enoughExplicit = signal.explicitSamples / 3,
      enoughImplicit = signal.implicitSamples / 8;
    signal.confidence = Math.min(1, Math.max(enoughExplicit, enoughImplicit));
  }
  return [...signals.values()];
}
export const buildProfiles = (decisions: UserDecision[], now = Date.now()) => ({
  longTermProfile: buildPreferenceProfile(decisions, now),
  recentProfile: buildPreferenceProfile(decisions.slice(-20), now),
});
