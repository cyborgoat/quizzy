import { useEffect, useMemo, useState } from "react";
import { nativeApi, type HubInstalledItem } from "@/lib/native";
import { installedFileNames, QUIZHUB_CHANGED_EVENT } from "@/lib/quizhub";

/**
 * File names of items downloaded from quizhub in the current working directory.
 * Reads only the local lock file; refreshes when quizhub content changes or the folder changes.
 */
export function useQuizhubInstalled(directoryPath: string | null) {
  const [items, setItems] = useState<HubInstalledItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      nativeApi
        .hubListInstalled()
        .then((next) => {
          if (!cancelled) setItems(next);
        })
        .catch(() => {
          if (!cancelled) setItems([]);
        });
    };
    load();
    window.addEventListener(QUIZHUB_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(QUIZHUB_CHANGED_EVENT, load);
    };
  }, [directoryPath]);

  return useMemo(() => installedFileNames(items), [items]);
}
