import { useEffect, useMemo, useState } from "react";
import { nativeApi, type HubInstalledItem, type HubScope } from "@/lib/native";
import { installedFileNames, QUIZHUB_CHANGED_EVENT } from "@/lib/quizhub";

const EMPTY_ITEMS: HubInstalledItem[] = [];

/** Reads provenance for the current library without touching the network. */
export function useQuizhubInstalled(scope: HubScope | null) {
  const [snapshot, setSnapshot] = useState<{ scope: HubScope; items: HubInstalledItem[] } | null>(null);

  useEffect(() => {
    if (!scope) return;
    let cancelled = false;
    const load = () => {
      nativeApi
        .hubListInstalled(scope)
        .then((items) => {
          if (!cancelled) setSnapshot({ scope, items });
        })
        .catch(() => {
          if (!cancelled) setSnapshot({ scope, items: EMPTY_ITEMS });
        });
    };
    load();
    window.addEventListener(QUIZHUB_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(QUIZHUB_CHANGED_EVENT, load);
    };
  }, [scope]);

  const items = snapshot?.scope === scope ? snapshot.items : EMPTY_ITEMS;
  return useMemo(() => installedFileNames(items), [items]);
}
