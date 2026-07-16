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

const collectFixedPriceCars = async () => {
  await page.goto("https://ecarstrade.com/auctions/allfix", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: ".cache/fixed-prices.png", fullPage: false });
  console.log(`Collecting from ${page.url()} (${await page.title()})`);
  const hrefs = await page
    .locator('a[href*="/cars/"]')
    .evaluateAll((links) =>
      Array.from(
        new Set(
          links
            .map((link) => link.href)
            .filter((href) => /\/cars\/\d+/.test(href)),
        ),
      ).slice(0, 30),
    );
  console.log(`Found ${hrefs.length} car links`);

  const cars = [];
  for (const href of hrefs) {
    try {
      await page.goto(href, { waitUntil: "commit", timeout: 15_000 });
      await page.waitForTimeout(1500);
    } catch (error) {
      console.warn(`Skipping slow car page ${href}: ${error.message}`);
      continue;
    }
    const raw = await page.evaluate(() => {
      const text = document.body.innerText;
      const title =
        document.querySelector("h1")?.textContent?.trim() ||
        document.title.split("|")[0].trim();
      const photos = Array.from(document.querySelectorAll("img"))
        .map((image) => image.currentSrc || image.src)
        .filter((src) => /carsphotos|car-photo|vehicle/i.test(src));
      return { text, title, photos: Array.from(new Set(photos)).slice(0, 12) };
    });
    const priceMatch = raw.text.match(/€\s*([\d][\d\s.,]{2,})/);
    const price = numberFrom(priceMatch?.[1]);
    if (!price || !/VAT\s+DEDUCTIBLE/i.test(raw.text)) continue;
    const purchaseMode = /buy\s*now/i.test(raw.text)
      ? "Buy Now"
      : "Fixed Price";

    const id = href.match(/\/cars\/(\d+)/)?.[1];
    const year = raw.text.match(/\b(20[12]\d)\b/)?.[1] || "—";
    const mileageMatch = raw.text.match(/([\d][\d\s.]*)\s*km\b/i);
    const mileage = numberFrom(mileageMatch?.[1]);
    const parts = raw.title
      .replace(/^#\d+\s*/, "")
      .trim()
      .split(/\s+/);
    const make = parts[0] || "Автомобиль";
    const model = parts[1] || raw.title;
    const fuel = /diesel/i.test(raw.text)
      ? "Дизель"
      : /hybrid/i.test(raw.text)
        ? "Гибрид"
        : /electric/i.test(raw.text)
          ? "Электро"
          : /petrol|gasoline/i.test(raw.text)
            ? "Бензин"
            : "Не указано";
    const gearbox = /automatic/i.test(raw.text) ? "Автомат" : "Механика";
    const body = /SUV/i.test(raw.text)
      ? "SUV"
      : /hatchback/i.test(raw.text)
        ? "Хэтчбек"
        : /estate|station wagon/i.test(raw.text)
          ? "Универсал"
          : "Легковой";
    if (!id || raw.photos.length === 0) continue;
    cars.push({
      id,
      make,
      model,
      name: raw.title,
      year,
      mileage: mileage ? `${mileage.toLocaleString("ru-RU")} км` : "Не указан",
      gearbox,
      fuel,
      engine: "Не указан",
      color: "Не указан",
      body,
      price: `€${price.toLocaleString("ru-RU")}`,
      origin: `eCarsTrade · ${purchaseMode}`,
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
