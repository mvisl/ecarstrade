import { useState } from "react";
import type { PriceMode } from "./importCost";

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
  const [open, setOpen] = useState(false);
  const confirmedPurchase = price + (platformFee ?? 0) + exportDeclarationFee;
  const scenario = (shipping: number, dutyRate: number, broker: number, homologation: number) => {
    const customsValue = price + shipping;
    const duty = customsValue * dutyRate;
    const pdv = (customsValue + duty) * .21;
    return { shipping, duty, pdv, broker, homologation, total: confirmedPurchase + shipping + duty + pdv + broker + homologation };
  };
  const low = scenario(900, 0, 100, 100);
  const high = scenario(1600, .05, 250, 200);
  return <section className="import-cost">
    <div><span>Цена eCarsTrade</span><strong>{money(price)}</strong><small>{priceMode === "net_export" ? "net, VAT уже не включён" : "VAT-режим не подтверждён"}</small></div>
    <div><span>Подтверждено до импорта</span><strong>{platformFee == null ? `от ${money(confirmedPurchase)}` : money(confirmedPurchase)}</strong><small>цена + комиссия + EX-A</small></div>
    <div><span>В Черногории</span><strong>≈ {money(low.total)}–{money(high.total)}</strong><small>предварительный диапазон · точность зависит от доставки и EUR.1</small></div>
    <button className="breakdown-toggle" onClick={() => setOpen(v => !v)}>{open ? "Скрыть расчёт" : "Полный breakdown"}</button>
    {open && <div className="cost-breakdown">
      <CostRow label="Цена eCarsTrade" value={money(price)} status={priceMode === "net_export" ? "официально: net без VAT" : "требует проверки"} />
      <CostRow label="Комиссия площадки" value={platformFee == null ? "не определена" : money(platformFee)} status={listingCountry ? `тариф: ${listingCountry}` : "нужна страна выдачи"} />
      <CostRow label="EX-A export declaration" value={money(exportDeclarationFee)} status="официальный тариф eCarsTrade" />
      <CostRow label="Доставка" value={`${money(low.shipping)}–${money(high.shipping)}`} status="рыночная оценка · нужен персональный quote" />
      <CostRow label="Пошлина" value={`${money(low.duty)}–${money(high.duty)}`} status="0% при подтверждённом происхождении / сценарий 5% без него" />
      <CostRow label="PDV" value={`${money(low.pdv)}–${money(high.pdv)}`} status="21% от таможенной стоимости + пошлина" />
      <CostRow label="Špedicija" value={`${money(low.broker)}–${money(high.broker)}`} status="рыночная оценка" />
      <CostRow label="Homologation" value={`${money(low.homologation)}–${money(high.homologation)}`} status="рыночная оценка" />
      <hr />
      <CostRow label="Ориентировочно в Черногории" value={`${money(low.total)}–${money(high.total)}`} status="до регистрации и страхования" />
      <p>Нижняя граница: EUR.1 и дешёвая доставка. Верхняя: пошлина 5% и верхние оценки услуг. Требуется подтверждение доставки, VAT / EUR.1 и местных тарифов.</p>
      <p><a href="https://ecarstrade.com/costs" target="_blank" rel="noopener noreferrer">Тарифы eCarsTrade ↗</a> · <a href="https://www.gov.me/clanak/porez-na-dodatu-vrijednost" target="_blank" rel="noopener noreferrer">PDV Черногории ↗</a></p>
      <p>Возвратный VAT-депозит, ремонт, запас бюджета и будущее обслуживание в стоимость автомобиля не включаются.</p>
    </div>}
  </section>;
}

function CostRow({ label, value, status }: { label: string; value: string; status: string }) {
  return <div className="cost-row"><span>{label}</span><strong>{value}</strong><small>{status}</small></div>;
}
