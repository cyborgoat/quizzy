import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsAboutSection } from "@/components/settings/SettingsAboutSection";
import { SettingsDirectorySection } from "@/components/settings/SettingsDirectorySection";
import { SettingsLanguageSection } from "@/components/settings/SettingsLanguageSection";
import { SettingsMistakeLogSection } from "@/components/settings/SettingsMistakeLogSection";
import { SettingsProfileSection } from "@/components/settings/SettingsProfileSection";
import { SettingsQuizPreferencesSection } from "@/components/settings/SettingsQuizPreferencesSection";
import { SettingsQuizhubSection } from "@/components/settings/SettingsQuizhubSection";
import { SettingsResetSection } from "@/components/settings/SettingsResetSection";
import { SettingsShortcutsSection } from "@/components/settings/SettingsShortcutsSection";
import { SettingsSyncSection } from "@/components/settings/SettingsSyncSection";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useSettingsPageState } from "@/hooks/useSettingsPageState";
import { useSettingsReset } from "@/hooks/useSettingsReset";
import { useI18n } from "@/lib/i18n";
import type { AppLocale } from "@/lib/locale";

export function SettingsPage() {
  const { locale, setAppLocale } = useAppLocale();
  const { t } = useI18n();
  const {
    draft,
    errors,
    savingFields,
    displayDir,
    directoryPath,
    directoryAvailable,
    isSyncing,
    lastSyncReport,
    syncSections,
    handleNameChange,
    commitName,
    handleShuffleQuestionsChange,
    handleShuffleOptionsChange,
    handleQuizhubEnabledChange,
    handleQuizhubBaseUrlChange,
    commitQuizhubBaseUrl,
    resetQuizhubBaseUrl,
    handleNumericChange,
    commitNumericSetting,
    handleShortcutChange,
    handlePickDirectory,
    handleSynchronize,
  } = useSettingsPageState();
  const { busyLevel, reset } = useSettingsReset();

  return (
    <PageShell className="space-y-6">
      <PageHeader
        title={t("nav.settings")}
        description="Configure your profile, shortcuts, and directory."
      />

      <SettingsProfileSection
        draft={draft}
        disabled={savingFields.has("name")}
        onNameChange={handleNameChange}
        onNameCommit={commitName}
      />

      <SettingsLanguageSection
        locale={locale}
        disabled={false}
        onLocaleChange={(next: AppLocale) => {
          void setAppLocale(next);
        }}
      />

      <SettingsDirectorySection
        displayDir={displayDir}
        directoryPath={directoryPath}
        directoryAvailable={directoryAvailable}
        hasPendingDirChange={draft.pendingDir !== null}
        disabled={savingFields.has("workingDirectory") || isSyncing}
        onPickDirectory={() => void handlePickDirectory()}
      />

      <SettingsQuizPreferencesSection
        draft={draft}
        savingFields={savingFields}
        onShuffleQuestionsChange={handleShuffleQuestionsChange}
        onShuffleOptionsChange={handleShuffleOptionsChange}
      />

      <SettingsQuizhubSection
        draft={draft}
        savingFields={savingFields}
        onQuizhubEnabledChange={handleQuizhubEnabledChange}
        onQuizhubBaseUrlChange={handleQuizhubBaseUrlChange}
        onQuizhubBaseUrlCommit={commitQuizhubBaseUrl}
        onQuizhubBaseUrlReset={resetQuizhubBaseUrl}
      />

      <SettingsShortcutsSection
        draft={draft}
        errors={errors}
        savingFields={savingFields}
        onShortcutChange={handleShortcutChange}
      />

      <SettingsMistakeLogSection
        draft={draft}
        errors={errors}
        savingFields={savingFields}
        onValueChange={handleNumericChange}
        onValueCommit={commitNumericSetting}
      />

      <SettingsSyncSection
        isSyncing={isSyncing}
        syncSections={syncSections}
        lastSyncReport={lastSyncReport}
        onSynchronize={() => void handleSynchronize()}
      />

      <SettingsResetSection
        busyLevel={busyLevel}
        directoryAvailable={directoryAvailable}
        onReset={(level) => void reset(level)}
      />

      <SettingsAboutSection />
    </PageShell>
  );
}
