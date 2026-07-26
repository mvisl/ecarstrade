import { useEffect, useState } from "react";
import { IconArrowLeft, IconLock } from "@tabler/icons-react";
import { getUserDecisions, type UserDecision } from "./storage";
import { buildProfiles, type PreferenceSignal } from "./learning";
import { INITIAL_PREFERENCES_KEY } from "./initialPreferences";
import { getReviewMeta, runReviewNow } from "./reviewScheduler";
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
  visualAppeal: "Внешность",
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
  const [initialPreferences, setInitialPreferences] = useState("");
  const [reviewMeta, setReviewMeta] = useState(getReviewMeta());
  const [reviewResult, setReviewResult] = useState<any>(() => { try { return JSON.parse(localStorage.getItem("ecarstrade:llm-review-result") || "null"); } catch { return null; } });
  const [reviewRunning, setReviewRunning] = useState(false);
  useEffect(() => {
    getUserDecisions().then((rows) => { setData(buildProfiles(rows)); setHistory(rows); });
    setInitialPreferences(localStorage.getItem(INITIAL_PREFERENCES_KEY) || "");
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
  const checkLlm = async () => {
    setReviewRunning(true); setReviewMeta({ ...getReviewMeta(), status: "running" });
    try { const result = await runReviewNow(history); setReviewResult(result); } catch {} finally { setReviewMeta(getReviewMeta()); setReviewRunning(false); }
  };
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
      {initialPreferences && (
        <section className="initial-preferences">
          <div><span>Исходное сообщение</span><strong>Задано тобой до начала просмотра</strong></div>
          <p>{initialPreferences}</p>
          <small>Жёсткие запреты применяются до выдачи. Мягкие предпочтения уточняются решениями.</small>
        </section>
      )}
      <section className="profile-history llm-status">
        <h2>LLM-review</h2>
        <p><strong>Состояние:</strong> {reviewRunning ? "Выполняется" : reviewMeta.status === "ready" ? "Готово" : reviewMeta.status === "error" ? "Ошибка" : history.length < 8 ? "Не запускался" : "Ожидает"}</p>
        <p><strong>Новых решений передано:</strong> {Math.max(0, history.length - reviewMeta.reviewedDecisionCount)} · <strong>HTTP:</strong> {reviewMeta.lastHttpStatus ?? "—"} · <strong>Инсайтов:</strong> {reviewMeta.lastInsightCount ?? 0}</p>
        <p><strong>Request ID:</strong> {reviewMeta.lastRequestId ?? "—"}</p>
        <p><strong>Причина:</strong> {reviewMeta.reason ?? (history.length < 8 ? `Нужно ещё ${8 - history.length} решений` : "Автоматический review ещё не запускался")}</p>
        <div className="llm-actions"><button onClick={checkLlm} disabled={reviewRunning || history.length === 0}>Проверить LLM сейчас</button><button onClick={() => setReviewResult(reviewResult ? reviewResult : JSON.parse(localStorage.getItem("ecarstrade:llm-review-result") || "null"))}>Показать последний ответ</button></div>
        {reviewResult && <pre>{JSON.stringify(reviewResult, null, 2)}</pre>}
      </section>
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
