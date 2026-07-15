import { useEffect, useRef, useState } from 'react';
import {
  IconArrowLeft,
  IconArrowRight,
  IconAutomaticGearbox as IconTransmission,
  IconCalendar,
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
} from '@tabler/icons-react';
import { saveDecision } from './api';
import './v3.css';
import './v3-overrides.css';

type Sentiment = 'positive' | 'negative';

const base = 'https://ecarstrade.com/thumbnails/carsphotos/7360001-7370000/7360586/';
const photos = Array.from(
  { length: 8 },
  (_, index) => `${base}photo_${String(index + 1).padStart(3, '0')}/780x0__r.jpg`,
);
const specs = [
  ['year', '2022', IconCalendar],
  ['mileage', '14 639 км', IconRoad],
  ['gearbox', 'Автомат', IconTransmission],
  ['fuel', 'Дизель', IconGasStation],
  ['engine', '2.0 · 190 л.с.', IconEngine],
  ['color', 'Красный', IconPalette],
  ['price', '€23 000', IconCurrencyEuro],
] as const;
const report = [
  { kind: 'bad', text: 'Заявлены прошлые повреждения на €10 074,82' },
  { kind: 'warn', text: 'Оценка ремонта около €3 735 без VAT' },
  { kind: 'ok', text: 'Коробка передач — без замечаний' },
  { kind: 'ok', text: '5 мест и полноценный задний ряд' },
] as const;

export default function V3() {
  const [photo, setPhoto] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, Sentiment>>({});
  const [open, setOpen] = useState(true);
  const [leaving, setLeaving] = useState('');
  const [locked, setLocked] = useState(false);
  const [decision, setDecision] = useState<'yes' | 'no' | null>(null);
  const touch = useRef(0);

  const move = (delta: number) => setPhoto((current) => (current + delta + photos.length) % photos.length);
  const decide = (value: 'yes' | 'no') => {
    if (locked) return;
    setLocked(true);
    setLeaving(value);
    const record = {
      carId: '7360586',
      decision: value === 'yes' ? 'like' as const : 'dislike' as const,
      feedback,
      at: Date.now(),
    };
    localStorage.setItem('ecarstrade:last-decision', JSON.stringify(record));
    if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') {
      saveDecision(record, 1).catch(console.error);
    }
    window.setTimeout(() => {
      setDecision(value);
      setLeaving('');
    }, 220);
    window.setTimeout(() => setLocked(false), 300);
  };

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
      if (['y', 'Y', 'ArrowUp', 'Enter'].includes(event.key)) decide('yes');
      if (['n', 'N', 'ArrowDown'].includes(event.key)) decide('no');
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  });

  const cycle = (key: string) =>
    setFeedback((current) => {
      const next = { ...current };
      if (!next[key]) next[key] = 'positive';
      else if (next[key] === 'positive') next[key] = 'negative';
      else delete next[key];
      return next;
    });

  return (
    <main className="v3-shell">
      <header className="v3-nav"><b>eCarsTrade</b><span>14 новых</span></header>
      {decision ? (
        <section className="decision-result" aria-live="polite">
          {decision === 'yes' ? <IconCheck /> : <IconX />}
          <h1>{decision === 'yes' ? 'Добавлено в список' : 'Автомобиль отклонён'}</h1>
          <p>Решение и оценки параметров сохранены в этом браузере.</p>
          <button onClick={() => setDecision(null)}>Вернуть карточку</button>
        </section>
      ) : (
      <article className={`v3-card ${leaving}`}>
        <section
          className="v3-gallery"
          onTouchStart={(event) => { touch.current = event.touches[0].clientX; }}
          onTouchEnd={(event) => {
            const distance = event.changedTouches[0].clientX - touch.current;
            if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
          }}
        >
          <img src={photos[photo]} alt="Ford Kuga Vignale" />
          <span className="source">Германия · Fixed Price</span>
          <span className="photo-price">€23 000</span>
          <span className="vat">VAT deductible</span>
          <button className="arrow prev" onClick={() => move(-1)} aria-label="Предыдущее фото"><IconArrowLeft /></button>
          <button className="arrow next" onClick={() => move(1)} aria-label="Следующее фото"><IconArrowRight /></button>
          <div className="critical">Критично · заявлены прошлые повреждения</div>
          <div className="car-caption"><h1>Ford Kuga Vignale 2.0 EcoBlue</h1><p>2022 · Дизель · SUV · Автомат</p></div>
          <div className="previews">
            {photos.slice(0, 5).map((source, index) => (
              <button className={index === photo ? 'active' : ''} onClick={() => setPhoto(index)} key={source} aria-label={`Фото ${index + 1}`}><img src={source} alt="" /></button>
            ))}
          </div>
        </section>
        <section className="pills">
          {specs.map(([key, label, Icon]) => {
            const state = feedback[key];
            return <button key={key} className={state || ''} onClick={() => cycle(key)}><Icon />{state === 'positive' && <IconThumbUp className="sent" />}{state === 'negative' && <IconThumbDown className="sent" />}{label}</button>;
          })}
        </section>
        <div className="actions">
          <button className="no" onClick={() => decide('no')} disabled={locked}><IconX />Нет</button>
          <button className="yes" onClick={() => decide('yes')} disabled={locked}><IconCheck />Да</button>
        </div>
        <section className={`condition ${open ? 'open' : ''}`}>
          <button className="condition-head" onClick={() => setOpen(!open)} aria-expanded={open}>
            <span><IconClipboardCheck />Отчёт состояния</span>
            <span className="counts"><i className="red" />1 <i className="amber" />1 <i className="green" />2 <IconChevronDown /></span>
          </button>
          {open && <div className="report">{report.map((item, index) => <div className={item.kind} key={index}>{item.kind === 'ok' ? <IconCheck /> : item.kind === 'bad' ? <IconX /> : <span>!</span>}<span>{item.text}</span></div>)}</div>}
        </section>
      </article>
      )}
    </main>
  );
}
