import { useEffect, useRef, useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconAutomaticGearbox,
  IconCalendar,
  IconCar,
  IconCheck,
  IconChevronDown,
  IconClipboardCheck,
  IconCurrencyEuro,
  IconEngine,
  IconGasStation,
  IconHeart,
  IconMenu2,
  IconLock,
  IconPalette,
  IconUser,
  IconRoad,
  IconSparkles,
  IconThumbDown,
  IconThumbUp,
  IconX,
} from "@tabler/icons-react";
import "./v3.css";
import "./v3-overrides.css";
import "./v3-layout.css";
import "./strong-pills.css";
import "./mobile.css";
import "./feel-slider.css";
import "./evidence.css";
import { getActiveProfile, getUserDecisions, saveUserDecision } from "./storage";
import { buildProfiles } from "./learning";
import ProfilePanel from "./ProfilePanel";
import WatchlistPanel from "./WatchlistPanel";
import "./profile.css";
import { priceTooHigh, rankAndDiversify } from "./ranking";
import { scheduleReviewAfterIdle } from "./reviewScheduler";
import ImportCostCard from "./ImportCostCard";
import "./import-cost.css";
import { buildSessionSummary } from "./sessionSummary";
import type { UserDecision } from "./storage";
import type { PriceMode } from "./importCost";
import {
  CURRENT_USER_INITIAL_PREFERENCES,
  INITIAL_PREFERENCES_KEY,
  saveInitialPreferences,
  violatesHardExclusions,
} from "./initialPreferences";

type Sentiment = "positive" | "negative" | "strongPositive" | "strongNegative";
type Car = {
  id: string;
  sourceUrl?: string;
  sourceListingId?: string;
  make: string;
  model: string;
  name: string;
  year: string;
  mileage: string;
  gearbox: string;
  fuel: string;
  engine: string;
  color: string;
  body: string;
  price: string;
  origin: string;
  photos: string[];
  critical?: string;
  report: { kind: "bad" | "warn" | "ok"; text: string }[];
  localMarketPrice?: number;
  localMarketSource?: string;
  localMarketSampleSize?: number;
  localMarketMatch?: "model" | "make-year";
  priceMode?: PriceMode;
  listingCountry?: string;
  platformFee?: number;
  exportDeclarationFee?: number;
};
const photoUrls = (range: string, id: string, names: string[]) =>
  names.map(
    (name) =>
      `https://ecarstrade.com/thumbnails/carsphotos/${range}/${id}/${name}/780x0__r.jpg`,
  );
