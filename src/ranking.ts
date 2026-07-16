import { snapshotFeatures, type PreferenceSignal } from "./learning";
import type { CarSnapshot } from "./storage";
export interface RankableCar extends CarSnapshot {
  id: string;
  damageStatus?: string;
}
export interface ScoreBreakdown {
  objective: number;
  preferences: number;
  opportunity: number;
  exploration: number;
  risk: number;
  diversityPenalty: number;
  total: number;
}
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const caps: Record<string, number> = { make: 0.06, model: 0.06, color: 0.04 };
const hash = (text: string) =>
  [...text].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
export function scoreCar(
  car: RankableCar,
  profile: PreferenceSignal[],
): ScoreBreakdown {
  const byId = new Map(
    profile.map((signal) => [`${signal.key}:${signal.value}`, signal]),
  );
  let preferences = 0;
  for (const feature of snapshotFeatures(car)) {
    const signal = byId.get(`${feature.key}:${feature.value}`);
    if (!signal) continue;
    const stable = signal.explicitSamples >= 3 || signal.implicitSamples >= 8;
    const influence = stable ? 1 : 0.15;
    preferences += clamp(
      signal.score * influence,
      -(caps[feature.key] ?? 0.1),
      caps[feature.key] ?? 0.1,
    );
  }
  const objective =
    (car.vatDeductible ? 0.25 : 0) +
    (car.year && car.year >= 2020 ? 0.12 : 0) +
    (car.mileage != null && car.mileage < 100000 ? 0.1 : 0) +
    (car.price != null && car.price <= 15000 ? 0.15 : 0);
  const opportunity = car.price != null && car.price <= 11000 ? 0.08 : 0;
  const exploration = ((hash(car.id) % 1000) / 1000) * 0.08;
  const risk =
    car.damageStatus && car.damageStatus !== "not-reported" ? -0.22 : 0;
  const total = objective + preferences + opportunity + exploration + risk;
  return {
    objective,
    preferences,
    opportunity,
    exploration,
    risk,
    diversityPenalty: 0,
    total,
  };
}
export function rankAndDiversify(
  cars: RankableCar[],
  profile: PreferenceSignal[],
  batchSize = Math.min(5, cars.length),
) {
  const scored = cars
    .map((car) => ({ car, score: scoreCar(car, profile) }))
    .sort((a, b) => b.score.total - a.score.total);
  const chosen: typeof scored = [];
  const brandCount = new Map<string, number>(),
    modelCount = new Map<string, number>();
  const maxBrand = Math.max(1, Math.floor(batchSize * 0.4));
  for (const candidate of scored) {
    if (chosen.length >= batchSize) break;
    const brand = String(candidate.car.make),
      model = String(candidate.car.model);
    if (
      (brandCount.get(brand) || 0) >= maxBrand ||
      (modelCount.get(model) || 0) >= 3 ||
      chosen.at(-1)?.car.model === model
    )
      continue;
    chosen.push(candidate);
    brandCount.set(brand, (brandCount.get(brand) || 0) + 1);
    modelCount.set(model, (modelCount.get(model) || 0) + 1);
  }
  for (const candidate of scored) {
    if (chosen.length >= batchSize) break;
    if (!chosen.includes(candidate))
      chosen.push({
        ...candidate,
        score: {
          ...candidate.score,
          diversityPenalty: -0.08,
          total: candidate.score.total - 0.08,
        },
      });
  }
  if (chosen.length >= 5) {
    const exploratory = scored.find(
      (item) => !chosen.slice(0, 4).includes(item),
    );
    if (exploratory) chosen[4] = exploratory;
  }
  return chosen;
}
