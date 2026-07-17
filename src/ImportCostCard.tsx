import { useState } from "react";
import {
  estimateMontenegroImport,
  type PriceMode,
} from "./importCost";

const money = (value: number) =>
  new Intl.NumberFormat("ru-ME", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
const range = (low: number, high: number) =>
  Math.round(low) === Math.round(high) ? money(low) : `${money(low)}–${money(high)}`;

export default function ImportCostCard({
  price,
  priceMode,
  localMarketPrice,
}: {
  price: number;
  priceMode: PriceMode;
  localMarketPrice?: number;
}) {
  const [open, setOpen] = useState(false);
  const estimate = estimateMontenegroImport({
    price,
    priceMode,
    sourceVatRate: 21,
    shipping: 900,
    platformFee: undefined,
    customsRateWithoutOriginProof: 5,
    montenegroVatRate: 21,
    customsBroker: 300,
    homologation: 200,
    registration: undefined,
    transferTaxApplicable: "unknown",
    localMarketPrice,
  });
  const low = estimate.withOriginProofLow.landedCost;
  const high = estimate.withoutOriginProofHigh.landedCost;
  return (
    <section className="import-cost">
      <div>
        <span>Цена eCarsTrade</span>
        <strong>{money(price)}</strong>
        <small>VAT-режим: не подтверждён</small>
      </div>
      <div>
        <span>В Черногории, до регистрации</span>
        <strong>≈ {range(low, high)}</strong>
        <small>Нужно подтвердить VAT и EUR.1 · уверенность низкая</small>
      </div>
      {localMarketPrice && (
        <div>
          <span>Местный рынок</span>
          <strong>{money(localMarketPrice)}</strong>
          <small>сравнение предварительное</small>
        </div>
      )}
      <button className="breakdown-toggle" onClick={() => setOpen((value) => !value)}>
        {open ? "Скрыть расчёт" : "Как посчитано"}
      </button>
      {open && (
        <div className="cost-breakdown">
          <CostRow label="Цена после VAT" value={range(estimate.sourceNetLow, estimate.sourceNetHigh)} status="неизвестно" />
          <CostRow label="Комиссия площадки" value="не включена" status="неизвестно" />
          <CostRow label="Доставка" value={money(estimate.shipping)} status="оценка" />
          <CostRow label="Пошлина при EUR.1" value={money(0)} status="сценарий" />
          <CostRow label="Пошлина без EUR.1" value={range(estimate.withoutOriginProofLow.customsDuty, estimate.withoutOriginProofHigh.customsDuty)} status="сценарий" />
          <CostRow label="PDV при EUR.1" value={range(estimate.withOriginProofLow.importVat, estimate.withOriginProofHigh.importVat)} status="оценка" />
          <CostRow label="PDV без EUR.1" value={range(estimate.withoutOriginProofLow.importVat, estimate.withoutOriginProofHigh.importVat)} status="оценка" />
          <CostRow label="Špedicija" value={money(estimate.customsBroker)} status="оценка" />
          <CostRow label="Homologation" value={money(estimate.homologation)} status="оценка" />
          <CostRow label="Регистрация и страхование" value="не включены" status="неизвестно" />
          <hr />
          <CostRow label="При EUR.1" value={range(estimate.withOriginProofLow.landedCost, estimate.withOriginProofHigh.landedCost)} status="до регистрации" />
          <CostRow label="Без EUR.1" value={range(estimate.withoutOriginProofLow.landedCost, estimate.withoutOriginProofHigh.landedCost)} status="до регистрации" />
          <p>Transfer tax 5% не включён: применимость к первой регистрации импортированной машины не подтверждена.</p>
          <p>Рекомендуемый резерв после покупки: €500–900. В обязательную стоимость не включён.</p>
        </div>
      )}
    </section>
  );
}

function CostRow({ label, value, status }: { label: string; value: string; status: string }) {
  return <div className="cost-row"><span>{label}</span><strong>{value}</strong><small>{status}</small></div>;
}