const legacyCars: Car[] = [
  {
    id: "7360586",
    make: "Ford",
    model: "Kuga",
    name: "Ford Kuga Vignale 2.0 EcoBlue",
    year: "2022",
    mileage: "14 639 км",
    gearbox: "Автомат",
    fuel: "Дизель",
    engine: "2.0 · 190 л.с.",
    color: "Красный",
    body: "SUV",
    price: "€23 000",
    origin: "Германия · Fixed Price",
    photos: Array.from(
      { length: 8 },
      (_, i) =>
        `https://ecarstrade.com/thumbnails/carsphotos/7360001-7370000/7360586/photo_${String(i + 1).padStart(3, "0")}/780x0__r.jpg`,
    ),
    critical: "Заявлены прошлые повреждения",
    report: [
      { kind: "bad", text: "Прошлые повреждения на €10 074,82" },
      { kind: "warn", text: "Оценка ремонта около €3 735 без VAT" },
      { kind: "ok", text: "Коробка передач — без замечаний" },
      { kind: "ok", text: "5 мест и полноценный задний ряд" },
    ],
  },
  {
    id: "7251730",
    make: "Ford",
    model: "Kuga",
    name: "Ford Kuga ST-Line 1.5 EcoBlue",
    year: "2021",
    mileage: "148 674 км",
    gearbox: "Механика",
    fuel: "Дизель",
    engine: "1.5 · 120 л.с.",
    color: "Чёрный",
    body: "SUV",
    price: "€10 900",
    origin: "Бельгия · Our Stock",
    photos: photoUrls("7250001-7260000", "7251730", [
      "photo_070",
      "photo_065",
      "photo_069",
      "photo_067",
      "photo_068",
      "photo_066",
      "photo_062",
    ]),
    report: [
      { kind: "warn", text: "Большой пробег — 148 674 км" },
      { kind: "warn", text: "Механическая коробка вместо автомата" },
      { kind: "ok", text: "VAT deductible" },
      { kind: "ok", text: "5 мест, ISOFIX и полноценный задний ряд" },
    ],
  },
  {
    id: "7050168",
    make: "Ford",
    model: "Kuga",
    name: "Ford Kuga PHEV ST-Line 2.5",
    year: "2021",
    mileage: "47 504 км",
    gearbox: "Автомат",
    fuel: "Гибрид",
    engine: "2.5 · 224 л.с.",
    color: "Серый",
    body: "SUV",
    price: "€16 600",
    origin: "Италия · Our Stock",
    photos: photoUrls("7050001-7060000", "7050168", [
      "photo_056",
      "photo_057",
      "photo_054",
      "photo_055",
      "photo_053",
      "photo_052",
      "photo_051",
    ]),
    critical: "Повреждения от града",
    report: [
      { kind: "bad", text: "Заявлены повреждения от града" },
      { kind: "warn", text: "Цена выше целевого бюджета" },
      { kind: "ok", text: "Автомат и пробег 47 504 км" },
      { kind: "ok", text: "5 мест и полноценный задний ряд" },
    ],
  },
  {
    id: "6978220",
    make: "Skoda",
    model: "Octavia",
    name: "Skoda Octavia Break Business 2.0 TDI",
    year: "2022",
    mileage: "Пробег закрыт",
    gearbox: "Автомат",
    fuel: "Дизель",
    engine: "2.0 · 116 л.с.",
    color: "Серый",
    body: "Универсал",
    price: "Цена закрыта",
    origin: "Франция · Архив eCarsTrade",
    photos: photoUrls("6970001-6980000", "6978220", [
      "photo_001",
      "photo_002",
      "photo_003",
      "photo_004",
      "photo_005",
    ]),
    report: [
      {
        kind: "warn",
        text: "Объявление из архива — актуальность цены нужно перепроверить",
      },
      { kind: "warn", text: "COC отсутствует" },
      { kind: "ok", text: "Автомат, дизель и 5 мест" },
      { kind: "ok", text: "2022 год" },
    ],
  },
  {
    id: "6167161",
    make: "Skoda",
    model: "Karoq",
    name: "Skoda Karoq Clever 1.5 TSI DSG7",
    year: "2023",
    mileage: "28 444 км",
    gearbox: "Автомат",
    fuel: "Бензин",
    engine: "1.5 · 150 л.с.",
    color: "Серый",
    body: "SUV",
    price: "Цена закрыта",
    origin: "Бельгия · Архив eCarsTrade",
    photos: photoUrls("6160001-6170000", "6167161", [
      "photo_000",
      "photo_001",
      "photo_002",
      "photo_003",
      "photo_004",
    ]),
    report: [
      {
        kind: "warn",
        text: "Объявление из архива — актуальность цены нужно перепроверить",
      },
      { kind: "warn", text: "Есть царапины, смотреть фотографии" },
      { kind: "ok", text: "Автомат и 5 мест" },
      { kind: "ok", text: "2023 год и небольшой пробег" },
    ],
  },
  {
    id: "6112318",
    make: "Mercedes",
    model: "A 180",
    name: "Mercedes-Benz A 180d",
    year: "2023",
    mileage: "Пробег закрыт",
    gearbox: "Автомат",
    fuel: "Дизель",
    engine: "1.5 · 116 л.с.",
    color: "Не указан",
    body: "Хэтчбек",
    price: "Цена закрыта",
    origin: "Испания · Архив eCarsTrade",
    photos: photoUrls("6110001-6120000", "6112318", [
      "photo_000",
      "photo_001",
      "photo_002",
      "photo_003",
      "photo_004",
    ]),
    report: [
      {
        kind: "warn",
        text: "Объявление из архива — цену и пробег нужно перепроверить",
      },
      { kind: "ok", text: "Автомат и дизель" },
      { kind: "ok", text: "2023 год" },
      { kind: "ok", text: "Компактный легковой автомобиль" },
    ],
  },
];
const HARD_EXCLUDED_MODELS = new Set(["kuga"]);
const isEligibleListing = (car: Car) =>
  !HARD_EXCLUDED_MODELS.has(car.model.trim().toLowerCase()) &&
  !violatesHardExclusions(car) &&
  /^€\d/.test(car.price.replace(/\s/g, "")) &&
  !car.origin.includes("Архив");
