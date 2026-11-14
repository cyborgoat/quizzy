import { useEffect, useMemo, useSyncExternalStore } from "react";
import { nativeApi } from "@/lib/native";
import { createHubCatalogCache, HUB_REFRESH_INTERVAL } from "@/lib/quizhubCatalogCache";

const workspaces = new Map<string, ReturnType<typeof createHubCatalogCache>>();

export function useQuizhubCatalog(directoryPath: string | null, enabled: boolean) {
  const store = useMemo(() => {
    const key = directoryPath ?? "";
    let cached = workspaces.get(key);
    if (!cached) {
      cached = createHubCatalogCache((force) => nativeApi.hubFetchCatalog(force));
      workspaces.set(key, cached);
    }
    return cached;
  }, [directoryPath]);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => {
    if (!enabled) return;
    void store.visit();
    const timer = window.setInterval(() => void store.checkForUpdates(), HUB_REFRESH_INTERVAL);
    return () => window.clearInterval(timer);
  }, [store, enabled]);
  return { ...snapshot, refresh: store.refresh };
}
