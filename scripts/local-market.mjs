import { readFileSync, writeFileSync } from "node:fs";

const feedPath = process.env.ECARSTRADE_FEED_PATH || "public/feed.json";
const sourceUrl = "https://autodiler.me/en";
const html = await fetch(sourceUrl, { headers: { "user-agent": "eCarsTrade market comparison" } }).then((r) => {
  if (!r.ok) throw new Error(`AutoDiler returned ${r.status}`);
  return r.text();
});

const decode = (value) => String(value || "")
  .replace(/<!-- -->/g, "")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#x27;|&#39;/g, "'")
  .replace(/\s+/g, " ")
  .trim();
const money = (value) => Number(String(value || "").replace(/[^\d]/g, "")) || undefined;
const yearFrom = (value) => Number(String(value || "").match(/20\d{2}/)?.[0]) || undefined;
const listings = [];
const itemChunks = html.split('<div class="ads-list-item">').slice(1);
for (const item of itemChunks) {
  const href = item.match(/href="(\/en\/cars\/[^\"]+)"/)?.[1];
  const title = decode(item.match(/class="ads-list-item-title"[^>]*>[\s\S]*?<h3>([\s\S]*?)<\/h3>/)?.[1]);
  const price = money(item.match(/class="price"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/)?.[1]);
  const specs = [...item.matchAll(/class="ads-list-item-description-specs-item">([\s\S]*?)<\/span>/g)].map((m) => decode(m[1]));
  const mileage = Number(specs.find((s) => /km/i.test(s))?.replace(/[^\d]/g, "")) || undefined;
  const year = yearFrom(specs.find((s) => /20\d{2}/.test(s)));
  if (!href || !title || !price || !year) continue;
  const parts = title.split(/\s+-\s+/).map((x) => x.trim());
  listings.push({ make: parts[0], model: parts[1], title, price, year, mileage, url: new URL(href, sourceUrl).href });
}

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "");
const median = (values) => {
  const xs = values.filter(Boolean).sort((a, b) => a - b);
  return xs.length ? xs[Math.floor(xs.length / 2)] : undefined;
};
const feed = JSON.parse(readFileSync(feedPath, "utf8"));
for (const car of feed.cars || []) {
  const same = listings.filter((listing) => normalize(listing.make) === normalize(car.make)
    && normalize(listing.model) === normalize(car.model)
    && Math.abs(Number(car.year) - listing.year) <= 3);
  // One advert is not a market: require at least two comparable local listings.
  if (same.length < 2) {
    delete car.localMarketPrice;
    delete car.localMarketSource;
    delete car.localMarketSampleSize;
    continue;
  }
  car.localMarketPrice = median(same.map((x) => x.price));
  car.localMarketSource = sourceUrl;
  car.localMarketSampleSize = same.length;
}
feed.localMarket = { source: sourceUrl, collectedAt: new Date().toISOString(), listingCount: listings.length };
writeFileSync(feedPath, `${JSON.stringify(feed, null, 2)}\n`);
console.log(`Matched ${feed.cars.filter((car) => car.localMarketPrice).length} cars from ${listings.length} AutoDiler listings`);
