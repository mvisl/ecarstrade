import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";

const login = process.env.ECARSTRADE_LOGIN;
const password = process.env.ECARSTRADE_PASSWORD;
const statePath =
  process.env.ECARSTRADE_STATE_PATH || ".cache/ecarstrade-session.json";

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

try {
  if (!(await isLoggedIn())) await authenticate();
  await context.storageState({ path: statePath });
  console.log("eCarsTrade session is authenticated");
} finally {
  await browser.close();
}
