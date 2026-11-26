import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSettingRow } from "@/components/settings/SettingsSettingRow";
import { useI18n } from "@/lib/i18n";

export function SettingsAboutSection() {
  const { t } = useI18n();

  const [version, setVersion] = useState<string | null>(
    isTauri() ? null : "dev",
  );

  useEffect(() => {
    if (!isTauri()) return;

    let active = true;
    void getVersion()
      .then((appVersion) => {
        if (active) setVersion(`v${appVersion}`);
      })
      .catch(() => {
        if (active) setVersion("unavailable");
      });

    return () => {
      active = false;
    };
  }, []);

  const versionLabel =
    version === null
      ? t("common.loading")
      : version === "dev"
        ? t("settings.about.devBuild")
        : version === "unavailable"
          ? t("common.unavailable")
          : version;

  return (
    <SettingsSection icon={Info} title={t("settings.about.title")}>
      <SettingsSettingRow
        label="Quizzy"
        description={t("settings.about.versionDescription")}
      >
        <span className="inline-flex min-h-7 items-center text-xs font-medium tabular-nums text-zinc-700">
          {versionLabel}
        </span>
      </SettingsSettingRow>
    </SettingsSection>
  );
}
