import type { UserDecision } from "./storage";

const pillNames: Record<string, string> = {
  price: "цена",
  transmission: "коробка",
  mileage: "пробег",
  year: "год",
  make: "марка",
  model: "модель",
  fuel: "топливо",
  engine: "двигатель",
  color: "цвет",
};

export function buildSessionSummary(decisions: UserDecision[]) {
  const rows = decisions.slice(-15);
  const positive: Record<string, number> = {};
  const negative: Record<string, number> = {};
  rows.forEach((decision) =>
    decision.pillFeedback.forEach((pill) => {
      const isPositive = pill.sentiment === "positive" || pill.sentiment === "strongPositive";
      const bucket = isPositive ? positive : negative;
      bucket[pill.key] = (bucket[pill.key] || 0) + (pill.sentiment.startsWith("strong") ? 2 : 1);
    }),
  );
  const strongest = (bucket: Record<string, number>) =>
    Object.entries(bucket).sort((a, b) => b[1] - a[1])[0]?.[0];
  const plus = strongest(positive);
  const minus = strongest(negative);
  const likes = rows.filter((row) => row.decision === "like").length;
  const phrase =
    minus === "price"
      ? plus
        ? `${pillNames[plus] || plus} проходит собеседование. Цена валит почти всех кандидатов.`
        : "Сегодняшний кастинг суров: цена валит почти всех кандидатов."
      : minus
        ? `${pillNames[plus || ""] || "Машины"} нравятся, но ${pillNames[minus] || minus} портит впечатление.`
        : "Профиль уточняется — следующая подборка уже будет менее случайной.";
  return {
    decisionsCount: rows.length,
    likesCount: likes,
    dislikesCount: rows.length - likes,
    strongestPositive: plus ? pillNames[plus] || plus : undefined,
    strongestNegative: minus ? pillNames[minus] || minus : undefined,
    phrase,
  };
}
