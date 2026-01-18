/**
 * Global Loader Cache & Client
 * 
 * Manages data fetching, caching, deduplication, and revalidation
 * for route loaders.
 */

type CacheEntry = {
  data: any;
  timestamp: number;
  status: "fresh" | "stale" | "fetching";
  promise?: Promise<any>;
};

export class LoaderClient {
  private cache = new Map<string, CacheEntry>();
  private listeners = new Set<() => void>();

  /**
   * Fetch data for a generic key (usually URL path).
   * Handles deduplication and caching.
   */
  async fetch(key: string, loaderFn: () => Promise<any>, options?: { force?: boolean }) {
    let entry = this.cache.get(key);

    // 1. Return cached if fresh and not forced
    // TODO: Add TTL logic here if desired (e.g. 5 seconds)
    if (entry && entry.status === "fresh" && !options?.force) {
      return entry.data;
    }

    // 2. Reuse in-flight promise (Deduplication)
    // If we are already fetching this key, just return the existing promise
    if (entry?.promise) {
      return entry.promise;
    }

    // 3. Status Check: If stale, we might return stale data while revalidating?
    // For now, let's just await the new data to be safely consistent (remix default behavior-ish)
    // Implementing pure Stale-While-Revalidate requires the UI to handle the update later.
    // Our 'fetch' returns a promise, so the caller awaits it. 
    // If we want SWR, we'd need to return { data: entry.data } immediately if available, 
    // and trigger a background fetch. 
    // But standard router loaders usually await before rendering.
    // Let's stick to "await if stale" for simplicity first, or implicit background update?

    // FETCHING NEW DATA
    const promise = loaderFn().then(data => {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        status: "fresh",
        promise: undefined
      });
      // Notify listeners (RouterProvider) that data has changed
      this.notify();
      return data;
    }).catch(err => {
      // If failed, remove from cache so we try again next time? 
      // Or cache error? For now, just remove promise.
      const current = this.cache.get(key);
      if (current && current.promise === promise) {
        this.cache.delete(key);
      }
      throw err;
    });

    // Optimistically update cache with promise to block duplicates
    if (!entry) {
      this.cache.set(key, { data: null, timestamp: 0, status: "fetching", promise });
    } else {
      entry.promise = promise;
      entry.status = "fetching";
    }

    return promise;
  }

  /**
   * Invalidate all cache entries.
   * Marks them as stale so next fetch will trigger a reload.
   */
  invalidateAll() {
    for (const [key, entry] of this.cache) {
      entry.status = "stale";
    }
    this.notify();
  }

  /**
   * Manually set cache data (e.g. for optimistic UI or prefetching)
   */
  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      status: "fresh"
    });
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

// Singleton instance shared across the app
export const loaderClient = new LoaderClient();
