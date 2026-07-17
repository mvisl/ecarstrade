export const INITIAL_PREFERENCES_KEY = "ecarstrade:initial-preferences";
export const HARD_EXCLUSIONS_KEY = "ecarstrade:hard-exclusions";

export const CURRENT_USER_INITIAL_PREFERENCES =
  "Никаких пирожков, машин без заднего ряда сидений, микроавтобусов и коммерческих фургонов. VAT deductible обязателен. Бюджет мягкий: около €10 000. Дизель и автомат предпочтительны, пробег — чем меньше, тем лучше. Простые машины от 2020 года, интересные и премиальные — от 2017 года; возможны исключения.";

export type HardExclusions = {
  commercialVans: boolean;
  minibuses: boolean;
  rearSeatsRequired: boolean;
};

export const parseHardExclusions = (text: string): HardExclusions => {
  const normalized = text.toLowerCase();
  return {
    commercialVans: /пирож|фургон|commercial van|cargo van/.test(normalized),
    minibuses: /микроавтобус|минивэн|минивен|minibus|minivan/.test(normalized),
    rearSeatsRequired: /задн.{0,12}(ряд|сиден)|rear seats/.test(normalized),
  };
};

export const saveInitialPreferences = (text: string) => {
  const exclusions = parseHardExclusions(text);
  localStorage.setItem(INITIAL_PREFERENCES_KEY, text.trim());
  localStorage.setItem(HARD_EXCLUSIONS_KEY, JSON.stringify(exclusions));
  // The rare profile reviewer can consume this together with later decisions.
  localStorage.setItem("ecarstrade:llm-review-pending", JSON.stringify({
    reason: "initial_profile",
    initialPreferences: text.trim(),
    hardExclusions: exclusions,
    requestedAt: Date.now(),
  }));
  return exclusions;
};

export const loadHardExclusions = (): HardExclusions => {
  if (typeof localStorage === "undefined") return { commercialVans: true, minibuses: true, rearSeatsRequired: true };
  try {
    return JSON.parse(localStorage.getItem(HARD_EXCLUSIONS_KEY) || "null") || {
      commercialVans: true,
      minibuses: true,
      rearSeatsRequired: true,
    };
  } catch {
    return { commercialVans: true, minibuses: true, rearSeatsRequired: true };
  }
};

const COMMERCIAL_PATTERN = /\b(berlingo|partner|kangoo|caddy|combo|doblo|proace city|transit connect|furg[oó]n|fourgon|panel van|cargo van|commercial van|kastenwagen|bestelwagen|utilitaire|vanette)\b/i;
const MINIBUS_PATTERN = /\b(minibus|minivan|multivan|transporter|traveller|tourneo|vivaro|trafic|expert|ducato|boxer|jumper|master|sprinter|vito)\b/i;

export const violatesHardExclusions = (car: { name: string; model: string; body: string }) => {
  const exclusions = loadHardExclusions();
  const text = `${car.name} ${car.model} ${car.body}`;
  return (exclusions.commercialVans && COMMERCIAL_PATTERN.test(text)) ||
    (exclusions.minibuses && MINIBUS_PATTERN.test(text));
};
