import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsDirectorySection } from "@/components/settings/SettingsDirectorySection";
import { SettingsMistakeLogSection } from "@/components/settings/SettingsMistakeLogSection";
import { SettingsProfileSection } from "@/components/settings/SettingsProfileSection";
import { SettingsQuizPreferencesSection } from "@/components/settings/SettingsQuizPreferencesSection";
import { SettingsShortcutsSection } from "@/components/settings/SettingsShortcutsSection";
import { SettingsSyncSection } from "@/components/settings/SettingsSyncSection";
import { useSettingsPageState } from "@/hooks/useSettingsPageState";

export function SettingsPage() {
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
    handleNumericChange,
    commitNumericSetting,
    handleShortcutChange,
    handlePickDirectory,
    handleSynchronize,
  } = useSettingsPageState();

  return (
    <PageShell width="narrow" className="space-y-3">
      <PageHeader
        title="Settings"
        description="Configure your profile, shortcuts, and directory."
      />

      <SettingsProfileSection
        draft={draft}
        disabled={savingFields.has("name")}
        onNameChange={handleNameChange}
        onNameCommit={commitName}
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
    </PageShell>
  );
}
