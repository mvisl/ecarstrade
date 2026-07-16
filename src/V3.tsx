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
  IconLock,
  IconPalette,
  IconUser,
  IconRoad,
  IconThumbDown,
  IconThumbUp,
  IconX,
} from "@tabler/icons-react";
import "./v3.css";
import "./v3-overrides.css";
import "./v3-layout.css";
import { getUserDecisions, saveUserDecision } from "./storage";
import { buildProfiles } from "./learning";
import ProfilePanel from "./ProfilePanel";
import "./profile.css";
import { nextAllowedPosition, rankAndDiversify } from "./ranking";
import { scheduleReviewAfterIdle } from "./reviewScheduler";
import ImportCostCard from "./ImportCostCard";
import "./import-cost.css";

type Sentiment = "positive" | "negative";
type Car = {
  id: string;
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
};
const photoUrls = (range: string, id: string, names: string[]) =>
  names.map(
    (name) =>
      `https://ecarstrade.com/thumbnails/carsphotos/${range}/${id}/${name}/780x0__r.jpg`,
  );
const cars: Car[] = [
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
const INITIAL_ORDER = [0, 3, 1, 4, 2, 5];
const HARD_EXCLUDED_MODELS = new Set(["Kuga"]);
const isEligibleListing = (car: Car) =>
  !HARD_EXCLUDED_MODELS.has(car.model) &&
  /^€\d/.test(car.price.replace(/\s/g, "")) &&
  !car.origin.includes("Архив");
export default function V3({ onLock }: { onLock: () => void }) {
  const [order, setOrder] = useState(() =>
    INITIAL_ORDER.filter(
      (position) =>
        Boolean(cars[position]) && isEligibleListing(cars[position]),
    ),
  );
  const [index, setIndex] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, Sentiment>>({});
  const [open, setOpen] = useState(true);
  const [leaving, setLeaving] = useState("");
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState<"yes" | "no" | null>(null);
  const [searching, setSearching] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [modelRejects, setModelRejects] = useState<Record<string, number>>({});
  const [suppressedModels, setSuppressedModels] = useState<Set<string>>(
    new Set(),
  );
  const touch = useRef(0);
  const car = cars[order[index]];
  const move = (delta: number) =>
    car &&
    setPhoto(
      (current) => (current + delta + car.photos.length) % car.photos.length,
    );
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
    };
    const stored = {
      id: crypto.randomUUID(),
      carId: car.id,
      decision: value === "yes" ? ("like" as const) : ("dislike" as const),
      createdAt: Date.now(),
      carSnapshot: {
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
      pillFeedback: Object.entries(feedback)
        .filter((entry): entry is [string, Sentiment] => Boolean(entry[1]))
        .map(([key, sentiment]) => ({
          key,
          rawValue: raw[key] ?? key,
          sentiment,
        })),
    };
    saveUserDecision(stored)
      .then(getUserDecisions)
      .then((decisions) => {
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
      setOpen(true);
      setLeaving("");
    }, 220);
    window.setTimeout(() => setLocked(false), 300);
    window.setTimeout(() => setToast(null), 1600);
  };
  useEffect(() => {
    getUserDecisions()
      .then((decisions) => {
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
        setOrder(
          INITIAL_ORDER.filter((position) => {
            const candidate = cars[position];
            return (
              Boolean(candidate) &&
              isEligibleListing(candidate) &&
              !decidedIds.has(candidate.id) &&
              !suppressed.has(candidate.model)
            );
          }),
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
      else if (next[key] === "positive") next[key] = "negative";
      else delete next[key];
      return next;
    });
  if (showProfile)
    return (
      <ProfilePanel onClose={() => setShowProfile(false)} onLock={onLock} />
    );
  if (!car) {
    const refresh = async () => {
      setSearching(true);
      const decisions = await getUserDecisions();
      const profile = buildProfiles(decisions).longTermProfile;
      const ranked = rankAndDiversify(
        cars.filter(isEligibleListing).map((item) => ({
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
        })),
        profile,
        5,
      );
      setOrder(
        ranked.map((row) => cars.findIndex((item) => item.id === row.car.id)),
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
            {order.length
              ? "Вкус записал. Теперь попробую удивить следующей серией."
              : "Kuga исключена. Архивные объявления и машины без реальной цены скрыты."}
          </p>
          <button onClick={refresh}>
            {searching ? "Ищу свежие варианты…" : "Проверить следующую серию"}
          </button>
        </section>
      </main>
    );
  }
  const specs = [
    ["make", car.make, IconCar],
    ["model", car.model, IconCar],
    ["year", car.year, IconCalendar],
    ["mileage", car.mileage, IconRoad],
    ["transmission", car.gearbox, IconAutomaticGearbox],
    ["fuel", car.fuel, IconGasStation],
    ["engine", car.engine, IconEngine],
    ["color", car.color, IconPalette],
    ["price", car.price, IconCurrencyEuro],
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
          <img src={car.photos[photo]} alt={car.name} />
          <span className="source">{car.origin}</span>
          <span className="photo-price">{car.price}</span>
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
                onClick={() => setPhoto(i)}
                key={src}
                aria-label={`Фото ${i + 1}`}
              >
                <img src={src} alt="" />
              </button>
            ))}
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
              return (
                <button
                  key={key}
                  className={state || ""}
                  onClick={() => cycle(key)}
                >
                  <Icon />
                  {state === "positive" && <IconThumbUp className="sent" />}
                  {state === "negative" && <IconThumbDown className="sent" />}
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
            localMarketPrice={car.localMarketPrice}
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
