import { estimateMontenegroImport } from "./importCost";
const money = (value: number) =>
  new Intl.NumberFormat("ru-ME", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
export default function ImportCostCard({
  price,
  priceIncludesVat = false,
  localMarketPrice,
}: {
  price: number;
  priceIncludesVat?: boolean;
  localMarketPrice?: number;
}) {
  const estimate = estimateMontenegroImport({
    price,
    priceIncludesVat,
    sourceVatRate: 21,
    shipping: 900,
    customsRateWithoutOriginProof: 5,
    montenegroVatRate: 21,
    fees: 500,
    localMarketPrice,
  });
  const midpoint = (estimate.totalLow + estimate.totalHigh) / 2;
  const advantage = localMarketPrice
    ? Math.round(((localMarketPrice - midpoint) / localMarketPrice) * 100)
    : null;
  return (
    <section className="import-cost">
      <div>
        <span>Цена eCarsTrade</span>
        <strong>{money(estimate.sourceNet)}</strong>
        <small>
          {priceIncludesVat ? "VAT страны продажи вычтен" : "цена уже без VAT"}
        </small>
      </div>
      <div>
        <span>Ориентир в Черногории</span>
        <strong>
          {money(estimate.totalLow)}–{money(estimate.totalHigh)}
        </strong>
        <small>доставка €900 · пошлина 0–5% · PDV 21% · оформление €500</small>
      </div>
      {localMarketPrice && (
        <div
          className={
            advantage != null && advantage > 0 ? "advantage" : "neutral"
          }
        >
          <span>Местный рынок</span>
          <strong>{money(localMarketPrice)}</strong>
          <small>
            {advantage != null && advantage > 0
              ? `примерно на ${advantage}% выгоднее рынка`
              : "экономия не подтверждается"}
          </small>
        </div>
      )}
      <p>
        Черновая оценка. Нулевая пошлина зависит от подтверждения происхождения;
        отдельный акциз на легковой автомобиль не добавлен без подтверждённого
        основания.
      </p>
    </section>
  );
}
