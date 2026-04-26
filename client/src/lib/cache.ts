const TTL = 3 * 60 * 1000; // 3 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export const apiCache = {
  get<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > TTL) {
      store.delete(key);
      return null;
    }
    return entry.data as T;
  },

  set(key: string, data: unknown): void {
    store.set(key, { data, timestamp: Date.now() });
  },

  invalidate(pattern: string): void {
    for (const key of store.keys()) {
      if (key.includes(pattern)) store.delete(key);
    }
  },
};
