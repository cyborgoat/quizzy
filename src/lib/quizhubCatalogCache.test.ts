import { afterEach, describe, expect, it, vi } from "vitest";
import type { HubCatalog } from "@/lib/native";
import { createHubCatalogCache, HUB_REFRESH_INTERVAL } from "@/lib/quizhubCatalogCache";

const catalog = (checkedAt = Date.now() / 1000): HubCatalog => ({
  baseUrl: "https://example.com/", checkedAt, categories: [], items: [], skipped: [],
});

afterEach(() => vi.restoreAllMocks());

describe("Quizhub catalog cache", () => {
  it("reuses a fresh catalog across visits without remote sync", async () => {
    const saved = catalog();
    const fetch = vi.fn().mockResolvedValue(saved);
    const cache = createHubCatalogCache(fetch);
    await cache.visit();
    const revisit = cache.visit();
    expect(cache.getSnapshot().catalog).toBe(saved);
    expect(cache.getSnapshot().isRefreshing).toBe(false);
    await revisit;
    expect(fetch.mock.calls).toEqual([[false], [false]]);
  });

  it("shows stale data immediately while silently checking for updates", async () => {
    const saved = catalog(0);
    let finish!: (value: HubCatalog) => void;
    const fetch = vi.fn().mockResolvedValueOnce(saved)
      .mockImplementationOnce(() => new Promise<HubCatalog>((resolve) => { finish = resolve; }));
    const cache = createHubCatalogCache(fetch);
    const visit = cache.visit();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledWith(true));
    expect(cache.getSnapshot()).toEqual({ catalog: saved, error: null, isRefreshing: false });
    const updated = catalog();
    finish(updated);
    await visit;
    expect(cache.getSnapshot().catalog).toBe(updated);
  });

  it("keeps cached data on background failure and throttles retries", async () => {
    const saved = catalog(0);
    const fetch = vi.fn().mockResolvedValueOnce(saved).mockRejectedValue(new Error("offline"));
    const cache = createHubCatalogCache(fetch);
    await cache.visit();
    await cache.checkForUpdates();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(cache.getSnapshot()).toEqual({ catalog: saved, error: null, isRefreshing: false });
    const later = Date.now() + HUB_REFRESH_INTERVAL + 1;
    vi.spyOn(Date, "now").mockReturnValue(later);
    await cache.checkForUpdates();
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("allows explicit refresh at any time and reports its errors without hiding content", async () => {
    const saved = catalog();
    const fetch = vi.fn().mockResolvedValueOnce(saved).mockRejectedValue(new Error("offline"));
    const cache = createHubCatalogCache(fetch);
    await cache.visit();
    await cache.refresh(true);
    expect(fetch.mock.calls).toEqual([[false], [true]]);
    expect(cache.getSnapshot()).toEqual({ catalog: saved, error: "offline", isRefreshing: false });
  });

  it("rebuilds local states after a download without syncing remotely", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(catalog()).mockResolvedValueOnce({
      ...catalog(), items: [{ id: "downloaded", state: "installed" }],
    });
    const cache = createHubCatalogCache(fetch);
    await cache.visit();
    await cache.refresh(false, true);
    expect(fetch.mock.calls).toEqual([[false], [false]]);
    expect(cache.getSnapshot().catalog?.items[0].state).toBe("installed");
  });

  it("does not immediately retry a failed initial load", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("offline"));
    const cache = createHubCatalogCache(fetch);
    await cache.visit();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(cache.getSnapshot().error).toBe("offline");
  });
});
