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
  IconPalette,
  IconRoad,
  IconThumbDown,
  IconThumbUp,
  IconX,
} from "@tabler/icons-react";
import "./v3.css";
import "./v3-overrides.css";
import "./v3-layout.css";

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
    id:"6978220",make:"Skoda",model:"Octavia",name:"Skoda Octavia Break Business 2.0 TDI",year:"2022",mileage:"Пробег закрыт",gearbox:"Автомат",fuel:"Дизель",engine:"2.0 · 116 л.с.",color:"Серый",body:"Универсал",price:"Цена закрыта",origin:"Франция · Архив eCarsTrade",photos:photoUrls("6970001-6980000","6978220",["photo_001","photo_002","photo_003","photo_004","photo_005"]),report:[{kind:"warn",text:"Объявление из архива — актуальность цены нужно перепроверить"},{kind:"warn",text:"COC отсутствует"},{kind:"ok",text:"Автомат, дизель и 5 мест"},{kind:"ok",text:"2022 год"}],
  },
  {
    id:"6167161",make:"Skoda",model:"Karoq",name:"Skoda Karoq Clever 1.5 TSI DSG7",year:"2023",mileage:"28 444 км",gearbox:"Автомат",fuel:"Бензин",engine:"1.5 · 150 л.с.",color:"Серый",body:"SUV",price:"Цена закрыта",origin:"Бельгия · Архив eCarsTrade",photos:photoUrls("6160001-6170000","6167161",["photo_000","photo_001","photo_002","photo_003","photo_004"]),report:[{kind:"warn",text:"Объявление из архива — актуальность цены нужно перепроверить"},{kind:"warn",text:"Есть царапины, смотреть фотографии"},{kind:"ok",text:"Автомат и 5 мест"},{kind:"ok",text:"2023 год и небольшой пробег"}],
  },
  {
    id:"6112318",make:"Mercedes",model:"A 180",name:"Mercedes-Benz A 180d",year:"2023",mileage:"Пробег закрыт",gearbox:"Автомат",fuel:"Дизель",engine:"1.5 · 116 л.с.",color:"Не указан",body:"Хэтчбек",price:"Цена закрыта",origin:"Испания · Архив eCarsTrade",photos:photoUrls("6110001-6120000","6112318",["photo_000","photo_001","photo_002","photo_003","photo_004"]),report:[{kind:"warn",text:"Объявление из архива — цену и пробег нужно перепроверить"},{kind:"ok",text:"Автомат и дизель"},{kind:"ok",text:"2023 год"},{kind:"ok",text:"Компактный легковой автомобиль"}],
  },
];
const pillNames: Record<string, string> = {
  make: "марка Ford",
  model: "модель Kuga",
  year: "свежий год",
  mileage: "небольшой пробег",
  gearbox: "коробка передач",
  fuel: "тип топлива",
  engine: "двигатель",
  color: "цвет",
  price: "цена",
};
function profileInsights() {
  const records = JSON.parse(
    localStorage.getItem("ecarstrade:decisions") || "[]",
  ).slice(-cars.length) as {
    decision: string;
    feedback: Record<string, Sentiment>;
  }[];
  const positive: Record<string, number> = {},
    negative: Record<string, number> = {};
  let budgetTradeoff = false;
  records.forEach((record) => {
    Object.entries(record.feedback || {}).forEach(([key, value]) => {
      const target = value === "positive" ? positive : negative;
      target[key] = (target[key] || 0) + 1;
    });
    if (
      record.decision === "dislike" &&
      record.feedback?.price === "negative" &&
      Object.values(record.feedback).includes("positive")
    )
      budgetTradeoff = true;
  });
  const best = Object.entries(positive)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => pillNames[key]);
  const avoided = Object.entries(negative)
    .sort((a, b) => b[1] - a[1])
    .filter(([key]) => key !== "price")
    .slice(0, 1)
    .map(([key]) => pillNames[key]);
  return [
    budgetTradeoff
      ? "Похоже, характеристики могут нравиться, но бюджет остаётся ограничивающим фактором."
      : null,
    best.length
      ? `Предварительно нравятся: ${best.join(" и ")}. Это пока гипотеза, не жёсткое правило.`
      : "Пока недостаточно явных отметок, чтобы уверенно назвать предпочтения.",
    avoided.length
      ? `Есть осторожный отрицательный сигнал: ${avoided[0]}. Нужны дополнительные подтверждения.`
      : "Непомеченные параметры считаю неизвестными и не использую против вас.",
  ].filter(Boolean) as string[];
}
function initialCardIndex() {
  const records = JSON.parse(
    localStorage.getItem("ecarstrade:decisions") || "[]",
  ) as { carId:string;at: number; feedback: Record<string, Sentiment> }[];
  const latest = records.at(-1);
  if(!latest||Date.now()-latest.at>=60*60*1000)return 0;
  const rejected=cars.find(car=>car.id===latest.carId);
  if(!rejected)return 0;
  const next=cars.findIndex(car=>(latest.feedback?.make!=="negative"||car.make!==rejected.make)&&(latest.feedback?.model!=="negative"||car.model!==rejected.model));
  return next<0?cars.length:next;
}