const fullSizePhoto = (src: string) =>
  src.replace(/\/\d+x0__r(?=\.(?:jpe?g|webp))/i, "/780x0__r");
const rankableFromCar = (item: Car) => ({
  id: item.id,
  make: item.make,
  model: item.model,
  year: Number(item.year),
  mileage: Number(item.mileage.replace(/\D/g, "")) || undefined,
  transmission: item.gearbox,
  fuel: item.fuel,
  engine: item.engine,
  color: item.color,
  price: Number(item.price.replace(/\D/g, "")) || undefined,
  bodyType: item.body,
  vatDeductible: true,
  damageStatus: item.critical ?? "not-reported",
});
export default function V3({ onLock }: { onLock: () => void }) {
  const [cars, setCars] = useState<Car[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, Sentiment>>({});
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedKey = useRef<string | null>(null);
  const [open, setOpen] = useState(true);
  const [leaving, setLeaving] = useState("");
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState<"yes" | "no" | null>(null);
  const [searching, setSearching] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [evidencePanel, setEvidencePanel] = useState<"benefits" | "pitfalls" | null>(null);
  const [photoModal, setPhotoModal] = useState(false);
  const [photoReaction, setPhotoReaction] = useState<"positive" | "negative" | "strongPositive" | "strongNegative" | null>(null);
  const [pricePopover, setPricePopover] = useState(false);
  const photoLongPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [history, setHistory] = useState<UserDecision[]>([]);
  const [onboarding, setOnboarding] = useState<"loading" | "needed" | "done">("loading");
  const [initialText, setInitialText] = useState("");
  const [modelRejects, setModelRejects] = useState<Record<string, number>>({});
  const [suppressedModels, setSuppressedModels] = useState<Set<string>>(
    new Set(),
  );
  const [sliderValue, setSliderValue] = useState(50);
  const [sliderArmed, setSliderArmed] = useState(false);
  const sliderResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touch = useRef(0);
  const car = cars[order[index]];
  const displayedPrice = Number(car?.price?.replace(/\D/g, "")) || undefined;
  const importAddons = (car?.platformFee ?? 0) + (car?.exportDeclarationFee ?? 0);
  const comparisonPrice = car?.localMarketPrice;
  const priceDelta = displayedPrice && comparisonPrice ? comparisonPrice - (displayedPrice + importAddons) : undefined;
  const priceQuality = priceDelta == null ? "unknown" : priceDelta >= 0 ? "good" : "bad";
  const pricePosition = priceDelta == null ? 50 : Math.max(8, Math.min(92, 50 + (priceDelta / Math.max(comparisonPrice ?? 1, 1)) * 150));
  useEffect(() => {
    if (!pricePopover) return;
    const close = () => setPricePopover(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [pricePopover]);
  const move = (delta: number) =>
    car &&
    setPhoto(
      (current) => (current + delta + car.photos.length) % car.photos.length,
    );
  const resetSlider = () => {
    if (sliderResetTimer.current) clearTimeout(sliderResetTimer.current);
    sliderResetTimer.current = null;
    setSliderValue(50);
    setSliderArmed(false);
  };
  const armSliderReset = () => {
    if (sliderResetTimer.current) clearTimeout(sliderResetTimer.current);
    sliderResetTimer.current = setTimeout(resetSlider, 2000);
  };
  const decide = (value: "yes" | "no") => {
    if (locked || !car) return;
    setLocked(true);
    setLeaving(value);
    setToast(value);
    const numeric = (text: string) => {
      const value = Number(text.replace(/[^\d]/g, ""));
      return Number.isFinite(value) ? value : undefined;
    };
    const raw: Record<string, string | number | boolean> = {
      make: car.make,
      model: car.model,
      year: numeric(car.year) ?? car.year,
      mileage: numeric(car.mileage) ?? car.mileage,
      transmission: car.gearbox,
      fuel: car.fuel,
      engine: car.engine,
      color: car.color,
      price: numeric(car.price) ?? car.price,
      body: car.body,
      visualAppeal: "Дизайн",
      overallFeel: sliderValue,
    };
    const stored = {
      id: crypto.randomUUID(),
      carId: car.id,
      decision: value === "yes" ? ("like" as const) : ("dislike" as const),
      createdAt: Date.now(),
      carSnapshot: {
        sourceUrl: car.sourceUrl,
        sourceListingId: car.sourceListingId ?? car.id,
        make: car.make,
        model: car.model,
        year: numeric(car.year),
        mileage: numeric(car.mileage),
        transmission: car.gearbox,
        fuel: car.fuel,
        engine: car.engine,
        power: numeric(car.engine.split("·")[1] ?? ""),
        color: car.color,
        price: numeric(car.price),
        bodyType: car.body,
        vatDeductible: true,
        country: car.origin.split("·")[0].trim(),
        damageStatus: car.critical ?? "not-reported",
      },
      pillFeedback: [
        ...Object.entries(feedback)
        .filter((entry): entry is [string, Sentiment] => Boolean(entry[1]))
        .map(([key, sentiment]) => ({
          key,
          rawValue: raw[key] ?? key,
          sentiment,
        })),
        ...(sliderArmed && sliderValue !== 50 ? [{
          key: "overallFeel",
          rawValue: sliderValue,
          sentiment: (sliderValue <= 25 ? "strongNegative" : sliderValue < 45 ? "negative" : sliderValue >= 75 ? "strongPositive" : "positive") as Sentiment,
        }] : []),
        ...(photoReaction ? [{ key: "photoFeel", rawValue: `photo_${photo + 1}`, sentiment: photoReaction as Sentiment }] : []),
      ],
    };
    saveUserDecision(stored)
      .then(getUserDecisions)
      .then((decisions) => {
        setHistory(decisions);
        localStorage.setItem(
          "ecarstrade:mechanical-profile",
          JSON.stringify(buildProfiles(decisions)),
        );
        scheduleReviewAfterIdle(decisions);
      })
      .catch(console.error);
    const nextRejects = { ...modelRejects };
    const nextSuppressed = new Set(suppressedModels);
    if (value === "no") {
      nextRejects[car.model] = (nextRejects[car.model] || 0) + 1;
      if (nextRejects[car.model] >= 2) nextSuppressed.add(car.model);
      setModelRejects(nextRejects);
      setSuppressedModels(nextSuppressed);
    }
    window.setTimeout(() => {
      setOrder((current) =>
        current.filter((position) => cars[position]?.id !== car.id),
      );
      setIndex(0);
      setPhoto(0);
      setFeedback({});
      resetSlider();
      setPhotoReaction(null);
      setOpen(true);
      setLeaving("");
    }, 220);
    window.setTimeout(() => setLocked(false), 300);
    window.setTimeout(() => setToast(null), 1600);
  };
  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}feed.json?ts=${Date.now()}`, {
        cache: "no-store",
      }).then(async (response) => {
        if (!response.ok) throw new Error("Свежая выдача пока не опубликована");
        return (await response.json()) as { cars: Car[] };
      }),
      getUserDecisions(),
    ])
      .then(([feed, decisions]) => {
        setHistory(decisions);
        if (getActiveProfile() === "mvisl") {
          if (!localStorage.getItem(INITIAL_PREFERENCES_KEY)) {
            saveInitialPreferences(CURRENT_USER_INITIAL_PREFERENCES);
          }
          setOnboarding("done");
        } else if (localStorage.getItem(INITIAL_PREFERENCES_KEY)) setOnboarding("done");
        else if (decisions.length > 0) {
          saveInitialPreferences(CURRENT_USER_INITIAL_PREFERENCES);
          setOnboarding("done");
        } else setOnboarding("needed");
        const freshCars = feed.cars
          .map((item) => ({
            ...item,
            photos: item.photos.map(fullSizePhoto),
          }))
          .filter(isEligibleListing);
        setCars(freshCars);
        const recent = decisions.filter(
          (item) =>
            item.decision === "dislike" &&
            Date.now() - item.createdAt < 60 * 60 * 1000,
        );
        const counts: Record<string, number> = {};
        recent.forEach((item) => {
          counts[item.carSnapshot.model] =
            (counts[item.carSnapshot.model] || 0) + 1;
        });
        const suppressed = new Set(
          Object.entries(counts)
            .filter(([, count]) => count >= 2)
            .map(([model]) => model),
        );
        setModelRejects(counts);
        setSuppressedModels(suppressed);
        const decidedIds = new Set(decisions.map((item) => item.carId));
        const candidates = freshCars.filter(
          (candidate) =>
            !decidedIds.has(candidate.id) &&
            !suppressed.has(candidate.model) &&
            !priceTooHigh(rankableFromCar(candidate), decisions),
        );
        const profile = buildProfiles(decisions).longTermProfile;
        const ranked = rankAndDiversify(
          candidates.map(rankableFromCar),
          profile,
          12,
          decisions,
        );
        setOrder(
          ranked.map((row) =>
            freshCars.findIndex((item) => item.id === row.car.id),
          ),
        );
        setIndex(0);
      })
      .catch(console.error);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!car) return;
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
      if (["y", "Y", "ArrowUp", "Enter"].includes(event.key)) decide("yes");
      if (["n", "N", "ArrowDown"].includes(event.key)) decide("no");
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });
  useEffect(() => {
    if (cars[order[index + 1]])
      cars[order[index + 1]].photos.slice(0, 3).forEach((src) => {
        new Image().src = src;
      });
  }, [index]);
  const cycle = (key: string) =>
    setFeedback((current) => {
      const next = { ...current };
      if (!next[key]) next[key] = "positive";
      else if (next[key] === "positive" || next[key] === "strongPositive") next[key] = "negative";
      else delete next[key];
      return next;
    });
  const startLongPress = (key: string) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressedKey.current = null;
    longPressTimer.current = setTimeout(() => {
      setFeedback((current) => ({
        ...current,
        [key]: current[key] === "negative" || current[key] === "strongNegative"
          ? "strongNegative"
          : "strongPositive",
      }));
      longPressedKey.current = key;
      navigator.vibrate?.(25);
      window.setTimeout(() => {
        if (longPressedKey.current === key) longPressedKey.current = null;
      }, 1000);
      longPressTimer.current = null;
    }, 550);
  };
  const stopLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };
  const clickPill = (key: string) => {
    if (longPressedKey.current === key) {
      longPressedKey.current = null;
      return;
    }
    cycle(key);
  };
  if (onboarding === "loading") return <main className="v3-shell" />;
  if (onboarding === "needed") return (
    <main className="v3-shell onboarding-shell">
      <section className="onboarding-card">
        <span>Начальный профиль</span>
        <h1>Какая машина тебе нужна?</h1>
        <p>Напиши обычными словами: что обязательно, что нравится и что вообще не показывать.</p>
        <textarea value={initialText} onChange={(event) => setInitialText(event.target.value)} placeholder="Например: никаких фургонов и минивэнов; нужен полноценный задний ряд; дизель и автомат предпочтительны…" />
        <button disabled={initialText.trim().length < 12} onClick={() => { saveInitialPreferences(initialText); setOnboarding("done"); }}>Начать подбор</button>
        <small>Это станет начальным профилем. Дальше он будет уточняться по решениям, а не заменять их.</small>
      </section>
    </main>
  );
  if (showProfile)
    return (
      <ProfilePanel onClose={() => setShowProfile(false)} onLock={onLock} />
    );
  if (showWatchlist)
    return <WatchlistPanel onClose={() => setShowWatchlist(false)} />;
  if (!car) {
    const summary = buildSessionSummary(history);
    const refresh = async () => {
      setSearching(true);
      const [response, decisions] = await Promise.all([
        fetch(`${import.meta.env.BASE_URL}feed.json?ts=${Date.now()}`, {
          cache: "no-store",
        }),
        getUserDecisions(),
      ]);
      setHistory(decisions);
      const feed = (await response.json()) as { cars: Car[] };
      const decidedIds = new Set(decisions.map((item) => item.carId));
      const freshCars = feed.cars
        .map((item) => ({ ...item, photos: item.photos.map(fullSizePhoto) }))
        .filter(
          (item) =>
            isEligibleListing(item) && !decidedIds.has(item.id),
        );
      setCars(freshCars);
      const profile = buildProfiles(decisions).longTermProfile;
      const ranked = rankAndDiversify(
        freshCars.map(rankableFromCar),
        profile,
        12,
        decisions,
      );
      setOrder(
        ranked.map((row) =>
          freshCars.findIndex((item) => item.id === row.car.id),
        ),
      );
      setIndex(0);
      setPhoto(0);
      setFeedback({});
      setSearching(false);
    };
    return (
      <main className="v3-shell">
        <header className="v3-nav">
          <b>eCarsTrade</b>
          <div>
            <span>0 новых</span>
            <button
              className="lock-app"
              onClick={() => setShowProfile(true)}
              aria-label="Профиль"
            >
              <IconUser />
            </button>
            <button
              className="lock-app"
              onClick={onLock}
              aria-label="Заблокировать приложение"
            >
              <IconLock />
            </button>
          </div>
        </header>
        <section className="decision-result">
          <IconCheck />
          <h1>
            {searching
              ? "Проверяю фиксированные цены…"
              : order.length
                ? "Серия просмотрена"
                : "Свежих вариантов пока нет"}
          </h1>
          <p>
            {summary.decisionsCount
              ? summary.phrase
              : "Архивные объявления и машины без реальной цены скрыты."}
          </p>
          {summary.decisionsCount > 0 && (
            <div className="session-summary">
              <span>{summary.decisionsCount} машин просмотрено</span>
              <span>{summary.likesCount} понравились</span>
              {summary.strongestPositive && <span>главный плюс: {summary.strongestPositive}</span>}
              {summary.strongestNegative && <span>главный стоп-фактор: {summary.strongestNegative}</span>}
            </div>
          )}
          <button onClick={refresh}>
            {searching ? "Собираю подборку…" : "Следующая подборка"}
          </button>
          <button className="summary-secondary" onClick={() => setShowProfile(true)}>
            Посмотреть профиль
          </button>
        </section>
      </main>
    );
  }
  const specs = [
    ["make", car.make, IconCar],
    ["model", car.model, IconCar],
    ["price", car.price, IconCurrencyEuro],
    ["year", car.year, IconCalendar],
    ["mileage", car.mileage, IconRoad],
    ["transmission", car.gearbox, IconAutomaticGearbox],
    ["fuel", car.fuel, IconGasStation],
    ["engine", car.engine, IconEngine],
    ["body", car.body, IconCar],
    ["color", car.color, IconPalette],
    ["visualAppeal", "Дизайн", IconSparkles],
  ] as const;
  const counts = {
    bad: car.report.filter((x) => x.kind === "bad").length,
    warn: car.report.filter((x) => x.kind === "warn").length,
    ok: car.report.filter((x) => x.kind === "ok").length,
  };
  const numericPrice = Number(car.price.replace(/\D/g, "")) || undefined;
  return (
    <main className="v3-shell">
      <header className="v3-nav">
        <b>eCarsTrade</b>
        <div>
          <span>{order.length - index} новых</span>
          <button className="lock-app watchlist-trigger" onClick={() => setShowWatchlist(true)} aria-label="Понравившиеся машины"><IconHeart /></button>
          <button
            className="lock-app"
            onClick={() => setShowProfile(true)}
            aria-label="Профиль"
          >
            <IconUser />
          </button>
          <button
            className="lock-app"
            onClick={onLock}
            aria-label="Заблокировать приложение"
          >
            <IconLock />
          </button>
        </div>
      </header>
      <article className={`v3-card ${leaving}`}>
        <button className="evidence-toggle evidence-toggle-left" onClick={() => setEvidencePanel(evidencePanel === "benefits" ? null : "benefits")} aria-label="Преимущества"><IconMenu2 /></button>
        <button className="evidence-toggle evidence-toggle-right" onClick={() => setEvidencePanel(evidencePanel === "pitfalls" ? null : "pitfalls")} aria-label="Риски и повреждения"><IconMenu2 /></button>
        <aside className={`evidence-side evidence-benefits ${evidencePanel === "benefits" ? "mobile-open" : ""}`}><h3>Преимущества</h3>{car.report.filter((item) => item.kind === "ok").map((item) => <p key={item.text}>👍 {item.text}</p>)}</aside>
        <aside className={`evidence-side evidence-pitfalls ${evidencePanel === "pitfalls" ? "mobile-open" : ""}`}><h3>Повреждения и риски</h3>{car.report.filter((item) => item.kind === "bad" || item.kind === "warn").map((item) => <p key={item.text}>⚠️ {item.text}</p>)}</aside>
        <section
          className="v3-gallery"
          onTouchStart={(e) => {
            touch.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const d = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(d) > 45) move(d > 0 ? -1 : 1);
          }}
        >
          <img src={fullSizePhoto(car.photos[photo])} alt={car.name} />
          {car.sourceUrl ? (
            <a
              className="source"
              href={car.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {car.origin} ↗
            </a>
          ) : (
            <span className="source source-missing">Ссылка на исходное объявление недоступна</span>
          )}
          <button className={`photo-price ${priceQuality}`} onClick={(event) => { event.stopPropagation(); setPricePopover(!pricePopover); }}>
            {car.price}
            <span className={`price-mini-meter ${priceQuality}`} style={{ "--price-position": `${pricePosition}%` } as React.CSSProperties}><i /></span>
          </button>
          {pricePopover && <div className="price-popover" onPointerDown={(event) => event.stopPropagation()}><strong>{priceQuality === "good" ? "Хорошая цена" : priceQuality === "bad" ? "Цена выше ориентира" : "Сравнение недоступно"}</strong><span>{priceQuality === "unknown" ? "Для этой модели пока нет минимум двух сопоставимых объявлений в локальной выборке. Мы не подставляем догадку." : `После известных расходов: €${Math.round((displayedPrice ?? 0) + importAddons).toLocaleString("ru-RU")}. Ориентир рынка: €${Math.round(comparisonPrice ?? 0).toLocaleString("ru-RU")} · ${car.localMarketSampleSize ?? 0} объявлений AutoDiler (${car.localMarketMatch === "model" ? "та же модель" : "та же марка и близкий год"}).`}</span></div>}
          <span className="vat">VAT deductible</span>
          <button
            className="arrow prev"
            onClick={() => move(-1)}
            aria-label="Предыдущее фото"
          >
            <IconArrowLeft />
          </button>
          <button
            className="arrow next"
            onClick={() => move(1)}
            aria-label="Следующее фото"
          >
            <IconArrowRight />
          </button>
          {car.critical && (
            <div className="critical">
              Критично · {car.critical.toLowerCase()}
            </div>
          )}
          <div className="car-caption">
            <h1>{car.name}</h1>
            <p>
              {car.year} · {car.fuel} · {car.body} · {car.gearbox}
            </p>
          </div>
          <div className="previews">
            {car.photos.slice(0, 5).map((src, i) => (
              <button
                className={i === photo ? "active" : ""}
                onMouseEnter={() => setPhoto(i)}
                onClick={() => { setPhoto(i); setPhotoModal(true); }}
                key={src}
                aria-label={`Фото ${i + 1}`}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        </section>
        {photoModal && <div className="photo-modal" role="dialog" aria-modal="true" onClick={() => setPhotoModal(false)}><div className="photo-modal-inner" onClick={(event) => event.stopPropagation()}><button className="photo-modal-close" onClick={() => setPhotoModal(false)}>×</button><img src={fullSizePhoto(car.photos[photo])} alt={car.name} /><div className="photo-reactions"><button className={photoReaction?.includes("Negative") ? "selected negative" : "negative"} onPointerDown={() => { photoLongPress.current = setTimeout(() => setPhotoReaction("strongNegative"), 500); }} onPointerUp={() => { if (photoLongPress.current) clearTimeout(photoLongPress.current); if (!photoReaction?.includes("strongNegative")) setPhotoReaction("negative"); }}>👎</button><button className={photoReaction?.includes("Positive") ? "selected positive" : "positive"} onPointerDown={() => { photoLongPress.current = setTimeout(() => setPhotoReaction("strongPositive"), 500); }} onPointerUp={() => { if (photoLongPress.current) clearTimeout(photoLongPress.current); if (!photoReaction?.includes("strongPositive")) setPhotoReaction("positive"); }}>👍</button></div></div></div>}
        <div className="listing-action">
          {car.sourceUrl ? (
            <a href={car.sourceUrl} target="_blank" rel="noopener noreferrer">
              Открыть на eCarsTrade ↗
            </a>
          ) : (
            <span>Ссылка на исходное объявление недоступна</span>
          )}
        </div>
        <section className={`feel-slider ${sliderArmed ? "armed" : ""}`}>
          <div className="feel-slider-row">
            <span aria-hidden="true">😞</span>
            <div className="feel-track"><input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sliderValue}
              aria-label="Тонкая оценка автомобиля"
              onChange={(event) => { setSliderValue(Number(event.target.value)); setSliderArmed(true); }}
              onPointerUp={armSliderReset}
              onKeyUp={armSliderReset}
            />{sliderArmed && <button className="feel-confirm" style={{ left: `${sliderValue}%` }} aria-label="Подтвердить тонкую оценку" onClick={() => { if (sliderResetTimer.current) clearTimeout(sliderResetTimer.current); sliderResetTimer.current = null; decide(sliderValue >= 50 ? "yes" : "no"); }}>Подтвердить</button>}</div>
            <span aria-hidden="true">😄</span>
          </div>
        </section>
        <div className="decision-zone">
          <button
            className="edge-decision no"
            onClick={() => decide("no")}
            disabled={locked}
          >
            <IconX />
            <span>Нет</span>
          </button>
          <section className="pills">
            {specs.map(([key, label, Icon]) => {
              const state = feedback[key];
              const secondary = ["engine", "color", "body", "visualAppeal"].includes(key);
              return (
                <button
                  key={key}
                  className={`${state || ""} ${secondary ? "secondary-pill" : "primary-pill"}`.trim()}
                  onPointerDown={() => startLongPress(key)}
                  onPointerUp={stopLongPress}
                  onPointerCancel={() => { stopLongPress(); longPressedKey.current = null; }}
                  onPointerLeave={stopLongPress}
                  onClick={() => clickPill(key)}
                >
                  {state === "strongPositive" || state === "strongNegative" ? (
                    <span className="double-thumb" aria-label={state === "strongPositive" ? "Очень нравится" : "Очень не нравится"}>
                      {state === "strongPositive" ? <><IconThumbUp /><IconThumbUp /></> : <><IconThumbDown /><IconThumbDown /></>}
                    </span>
                  ) : state === "positive" ? (
                    <IconThumbUp className="sent" />
                  ) : state === "negative" ? (
                    <IconThumbDown className="sent" />
                  ) : (
                    <Icon />
                  )}
                  {label}
                </button>
              );
            })}
          </section>
          <button
            className="edge-decision yes"
            onClick={() => decide("yes")}
            disabled={locked}
          >
            <IconCheck />
            <span>Да</span>
          </button>
        </div>
        {numericPrice && (
          <ImportCostCard
            price={numericPrice}
            priceMode={car.priceMode ?? "unknown"}
            platformFee={car.platformFee}
            exportDeclarationFee={car.exportDeclarationFee}
            listingCountry={car.listingCountry}
          />
        )}
        <section className={`condition ${open ? "open" : ""}`}>
          <button
            className="condition-head"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            <span>
              <IconClipboardCheck />
              Отчёт состояния
            </span>
            <span className="counts">
              <i className="red" />
              {counts.bad} <i className="amber" />
              {counts.warn} <i className="green" />
              {counts.ok} <IconChevronDown />
            </span>
          </button>
          {open && (
            <div className="report">
              {car.report.map((item, i) => (
                <div className={item.kind} key={i}>
                  {item.kind === "ok" ? (
                    <IconCheck />
                  ) : item.kind === "bad" ? (
                    <IconX />
                  ) : (
                    <span>!</span>
                  )}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </article>
      {toast && (
        <div className={`decision-toast ${toast}`} role="status">
          {toast === "yes" ? <IconCheck /> : <IconX />}
          <span>
            {toast === "yes" ? "Добавлено в список" : "Автомобиль отклонён"}
          </span>
        </div>
      )}
    </main>
  );
}
