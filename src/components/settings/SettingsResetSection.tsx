import { Eraser } from "lucide-react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSettingRow } from "@/components/settings/SettingsSettingRow";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { ResetLevel } from "@/lib/native";

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
  buttonKey:
    | "settings.reset.quizhubCacheAction"
    | "settings.reset.studyHistoryAction"
    | "settings.reset.libraryMetadataAction"
    | "settings.reset.factoryAction";
  destructive?: boolean;
};

const ACTIONS: ResetAction[] = [
  {
    level: "quizhubCache",
    labelKey: "settings.reset.quizhubCache",
    descriptionKey: "settings.reset.quizhubCacheDescription",
    buttonKey: "settings.reset.quizhubCacheAction",
  },
  {
    level: "studyHistory",
    labelKey: "settings.reset.studyHistory",
    descriptionKey: "settings.reset.studyHistoryDescription",
    buttonKey: "settings.reset.studyHistoryAction",
    destructive: true,
  },
  {
    level: "libraryMetadata",
    labelKey: "settings.reset.libraryMetadata",
    descriptionKey: "settings.reset.libraryMetadataDescription",
    buttonKey: "settings.reset.libraryMetadataAction",
    destructive: true,
  },
  {
    level: "factory",
    labelKey: "settings.reset.factory",
    descriptionKey: "settings.reset.factoryDescription",
    buttonKey: "settings.reset.factoryAction",
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

  return (
    <SettingsSection icon={Eraser} title={t("settings.reset.title")}>
      <p className="text-xs text-zinc-500">{t("settings.reset.description")}</p>
      <div className="mt-1 divide-y divide-zinc-200/70">
        {ACTIONS.map((action) => {
          const needsDirectory =
            action.level === "studyHistory" || action.level === "libraryMetadata";
          const disabled =
            busyLevel !== null || (needsDirectory && !directoryAvailable);
          return (
            <SettingsSettingRow
              key={action.level}
              label={t(action.labelKey)}
              description={t(action.descriptionKey)}
            >
              <Button
                variant={action.destructive ? "destructive" : "outline"}
                size="sm"
                disabled={disabled}
                onClick={() => onReset(action.level)}
              >
                {busyLevel === action.level
                  ? t("settings.reset.working")
                  : t(action.buttonKey)}
              </Button>
            </SettingsSettingRow>
          );
        })}
      </div>
    </SettingsSection>
  );
}
