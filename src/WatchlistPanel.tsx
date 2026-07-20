import { useEffect, useMemo, useState } from "react";
import { IconArrowLeft, IconExternalLink, IconHeart } from "@tabler/icons-react";
import { getUserDecisions, type UserDecision } from "./storage";

type SortMode = "date" | "make" | "feeling";
const feeling = (row: UserDecision) => {
  const value = row.pillFeedback.find((item) => item.key === "overallFeel")?.rawValue;
  return typeof value === "number" ? value : row.decision === "like" ? 50 : 0;
};

export default function WatchlistPanel({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<UserDecision[]>([]);
  const [sort, setSort] = useState<SortMode>("date");
  useEffect(() => { getUserDecisions().then((items) => setRows(items.filter((row) => row.decision === "like"))); }, []);
  const sorted = useMemo(() => [...rows].sort((a, b) => sort === "make" ? `${a.carSnapshot.make} ${a.carSnapshot.model}`.localeCompare(`${b.carSnapshot.make} ${b.carSnapshot.model}`) : sort === "feeling" ? feeling(b) - feeling(a) : b.createdAt - a.createdAt), [rows, sort]);
  return <main className="watchlist-page">
    <header className="watchlist-nav"><button onClick={onClose}><IconArrowLeft />К карточкам</button><b><IconHeart />Понравилось</b><span>{rows.length} машин</span></header>
    <div className="watchlist-sort"><button className={sort === "date" ? "active" : ""} onClick={() => setSort("date")}>По дате</button><button className={sort === "make" ? "active" : ""} onClick={() => setSort("make")}>По марке</button><button className={sort === "feeling" ? "active" : ""} onClick={() => setSort("feeling")}>По оценке</button></div>
    <section className="watchlist-grid">{sorted.map((row) => <article key={row.id}><div><h2>{row.carSnapshot.make} {row.carSnapshot.model}</h2><p>{row.carSnapshot.year ?? "—"} · {row.carSnapshot.mileage?.toLocaleString("ru-RU") ?? "—"} км · {row.carSnapshot.price ? `€${row.carSnapshot.price.toLocaleString("ru-RU")}` : "Цена не указана"}</p></div><strong>{feeling(row) >= 75 ? "😄" : feeling(row) <= 25 ? "😞" : "🙂"}</strong>{row.carSnapshot.sourceUrl && <a href={row.carSnapshot.sourceUrl} target="_blank" rel="noopener noreferrer">Оригинал <IconExternalLink /></a>}</article>)}</section>
    {!sorted.length && <p className="watchlist-empty">Пока нет машин в корзине.</p>}
  </main>;
}
