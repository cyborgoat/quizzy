import { useCallback, useEffect, useState } from "react";

export function useBackgroundDataLoader(load: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(
    async (options?: { background?: boolean }) => {
      const background = options?.background ?? false;
      if (!background) {
        setIsLoading(true);
      }
      try {
        await load();
      } finally {
        if (!background) {
          setIsLoading(false);
        }
      }
    },
    [load],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    function handleFocus() {
      void refresh({ background: true });
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  return { refresh, isLoading };
}
