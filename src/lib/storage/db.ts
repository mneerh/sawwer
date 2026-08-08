"use client";

/**
 * A tiny promise wrapper over IndexedDB. No dependency, and it keeps the
 * storage layer swappable — moving to Supabase later means reimplementing
 * `journeys.ts`, not touching any component.
 */

const DB_NAME = "sawwer";
const DB_VERSION = 1;

export const JOURNEY_STORE = "journeys";
export const IMAGE_STORE = "images";

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is unavailable"));
  }

  if (!dbPromise) {
    const opening = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(JOURNEY_STORE)) {
          db.createObjectStore(JOURNEY_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
          const store = db.createObjectStore(IMAGE_STORE, { keyPath: "id" });
          store.createIndex("journeyId", "journeyId", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    dbPromise = opening.catch((error: unknown) => {
      // Don't cache a rejected promise — a later call may succeed.
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
}

export async function put<T>(storeName: string, value: T): Promise<void> {
  const db = await openDb();
  await run(db.transaction(storeName, "readwrite").objectStore(storeName).put(value));
}

export async function get<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDb();
  return run<T | undefined>(db.transaction(storeName, "readonly").objectStore(storeName).get(key));
}

export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  return run<T[]>(db.transaction(storeName, "readonly").objectStore(storeName).getAll());
}

export async function remove(storeName: string, key: string): Promise<void> {
  const db = await openDb();
  await run(db.transaction(storeName, "readwrite").objectStore(storeName).delete(key));
}

export async function removeByIndex(storeName: string, indexName: string, key: string): Promise<void> {
  const db = await openDb();
  const store = db.transaction(storeName, "readwrite").objectStore(storeName);
  const keys = await run<IDBValidKey[]>(store.index(indexName).getAllKeys(key));
  await Promise.all(keys.map((entry) => run(store.delete(entry))));
}

function run<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}
