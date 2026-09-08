import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSettingRow } from "@/components/settings/SettingsSettingRow";

export function SettingsAboutSection() {
  const [version, setVersion] = useState<string | null>(
    isTauri() ? null : "Development build",
  );

  useEffect(() => {
    if (!isTauri()) return;

    let active = true;
    void getVersion()
      .then((appVersion) => {
        if (active) setVersion(`v${appVersion}`);
      })
      .catch(() => {
        if (active) setVersion("Unavailable");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <SettingsSection icon={Info} title="About">
      <SettingsSettingRow
        label="Quizzy"
        description="The version currently installed on this device."
      >
        <span className="inline-flex min-h-7 items-center rounded-md border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-medium tabular-nums text-zinc-700">
          {version ?? "Loading…"}
        </span>
      </SettingsSettingRow>
    </SettingsSection>
  );
}
