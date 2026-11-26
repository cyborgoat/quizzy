import { errorMessage, type HubCatalog } from "@/lib/native";

export const HUB_REFRESH_INTERVAL = 15 * 60 * 1000;

type Snapshot = { catalog: HubCatalog | null; error: string | null; isRefreshing: boolean };

/** One store per library, source, and edition: navigation keeps the catalog and in-flight work alive. */
export function createHubCatalogCache(fetchCatalog: (force: boolean) => Promise<HubCatalog>) {
  let snapshot: Snapshot = { catalog: null, error: null, isRefreshing: false };
  let pending: Promise<void> | null = null;
  let lastAttempt = 0;
  const listeners = new Set<() => void>();
  function publish(update: Partial<Snapshot>) {
    snapshot = { ...snapshot, ...update };
    listeners.forEach((listener) => listener());
  }
  function refresh(force = false, silent = false): Promise<void> {
    if (pending) return pending.then(() => refresh(force, silent));
    publish({ error: null, isRefreshing: !silent });
    pending = (async () => {
      try {
        const catalog = await fetchCatalog(force);
        publish({ catalog, error: silent ? null : catalog.refreshError });
      } catch (error) {
        // Background network failures leave cached content usable and undisturbed.
        if (!silent || !snapshot.catalog) publish({ error: errorMessage(error) });
      } finally {
        pending = null;
        publish({ isRefreshing: false });
      }
    })();
    return pending;
  }
  async function checkForUpdates() {
    if (pending) return;
    const checkedAt = Math.max(lastAttempt, (snapshot.catalog?.checkedAt ?? 0) * 1000);
    if (Date.now() - checkedAt < HUB_REFRESH_INTERVAL) return;
    lastAttempt = Date.now();
    await refresh(true, true);
  }
  async function visit() {
    if (pending) await pending;
    // Rebuild installation state from disk without a network sync.
    await refresh(false, true);
    if (snapshot.catalog) await checkForUpdates();
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    refresh,
    visit,
    checkForUpdates,
  };
}
