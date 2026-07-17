export type Sentiment = "positive" | "negative";
export interface CarSnapshot {
  sourceUrl?: string;
  sourceListingId?: string;
  make: string;
  model: string;
  year?: number;
  mileage?: number;
  transmission?: string;
  fuel?: string;
  engine?: string;
  power?: number;
  color?: string;
  price?: number;
  estimatedTotalPrice?: number;
  bodyType?: string;
  vatDeductible?: boolean;
  country?: string;
  damageStatus?: string;
}
export interface PillFeedback {
  key: string;
  rawValue: string | number | boolean;
  normalizedValue?: string | number;
  sentiment: Sentiment;
}
export interface UserDecision {
  id: string;
  carId: string;
  decision: "like" | "dislike";
  createdAt: number;
  carSnapshot: CarSnapshot;
  pillFeedback: PillFeedback[];
}

const DB_NAME = "ecarstrade-personal";
const DB_VERSION = 1;
const DECISIONS = "decisions";
const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DECISIONS)) {
        const store = db.createObjectStore(DECISIONS, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
export async function saveUserDecision(decision: UserDecision) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DECISIONS, "readwrite");
    tx.objectStore(DECISIONS).put(decision);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
export async function getUserDecisions() {
  const db = await openDb();
  const rows = await new Promise<UserDecision[]>((resolve, reject) => {
    const request = db.transaction(DECISIONS).objectStore(DECISIONS).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}
