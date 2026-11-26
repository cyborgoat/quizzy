import { Eraser } from "lucide-react";
import { useState } from "react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import type { ResetLevel } from "@/lib/native";
import { cn } from "@/lib/utils";

type ResetAction = {
  level: ResetLevel;
  labelKey:
    | "settings.reset.quizhubCache"
    | "settings.reset.studyHistory"
    | "settings.reset.libraryMetadata"
    | "settings.reset.factory";
  descriptionKey:
    | "settings.reset.quizhubCacheDescription"
    | "settings.reset.studyHistoryDescription"
    | "settings.reset.libraryMetadataDescription"
    | "settings.reset.factoryDescription";
  destructive?: boolean;
};

const ACTIONS: ResetAction[] = [
  {
    level: "quizhubCache",
    labelKey: "settings.reset.quizhubCache",
    descriptionKey: "settings.reset.quizhubCacheDescription",
  },
  {
    level: "studyHistory",
    labelKey: "settings.reset.studyHistory",
    descriptionKey: "settings.reset.studyHistoryDescription",
    destructive: true,
  },
  {
    level: "libraryMetadata",
    labelKey: "settings.reset.libraryMetadata",
    descriptionKey: "settings.reset.libraryMetadataDescription",
    destructive: true,
  },
  {
    level: "factory",
    labelKey: "settings.reset.factory",
    descriptionKey: "settings.reset.factoryDescription",
    destructive: true,
  },
];

export function SettingsResetSection({
  busyLevel,
  directoryAvailable,
  onReset,
}: {
  busyLevel: ResetLevel | null;
  directoryAvailable: boolean;
  onReset: (level: ResetLevel) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const busy = busyLevel !== null;

  function choose(level: ResetLevel) {
    setOpen(false);
    onReset(level);
  }

  return (
    <SettingsSection icon={Eraser} title={t("settings.reset.title")}>
      <p className="text-xs text-zinc-500">{t("settings.reset.description")}</p>
      <div className="mt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => setOpen(true)}
        >
          {busy ? t("settings.reset.working") : t("settings.reset.action")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md gap-0 p-0">
          <DialogHeader className="border-b border-zinc-200/80 px-5 py-4">
            <DialogTitle className="text-base">{t("settings.reset.title")}</DialogTitle>
            <DialogDescription className="text-xs">
              {t("settings.reset.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col divide-y divide-zinc-200/80 px-2 py-1">
            {ACTIONS.map((action) => {
              const needsDirectory =
                action.level === "studyHistory" || action.level === "libraryMetadata";
              const disabled = busy || (needsDirectory && !directoryAvailable);
              return (
                <button
                  key={action.level}
                  type="button"
                  disabled={disabled}
                  onClick={() => choose(action.level)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-3 text-left transition-colors",
                    "hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none",
                    "disabled:pointer-events-none disabled:opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      action.destructive ? "text-red-600" : "text-zinc-900",
                    )}
                  >
                    {t(action.labelKey)}
                  </span>
                  <span className="text-xs font-normal text-zinc-500">
                    {t(action.descriptionKey)}
                  </span>
                </button>
              );
            })}
          </div>

          <DialogFooter className="mt-0 border-t border-zinc-200/80 px-5 py-3">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              {t("settings.reset.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
