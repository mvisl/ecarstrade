import { useEffect, useState } from "react";
import { getUserDecisions } from "./storage";
import { buildProfiles } from "./learning";
import { priceSegment, rankAndDiversify, type RankableCar } from "./ranking";
import "./logic-page.css";

type FeedCar = {
  id: string; make: string; model: string; year: string; mileage: string;
  gearbox: string; fuel: string; engine: string; color: string; body: string;
  price: string; vatDeductible?: boolean; critical?: string;
};

export default function LogicPage() {
  const [rows, setRows] = useState<ReturnType<typeof rankAndDiversify>>([]);
  const [decisions, setDecisions] = useState<Awaited<ReturnType<typeof getUserDecisions>>>([]);
  useEffect(() => {
    getUserDecisions().then(setDecisions);
    fetch(`${import.meta.env.BASE_URL}feed.json?logic=${Date.now()}`)
      .then((r) => r.json())
      .then(({ cars }: { cars: FeedCar[] }) => getUserDecisions().then((history) => {
        const profile = buildProfiles(history).longTermProfile;
        const ranked = rankAndDiversify(cars.map((car): RankableCar => ({
          id: car.id, make: car.make, model: car.model, year: Number(car.year),
          mileage: Number(car.mileage.replace(/\D/g, "")) || undefined,
          transmission: car.gearbox, fuel: car.fuel, engine: car.engine,
          color: car.color, bodyType: car.body, price: Number(car.price.replace(/\D/g, "")) || undefined,
          vatDeductible: car.vatDeductible, damageStatus: car.critical,
        })), profile, 20, history);
        setRows(ranked);
      }));
  }, []);
  const priceSignals = decisions.flatMap((d) => d.pillFeedback
    .filter((p) => p.key === "price")
    .map((p) => ({ price: d.carSnapshot.price, sentiment: p.sentiment, car: `${d.carSnapshot.make} ${d.carSnapshot.model}` })));
  return <main className="logic-page">
    <header><a href={import.meta.env.BASE_URL}>← К карточкам</a><h1>Как строится выборка</h1><span>временная диагностическая страница</span></header>
    <section className="logic-card">
      <h2>Ценовой сигнал</h2>
      <p>Цена имеет повышенный вес. Двойной минус по цене сужает следующую серию сразу; это не абсолютный запрет, но машины заметно выше сигнала исключаются.</p>
      <div className="logic-chips">{priceSignals.slice(-12).map((s, i) => <span className={s.sentiment.includes("Negative") ? "bad" : "good"} key={i}>{s.sentiment} · {s.price ? `€${s.price.toLocaleString("ru-RU")}` : "без цены"} · {s.car}</span>)}</div>
    </section>
    <section className="logic-card"><h2>Следующие кандидаты</h2><div className="logic-list">{rows.map(({ car, score }, i) => <article key={car.id}><b>{i + 1}. {car.make} {car.model}</b><span>€{car.price?.toLocaleString("ru-RU") ?? "—"} · {priceSegment(car)}</span><small>итог {score.total.toFixed(2)} · цена {score.priceReason} ({score.priceContext.toFixed(2)}) · предпочтения {score.preferences.toFixed(2)} · объективно {score.objective.toFixed(2)}</small></article>)}</div></section>
  </main>;
}
