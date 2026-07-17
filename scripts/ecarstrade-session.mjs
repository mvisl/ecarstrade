import { chromium } from "playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const login = process.env.ECARSTRADE_LOGIN;
const password = process.env.ECARSTRADE_PASSWORD;
const statePath =
  process.env.ECARSTRADE_STATE_PATH || ".cache/ecarstrade-session.json";
const feedPath = process.env.ECARSTRADE_FEED_PATH || "public/feed.json";

if (!login || !password) {
  throw new Error("ECARSTRADE_LOGIN and ECARSTRADE_PASSWORD are required");
}

mkdirSync(".cache", { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext(
  existsSync(statePath) ? { storageState: statePath } : {},
);
const page = await context.newPage();

const isLoggedIn = async () => {
  await page.goto("https://ecarstrade.com/auctions/allfix", {
    waitUntil: "domcontentloaded",
  });
  return (await page.getByText("Log in", { exact: true }).count()) === 0;
};

const authenticate = async () => {
  await page.goto("https://ecarstrade.com/", { waitUntil: "domcontentloaded" });
  await page.getByText("Log in", { exact: true }).click();

  const modal = page.locator("#fancybox-wrap");
  await modal.waitFor({ state: "visible" });
  const email = modal.locator(
    'input[type="email"], input[name*="email" i], input[name*="login" i]',
  );
  const passwordInput = modal.locator('input[type="password"]');
  await email.first().fill(login);
  await passwordInput.first().fill(password);
  await modal
    .locator('button[type="submit"], input[type="submit"]')
    .first()
    .click();
  await page.waitForTimeout(1500);

  if (!(await isLoggedIn())) {
    throw new Error(
      "eCarsTrade authentication failed or requires manual verification",
    );
  }
};

const numberFrom = (value) =>
  Number(String(value || "").replace(/[^\d]/g, "")) || undefined;
const euroFrom = (value) =>
  Number(
    String(value || "")
      .replace(/\s/g, "")
      .replace(/[.,]\d{2}$/, "")
      .replace(/[^\d]/g, ""),
  ) || undefined;
const platformFeeFor = (price, country) => {
  const belgium = /belgium|belgië|belgique/i.test(country || "");
  if (price <= 5000) return belgium ? 200 : 250;
  if (price <= 10000) return belgium ? 250 : 300;
  if (price <= 20000) return belgium ? 300 : 350;
  const base = belgium ? 350 : 400;
  return base + Math.floor((price - 20001) / 10000) * 50;
};
const excludedCommercial = /\b(panda|berlingo|partner|kangoo|caddy|combo|doblo|proace city|transit connect|furg[oó]n|fourgon|panel van|cargo van|commercial van|kastenwagen|bestelwagen|utilitaire|vanette|minibus|minivan|multivan|transporter|traveller|tourneo|vivaro|trafic|expert|ducato|boxer|jumper|master|sprinter|vito)\b/i;

const collectFixedPriceCars = async () => {
  await page.goto("https://ecarstrade.com/auctions/allfix", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: ".cache/fixed-prices.png", fullPage: false });
  console.log(`Collecting from ${page.url()} (${await page.title()})`);
  const hrefSet = new Set();
  for (let pageNumber = 0; pageNumber < 4; pageNumber += 1) {
    const pageHrefs = await page
      .locator('a[href*="/cars/"]')
      .evaluateAll((links) =>
        links
          .map((link) => link.href)
          .filter((href) => /\/cars\/\d+/.test(href)),
      );
    pageHrefs.forEach((href) => hrefSet.add(href));
    const next = page.locator(".pagination-next:not(.disabled) .page-link");
    if ((await next.count()) !== 1) break;
    await next.click();
    await page.waitForTimeout(2500);
  }
  // Keep a deep enough packet for several user-triggered 12-car sessions.
  // The browser can then produce the next selection immediately without
  // pretending that re-reading the same five records is a refresh.
  const hrefs = Array.from(hrefSet).slice(0, 120);
  console.log(`Found ${hrefs.length} car links`);

  const cars = [];
  for (const href of hrefs) {
    try {
      await page.goto(href, { waitUntil: "commit", timeout: 15_000 });
      await page.waitForTimeout(1000);
      // The heading and price arrive before the lazy-loaded Car Profile.
      // Reading at that point produced superficially valid but incomplete cars.
      await page.waitForFunction(
        () => /Car Profile/i.test(document.body?.innerText || ""),
        { timeout: 5000 },
      ).catch(() => {});
    } catch (error) {
      console.warn(`Skipping slow car page ${href}: ${error.message}`);
      continue;
    }
    let raw;
    try {
      raw = await page.evaluate(() => {
        const text = document.body?.innerText || "";
        let schema = {};
        const findCarSchema = (value) => {
          if (!value || typeof value !== "object") return null;
          if (value["@type"] === "Car") return value;
          if (Array.isArray(value)) {
            for (const item of value) {
              const found = findCarSchema(item);
              if (found) return found;
            }
          } else {
            for (const item of Object.values(value)) {
              const found = findCarSchema(item);
              if (found) return found;
            }
          }
          return null;
        };
        for (const node of document.querySelectorAll(
          'script[type="application/ld+json"]',
        )) {
          try {
            const parsed = JSON.parse(node.textContent || "{}");
            schema = findCarSchema(parsed) || schema;
          } catch {
            // Ignore unrelated malformed structured-data blocks.
          }
        }
        const title =
          document.querySelector("h1")?.textContent?.trim() ||
          document.title.split("|")[0].trim();
        const photos = Array.from(document.querySelectorAll("img"))
          .map(
            (image) =>
              image.getAttribute("data-src") || image.currentSrc || image.src,
          )
          .filter((src) => /carsphotos|car-photo|vehicle/i.test(src))
          .map((src) =>
            new URL(src, location.origin).href.replace(
              /\/\d+x0__r(?=\.(?:jpe?g|webp))/i,
              "/780x0__r",
            ),
          );
        return {
          text,
          title,
          schema,
          photos: Array.from(new Set(photos)).slice(0, 12),
        };
      });
    } catch (error) {
      console.warn(`Skipping unreadable car page ${href}: ${error.message}`);
      continue;
    }
    const priceMatch = raw.text.match(/€\s*([\d][\d\s.,]{2,})/);
    const price = euroFrom(priceMatch?.[1]);
    if (!price || !/VAT\s+DEDUCTIBLE/i.test(raw.text)) continue;
    const purchaseMode = /buy\s*now/i.test(raw.text)
      ? "Buy Now"
      : "Fixed Price";
    const listingCountry = raw.text.match(/Pick-up location\s*\n\s*([^\n]+)/i)?.[1]?.trim();

    const id = href.match(/\/cars\/(\d+)/)?.[1];
    const schema = raw.schema || {};
    const profileValues = (label) => {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return [...raw.text.matchAll(
        new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\n\\s*([^\\n]+)`, "gim"),
      )].map((match) => match[1].trim());
    };
    // Labels can also occur in search controls before the actual Car Profile.
    // The profile table is lower on the page, so its last exact-line match wins.
    const profileValue = (label) => profileValues(label).at(-1);
    const normalizedTitle = String(schema.name || raw.title)
      .replace(/CITROAu2039N/gi, "Citroen")
      .replace(/MERCEDES-BENZ/gi, "Mercedes-Benz");
    if (excludedCommercial.test(`${normalizedTitle} ${schema.bodyType || ""}`)) continue;
    const registration = String(schema.dateVehicleFirstRegistered || "");
    const year = registration.match(/(20[12]\d)$/)?.[1] || "—";
    const mileage = numberFrom(schema.mileageFromOdometer?.value);
    const parts = normalizedTitle
      .replace(/^#\d+\s*/, "")
      .trim()
      .split(/\s+/);
    const makeAndModel = profileValue("Make & Model");
    const make = String(schema.brand?.name || makeAndModel?.split(/\s+/)[0] || parts[0] || "Автомобиль");
    const profileModel = makeAndModel?.replace(new RegExp(`^${make}\\s+`, "i"), "").trim();
    const model = profileModel && !/^(other|unknown|n\/a|—|-)$/i.test(profileModel)
      ? profileModel
      : parts[1] || raw.title;
    const fuelSource = String(schema.fuelType || raw.text);
    const fuel = /diesel/i.test(fuelSource)
      ? "Дизель"
      : /hybrid/i.test(fuelSource)
        ? "Гибрид"
        : /electric/i.test(fuelSource)
          ? "Электро"
          : /petrol|gasoline/i.test(fuelSource)
            ? "Бензин"
            : "Не указано";
    const gearbox = /automatic/i.test(
      String(schema.vehicleTransmission || raw.text),
    )
      ? "Автомат"
      : "Механика";
    // The visible Car Profile is the source of truth; JSON-LD is often generic.
    const bodySource = String(profileValue("Category") || schema.bodyType || raw.text);
    const body = /SUV|off-road/i.test(bodySource)
      ? "SUV"
      : /hatchback/i.test(bodySource)
        ? "Хэтчбек"
        : /estate|station wagon/i.test(bodySource)
          ? "Универсал"
          : "Легковой";
    const schemaEngine = schema.vehicleEngine || {};
    const titleDisplacement = normalizedTitle.match(/\b(\d[.,]\d)\s*(?:TSI|TDI|HDI|BlueHDi|EcoBlue|CDI|dCi|CRDi|PHEV)?\b/i)?.[1];
    const titleKw = numberFrom(normalizedTitle.match(/\b\d{2,3}\s*kW\b/i)?.[0]);
    const engineCc = numberFrom(profileValue("Engine size")) ||
      numberFrom(schemaEngine.engineDisplacement?.value ?? schemaEngine.engineDisplacement) ||
      (titleDisplacement ? Math.round(Number(titleDisplacement.replace(",", ".")) * 1000) : 0);
    const horsepower = numberFrom(profileValue("Power")?.match(/\d+\s*Hp/i)?.[0]) ||
      numberFrom(schemaEngine.enginePower?.value ?? schemaEngine.enginePower) ||
      (titleKw ? Math.round(titleKw * 1.35962) : 0);
    const engine = engineCc
      ? `${(engineCc / 1000).toFixed(1)}${horsepower ? ` · ${horsepower} л.с.` : ""}`
      : horsepower ? `${horsepower} л.с.` : "Не указан";
    const colorValue = profileValues("Color")
      .filter((value) => !/^(VIN|N\/A|—|-|Color)$/i.test(value))
      .at(-1) || schema.color || schema.vehicleColor;
    const colorSource = String(colorValue || "").toLowerCase();
    const colors = { green: "Зелёный", black: "Чёрный", white: "Белый", grey: "Серый", gray: "Серый", blue: "Синий", red: "Красный", silver: "Серебристый", brown: "Коричневый", beige: "Бежевый" };
    const color = colors[colorSource] || colorValue || "Не указан";
    if (!id || raw.photos.length === 0) continue;
    cars.push({
      id,
      sourceUrl: href,
      sourceListingId: id,
      make,
      model,
      name: normalizedTitle,
      year,
      mileage: mileage ? `${mileage.toLocaleString("ru-RU")} км` : "Не указан",
      gearbox,
      fuel,
      engine,
      color,
      body,
      price: `€${price.toLocaleString("ru-RU")}`,
      origin: `${listingCountry || "eCarsTrade"} · ${purchaseMode}`,
      listingCountry,
      priceMode: "net_export",
      platformFee: platformFeeFor(price, listingCountry),
      exportDeclarationFee: 50,
      photos: raw.photos,
      report: [
        { kind: "ok", text: "Актуальная фиксированная цена" },
        { kind: "ok", text: "VAT deductible" },
      ],
    });
  }

  mkdirSync(feedPath.split("/").slice(0, -1).join("/") || ".", {
    recursive: true,
  });
  writeFileSync(
    feedPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), cars }, null, 2)}\n`,
  );
  console.log(`Collected ${cars.length} fixed-price cars`);
};

try {
  if (!(await isLoggedIn())) await authenticate();
  await collectFixedPriceCars();
  await context.storageState({ path: statePath });
  console.log("eCarsTrade session is authenticated");
} finally {
  await browser.close();
}
