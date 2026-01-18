import { describe, expect, test, mock } from "bun:test";
import { LoaderClient } from "../src/router/loader-client";

describe("LoaderClient", () => {
  test("fetches and caches data", async () => {
    const client = new LoaderClient();
    const loader = mock(async () => ({ id: 1 }));

    // First fetch
    const data1 = await client.fetch("/api/1", loader);
    expect(data1).toEqual({ id: 1 });
    expect(loader).toHaveBeenCalledTimes(1);

    // Second fetch should be cached
    const data2 = await client.fetch("/api/1", loader);
    expect(data2).toEqual({ id: 1 });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  test("deduplicates in-flight requests", async () => {
    const client = new LoaderClient();
    let resolveLoader: (val: any) => void;
    const loaderPromise = new Promise(r => resolveLoader = r);
    const loader = mock(() => loaderPromise);

    // Call fetch twice simultaneously
    const p1 = client.fetch("/api/slow", loader);
    const p2 = client.fetch("/api/slow", loader);

    expect(loader).toHaveBeenCalledTimes(1);

    // Resolve
    resolveLoader!({ id: 2 });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual({ id: 2 });
    expect(r2).toEqual({ id: 2 });
  });

  test("invalidates cache", async () => {
    const client = new LoaderClient();
    const loader = mock(async () => ({ rand: Math.random() }));

    await client.fetch("/api/rand", loader);
    expect(loader).toHaveBeenCalledTimes(1);

    client.invalidateAll();

    await client.fetch("/api/rand", loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  test("notifies subscribers on update", async () => {
    const client = new LoaderClient();
    const loader = async () => "data";
    const listener = mock(() => { });

    client.subscribe(listener);

    await client.fetch("/api/notify", loader);

    expect(listener).toHaveBeenCalled();
  });
});
