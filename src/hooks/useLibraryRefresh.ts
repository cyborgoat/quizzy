import { useState } from "react";
import { toast } from "sonner";

export function useLibraryRefresh(
  refresh: () => Promise<void>,
  successMessage: string,
) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await refresh();
      toast.success(successMessage);
    } finally {
      setIsRefreshing(false);
    }
  }

  return { isRefreshing, handleRefresh };
}
