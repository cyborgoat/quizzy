import { useEffect, useMemo, useSyncExternalStore } from "react";
import { nativeApi, type HubScope } from "@/lib/native";
import { createHubCatalogCache, HUB_REFRESH_INTERVAL } from "@/lib/quizhubCatalogCache";

const catalogs = new Map<string, ReturnType<typeof createHubCatalogCache>>();

export function useQuizhubCatalog(scope: HubScope, locale: string | null) {
  const store = useMemo(() => {
    const key = JSON.stringify([scope, locale]);
    let cached = catalogs.get(key);
    if (!cached) {
      cached = createHubCatalogCache((force) => nativeApi.hubFetchCatalog(scope, locale, force));
      catalogs.set(key, cached);
    }
    return cached;
  }, [scope, locale]);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => {
    void store.visit();
    const timer = window.setInterval(() => void store.checkForUpdates(), HUB_REFRESH_INTERVAL);
    return () => window.clearInterval(timer);
  }, [store]);
  return { ...snapshot, refresh: store.refresh };
}
