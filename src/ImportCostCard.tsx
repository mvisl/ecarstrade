import { useState } from "react";
import type { PriceMode } from "./importCost";

type CostKey = "platform" | "export" | "shipping" | "duty" | "pdv" | "broker" | "homologation";
type EnabledCosts = Record<CostKey, boolean>;

const money = (value: number) => new Intl.NumberFormat("ru-ME", {
  style: "currency", currency: "EUR", maximumFractionDigits: 0,
}).format(value);

export default function ImportCostCard({ price, priceMode, platformFee, exportDeclarationFee = 50, listingCountry }: {
  price: number;
  priceMode: PriceMode;
  platformFee?: number;
  exportDeclarationFee?: number;
  listingCountry?: string;
}) {
  const [open, setOpen] = useState(true);
  const [enabled, setEnabled] = useState<EnabledCosts>({
    platform: true,
    export: true,
    shipping: false,
    duty: true,
    pdv: true,
    broker: true,
    homologation: true,
  });
  const included = (key: CostKey) => enabled[key];
  const toggle = (key: CostKey) => setEnabled((current) => ({ ...current, [key]: !current[key] }));
  const confirmedPurchase = price + (included("platform") ? platformFee ?? 0 : 0) + (included("export") ? exportDeclarationFee : 0);
  const scenario = (shipping: number, dutyRate: number, broker: number, homologation: number) => {
    const selectedShipping = included("shipping") ? shipping : 0;
    const customsValue = price + selectedShipping;
    const duty = included("duty") ? customsValue * dutyRate : 0;
    const pdv = included("pdv") ? (customsValue + duty) * .21 : 0;
    const selectedBroker = included("broker") ? broker : 0;
    const selectedHomologation = included("homologation") ? homologation : 0;
    return { shipping: selectedShipping, duty, pdv, broker: selectedBroker, homologation: selectedHomologation, total: confirmedPurchase + selectedShipping + duty + pdv + selectedBroker + selectedHomologation };
  };
  const low = scenario(900, 0, 100, 100);
  const high = scenario(1600, .05, 250, 200);
  return <section className="import-cost">
    <div><span>Цена eCarsTrade</span><strong>{money(price)}</strong><small>{priceMode === "net_export" ? "net, VAT уже не включён" : "VAT-режим не подтверждён"}</small></div>
    <div><span>Выбранные расходы до импорта</span><strong>{platformFee == null && included("platform") ? `от ${money(confirmedPurchase)}` : money(confirmedPurchase)}</strong><small>состав можно менять ниже</small></div>
    <div><span>Ваш сценарий</span><strong>≈ {money(low.total)}–{money(high.total)}</strong><small>{included("shipping") ? "с доставкой" : "без доставки"} · предварительный диапазон</small></div>
    <button className="breakdown-toggle" onClick={() => setOpen((value) => !value)}>{open ? "Скрыть расчёт" : "Настроить расчёт"}</button>
    {open && <div className="cost-breakdown">
      <CostRow label="Цена eCarsTrade" value={money(price)} status={priceMode === "net_export" ? "официально: net без VAT" : "требует проверки"} />
      <CostRow label="Комиссия площадки" value={platformFee == null ? "не определена" : money(platformFee)} status={listingCountry ? `тариф: ${listingCountry}` : "нужна страна выдачи"} enabled={included("platform")} onToggle={() => toggle("platform")} />
      <CostRow label="EX-A export declaration" value={money(exportDeclarationFee)} status="официальный тариф eCarsTrade" enabled={included("export")} onToggle={() => toggle("export")} />
      <CostRow label="Доставка" value={`${money(900)}–${money(1600)}`} status="рыночная оценка · по умолчанию исключена" enabled={included("shipping")} onToggle={() => toggle("shipping")} />
      <CostRow label="Пошлина" value={included("duty") ? `${money(low.duty)}–${money(high.duty)}` : "0 €"} status="0% при EUR.1 / сценарий 5% без него" enabled={included("duty")} onToggle={() => toggle("duty")} />
      <CostRow label="PDV" value={included("pdv") ? `${money(low.pdv)}–${money(high.pdv)}` : "0 €"} status="21% от выбранной таможенной стоимости + пошлина" enabled={included("pdv")} onToggle={() => toggle("pdv")} />
      <CostRow label="Špedicija" value={`${money(100)}–${money(250)}`} status="рыночная оценка" enabled={included("broker")} onToggle={() => toggle("broker")} />
      <CostRow label="Homologation" value={`${money(100)}–${money(200)}`} status="рыночная оценка" enabled={included("homologation")} onToggle={() => toggle("homologation")} />
      <hr />
      <CostRow label="Ваш итог" value={`${money(low.total)}–${money(high.total)}`} status="до регистрации и страхования" />
      <p>Кликните по статье, чтобы исключить её из сценария или вернуть обратно. Полупрозрачные строки в итог не входят.</p>
      <p>Нижняя граница: EUR.1 и нижние оценки услуг. Верхняя: пошлина 5% и верхние оценки. Требуется подтверждение VAT / EUR.1 и местных тарифов.</p>
      <p><a href="https://ecarstrade.com/costs" target="_blank" rel="noopener noreferrer">Тарифы eCarsTrade ↗</a> · <a href="https://www.gov.me/clanak/porez-na-dodatu-vrijednost" target="_blank" rel="noopener noreferrer">PDV Черногории ↗</a></p>
      <p>Возвратный VAT-депозит, ремонт, запас бюджета и будущее обслуживание в стоимость автомобиля не включаются.</p>
    </div>}
  </section>;
}

function CostRow({ label, value, status, enabled, onToggle }: { label: string; value: string; status: string; enabled?: boolean; onToggle?: () => void }) {
  if (!onToggle) return <div className="cost-row fixed"><span>{label}</span><strong>{value}</strong><small>{status}</small></div>;
  return <button type="button" className={`cost-row interactive ${enabled ? "included" : "excluded"}`} aria-pressed={enabled} onClick={onToggle} title={enabled ? `Убрать: ${label}` : `Добавить: ${label}`}>
    <span>{label}</span><strong>{value}</strong><small>{status}</small><b aria-hidden="true">{enabled ? "−" : "+"}</b>
  </button>;
}
