import { useState } from "react";
import { estimateMontenegroImport, type PriceMode } from "./importCost";

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
  const estimate = estimateMontenegroImport({
    price, priceMode, platformFee, exportDeclarationFee,
    // These values deliberately remain empty until a quote/document is available.
    shipping: undefined, customsDutyRate: undefined, montenegroVatRate: 21,
    customsBroker: undefined, homologation: undefined,
  });
  const confirmedPurchase = price + (platformFee ?? 0) + exportDeclarationFee;
  return <section className="import-cost">
    <div><span>Цена eCarsTrade</span><strong>{money(price)}</strong><small>{priceMode === "net_export" ? "net, VAT уже не включён" : "VAT-режим не подтверждён"}</small></div>
    <div><span>Подтверждено до импорта</span><strong>{platformFee == null ? `от ${money(confirmedPurchase)}` : money(confirmedPurchase)}</strong><small>цена + комиссия + EX-A</small></div>
    <div><span>В Черногории</span><strong>Нужны данные</strong><small>{estimate.missing.join(" · ")}</small></div>
    <button className="breakdown-toggle" onClick={() => setOpen(v => !v)}>{open ? "Скрыть расчёт" : "Полный breakdown"}</button>
    {open && <div className="cost-breakdown">
      <CostRow label="Цена eCarsTrade" value={money(price)} status={priceMode === "net_export" ? "официально: net без VAT" : "требует проверки"} />
      <CostRow label="Комиссия площадки" value={platformFee == null ? "не определена" : money(platformFee)} status={listingCountry ? `тариф: ${listingCountry}` : "нужна страна выдачи"} />
      <CostRow label="EX-A export declaration" value={money(exportDeclarationFee)} status="официальный тариф eCarsTrade" />
      <CostRow label="Доставка" value="нужен тариф" status="не включена" />
      <CostRow label="Пошлина" value="нужен EUR.1 / происхождение" status="не включена" />
      <CostRow label="PDV" value="21% от подтверждённой таможенной базы" status="не посчитан без доставки и пошлины" />
      <CostRow label="Špedicija" value="нужен тариф" status="не включена" />
      <CostRow label="Homologation" value="нужен тариф" status="не включена" />
      <hr />
      <p>Стоимость предварительная. Требуется подтверждение доставки, VAT / EUR.1 и местных тарифов.</p>
      <p>Возвратный VAT-депозит, ремонт, запас бюджета и будущее обслуживание в стоимость автомобиля не включаются.</p>
    </div>}
  </section>;
}

function CostRow({ label, value, status }: { label: string; value: string; status: string }) {
  return <div className="cost-row"><span>{label}</span><strong>{value}</strong><small>{status}</small></div>;
}
