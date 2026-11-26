import { confirm } from "@tauri-apps/plugin-dialog";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAppSynchronize } from "@/hooks/useAppSynchronize";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { errorMessage, nativeApi, type ResetLevel } from "@/lib/native";
import { notifyQuizhubChanged } from "@/lib/quizhub";

const CONFIRM: Record<
  ResetLevel,
  { titleKey: MessageKey; messageKey: MessageKey; kind: "warning" | "error" }
> = {
  quizhubCache: {
    titleKey: "settings.reset.quizhubCache",
    messageKey: "settings.reset.confirmQuizhubCache",
    kind: "warning",
  },
  studyHistory: {
    titleKey: "settings.reset.studyHistory",
    messageKey: "settings.reset.confirmStudyHistory",
    kind: "warning",
  },
  libraryMetadata: {
    titleKey: "settings.reset.libraryMetadata",
    messageKey: "settings.reset.confirmLibraryMetadata",
    kind: "warning",
  },
  factory: {
    titleKey: "settings.reset.factory",
    messageKey: "settings.reset.confirmFactory",
    kind: "error",
  },
};

const DONE: Partial<Record<ResetLevel, MessageKey>> = {
  quizhubCache: "settings.reset.doneQuizhubCache",
  studyHistory: "settings.reset.doneStudyHistory",
  libraryMetadata: "settings.reset.doneLibraryMetadata",
};

function clearBrowserQuizzyStorage() {
  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("quizzy:")) keys.push(key);
  }
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
  window.sessionStorage.clear();
}

export function useSettingsReset() {
  const { t } = useI18n();
  const { synchronizeAll } = useAppSynchronize();
  const [busyLevel, setBusyLevel] = useState<ResetLevel | null>(null);

  const reset = useCallback(
    async (level: ResetLevel) => {
      const prompt = CONFIRM[level];
      const approved = await confirm(t(prompt.messageKey), {
        title: t(prompt.titleKey),
        kind: prompt.kind,
      });
      if (!approved) return;

      setBusyLevel(level);
      try {
        await nativeApi.resetAppData(level);

        if (level === "factory") {
          clearBrowserQuizzyStorage();
          window.location.reload();
          return;
        }

        if (level === "quizhubCache" || level === "libraryMetadata") {
          notifyQuizhubChanged();
        }

        if (level === "studyHistory" || level === "libraryMetadata") {
          await synchronizeAll();
        }

        const doneKey = DONE[level];
        if (doneKey) toast.success(t(doneKey));
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        setBusyLevel(null);
      }
    },
    [synchronizeAll, t],
  );

  return { busyLevel, reset };
}
