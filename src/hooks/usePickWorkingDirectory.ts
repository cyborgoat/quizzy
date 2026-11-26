import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAppSynchronize } from "@/hooks/useAppSynchronize";
import { useWorkingDirectory } from "@/hooks/useWorkingDirectory";
import { useI18n } from "@/lib/i18n";
import { errorMessage, nativeApi, type SyncReport } from "@/lib/native";

type PickOptions = {
  defaultPath?: string | null;
  /** Called with the chosen path before settings are saved (for optimistic UI). */
  onSelecting?: (path: string) => void;
  onSettled?: () => void;
  /** When false, skip success toasts (caller shows its own). Default true. */
  notify?: boolean;
};

export type PickWorkingDirectoryResult = {
  path: string;
  seededWelcome: boolean;
  report: SyncReport;
};

/** Shared folder picker used by first-run Home guidance and Settings. */
export function usePickWorkingDirectory() {
  const { directoryPath, refresh: refreshWorkingDirectory } = useWorkingDirectory();
  const { synchronizeAll } = useAppSynchronize();
  const { t } = useI18n();
  const [isPicking, setIsPicking] = useState(false);

  const pickWorkingDirectory = useCallback(
    async (options?: PickOptions): Promise<PickWorkingDirectoryResult | null> => {
      if (isPicking) return null;
      setIsPicking(true);
      const defaultPath = options?.defaultPath ?? directoryPath;
      const wasFirstSetup = !defaultPath;
      try {
        const selected = await open({
          directory: true,
          multiple: false,
          defaultPath: defaultPath ?? undefined,
          title: "Choose Quizzy working directory",
        });
        if (!selected || Array.isArray(selected)) return null;

        options?.onSelecting?.(selected);
        await nativeApi.saveSettings({ workingDirectory: selected });

        let seededWelcome = false;
        try {
          const samples = await nativeApi.addSampleQuizzes();
          seededWelcome = samples.added.length > 0;
        } catch (error) {
          toast.error(errorMessage(error));
        }

        const report = await synchronizeAll();
        await refreshWorkingDirectory();

        if (options?.notify !== false) {
          if (wasFirstSetup && seededWelcome) {
            toast.success(t("toast.directoryReadyWelcome"));
          } else if (wasFirstSetup) {
            toast.success(t("toast.directoryReady"));
          } else if (seededWelcome) {
            toast.success(t("toast.directoryUpdatedWelcome"));
          } else {
            toast.success(t("toast.directoryUpdated"));
          }
        }

        return { path: selected, seededWelcome, report };
      } catch (error) {
        toast.error(errorMessage(error));
        return null;
      } finally {
        options?.onSettled?.();
        setIsPicking(false);
      }
    },
    [directoryPath, isPicking, refreshWorkingDirectory, synchronizeAll, t],
  );

  return { pickWorkingDirectory, isPicking };
}