export default function V3() {
  const [index, setIndex] = useState(initialCardIndex);
  const [photo, setPhoto] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, Sentiment>>({});
  const [open, setOpen] = useState(true);
  const [leaving, setLeaving] = useState("");
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState<"yes" | "no" | null>(null);
  const [searching, setSearching] = useState(false);
  const touch = useRef(0);
  const car = cars[index];
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
    const record = {
      carId: car.id,
      decision: value === "yes" ? "like" : "dislike",
      feedback,
      at: Date.now(),
    };
    const history = JSON.parse(
      localStorage.getItem("ecarstrade:decisions") || "[]",
    );
    localStorage.setItem(
      "ecarstrade:decisions",
      JSON.stringify([...history, record]),
    );
    const veto = feedback.make === "negative" || feedback.model === "negative";
    window.setTimeout(() => {
      setIndex((current) => {
        if(!veto)return current+1;
        const next=cars.findIndex((candidate,candidateIndex)=>candidateIndex>current&&(feedback.make!=="negative"||candidate.make!==car.make)&&(feedback.model!=="negative"||candidate.model!==car.model));
        return next<0?cars.length:next;
      });
      setPhoto(0);
      setFeedback({});
      setOpen(true);
      setLeaving("");
    }, 220);
    window.setTimeout(() => setLocked(false), 300);
    window.setTimeout(() => setToast(null), 1600);
  };
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
    if (cars[index + 1])
      cars[index + 1].photos.slice(0, 3).forEach((src) => {
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
  useEffect(() => {
    if (!cars[index]) localStorage.setItem("ecarstrade:profile-snapshot", JSON.stringify({updatedAt:Date.now(),insights:profileInsights()}));
  }, [index]);
  if (!car) {
    const vetoActive = initialCardIndex() === cars.length;
    const refresh = () => {
      setSearching(true);
      window.setTimeout(() => setSearching(false), 1200);
    };
    return (
      <main className="v3-shell">
        <header className="v3-nav">
          <b>eCarsTrade</b>
          <span>0 новых</span>
        </header>
        <section className="decision-result">
          <IconCheck />
          <h1>{searching ? "Перетряхиваю парковку…" : "Серия просмотрена"}</h1>
          <p>{vetoActive ? "Ford и Kuga сегодня получают выходной. Поищем кого-нибудь ещё." : "Вкус записал. Теперь попробую удивить следующей серией."}</p>
          <button onClick={refresh}>{searching ? "Ищу свежие варианты…" : "Проверить следующую серию"}</button>
        </section>
      </main>
    );
  }
  const specs = [
    ["make", car.make, IconCar],
    ["model", car.model, IconCar],
    ["year", car.year, IconCalendar],
    ["mileage", car.mileage, IconRoad],
    ["gearbox", car.gearbox, IconAutomaticGearbox],
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
  return (
    <main className="v3-shell">
      <header className="v3-nav">
        <b>eCarsTrade</b>
        <span>{cars.length - index} новых</span>
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
          <button className="edge-decision no" onClick={() => decide("no")} disabled={locked}>
            <IconX /><span>Нет</span>
          </button>
          <section className="pills">
            {specs.map(([key, label, Icon]) => {
              const state = feedback[key];
              return (
                <button key={key} className={state || ""} onClick={() => cycle(key)}>
                  <Icon />
                  {state === "positive" && <IconThumbUp className="sent" />}
                  {state === "negative" && <IconThumbDown className="sent" />}
                  {label}
                </button>
              );
            })}
          </section>
          <button className="edge-decision yes" onClick={() => decide("yes")} disabled={locked}>
            <IconCheck /><span>Да</span>
          </button>
        </div>
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
