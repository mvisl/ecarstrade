import { useEffect, useState } from "react";
import { IconArrowLeft, IconLock } from "@tabler/icons-react";
import { getUserDecisions, type UserDecision } from "./storage";
import { buildProfiles, type PreferenceSignal } from "./learning";
const labels: Record<string, string> = {
  make: "Марка",
  model: "Модель",
  year: "Год",
  mileage: "Пробег",
  transmission: "Коробка",
  fuel: "Топливо",
  engine: "Двигатель",
  body: "Кузов",
  price: "Цена",
  color: "Цвет",
  vat: "VAT",
  damage: "Повреждения",
};
const title = (signal: PreferenceSignal) =>
  `${labels[signal.key] ?? signal.key}: ${signal.value}`;
export default function ProfilePanel({
  onClose,
  onLock,
}: {
  onClose: () => void;
  onLock: () => void;
}) {
  const [data, setData] = useState<ReturnType<typeof buildProfiles> | null>(
    null,
  );
  const [history, setHistory] = useState<UserDecision[]>([]);
  useEffect(() => {
    getUserDecisions().then((rows) => { setData(buildProfiles(rows)); setHistory(rows); });
  }, []);
  const stable =
    data?.longTermProfile.filter(
      (x) => x.confidence >= 1 && Math.abs(x.score) > 0.02,
    ) ?? [];
  const checking =
    data?.longTermProfile
      .filter((x) => !stable.includes(x))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 12) ?? [];
  const group = (items: PreferenceSignal[], positive: boolean) =>
    items.filter((x) => (positive ? x.score > 0 : x.score < 0));
  return (
    <main className="profile-page">
      <header className="profile-nav">
        <button onClick={onClose}>
          <IconArrowLeft />К карточкам
        </button>
        <b>Профиль предпочтений</b>
        <button onClick={onLock}>
          <IconLock />
          Заблокировать
        </button>
      </header>
      {!data ? (
        <p>Собираю профиль…</p>
      ) : (
        <div className="profile-columns">
          <SignalGroup title="Похоже, нравится" items={group(stable, true)} />
          <SignalGroup
            title="Похоже, не нравится"
            items={group(stable, false)}
          />
          <SignalGroup title="Пока проверяем" items={checking} />
        </div>
      )}
      <section className="profile-history">
        <h2>История и список</h2>
        {history.slice(-20).reverse().map((row) => (
          <article key={row.id}>
            <div><strong>{row.carSnapshot.make} {row.carSnapshot.model}</strong><small>{row.decision === "like" ? "В списке" : "Отклонено"}</small></div>
            {row.carSnapshot.sourceUrl ? <a href={row.carSnapshot.sourceUrl} target="_blank" rel="noopener noreferrer">Оригинал ↗</a> : <span>Ссылка недоступна</span>}
          </article>
        ))}
      </section>
    </main>
  );
}
function SignalGroup({
  title: heading,
  items,
}: {
  title: string;
  items: PreferenceSignal[];
}) {
  return (
    <section className="profile-group">
      <h2>{heading}</h2>
      {items.length ? (
        items.map((item) => (
          <article key={`${item.key}:${item.value}`}>
            <div>
              <strong>{title(item)}</strong>
              <small>
                {item.explicitSamples} явных · {item.implicitSamples} косвенных
              </small>
            </div>
            <span>{Math.round(item.confidence * 100)}%</span>
          </article>
        ))
      ) : (
        <p>Пока недостаточно подтверждений.</p>
      )}
    </section>
  );
}
