import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsDirectorySection } from "@/components/settings/SettingsDirectorySection";
import { SettingsMistakeLogSection } from "@/components/settings/SettingsMistakeLogSection";
import { SettingsProfileSection } from "@/components/settings/SettingsProfileSection";
import { SettingsQuizPreferencesSection } from "@/components/settings/SettingsQuizPreferencesSection";
import { SettingsShortcutsSection } from "@/components/settings/SettingsShortcutsSection";
import { SettingsSyncSection } from "@/components/settings/SettingsSyncSection";
import { Button } from "@/components/ui/button";
import { useSettingsPageState } from "@/hooks/useSettingsPageState";

export function SettingsPage() {
  const {
    draft,
    errors,
    hasChanges,
    displayDir,
    directoryPath,
    directoryAvailable,
    isSyncing,
    lastSyncReport,
    syncSections,
    updateDraft,
    clearFieldError,
    handleSave,
    handlePickDirectory,
    handleSynchronize,
  } = useSettingsPageState();

  return (
    <PageShell width="narrow" className="space-y-3">
      <PageHeader
        title="Settings"
        description="Configure your profile, shortcuts, and directory."
        actions={
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-zinc-500">Unsaved changes</span>
            )}
            <Button onClick={() => void handleSave()} disabled={!hasChanges}>
              Save
            </Button>
          </div>
        }
      />

      <SettingsProfileSection
        draft={draft}
        hasChanges={hasChanges}
        onNameChange={(name) => updateDraft({ name })}
        onSave={() => void handleSave()}
      />

      <SettingsDirectorySection
        displayDir={displayDir}
        directoryPath={directoryPath}
        directoryAvailable={directoryAvailable}
        hasPendingDirChange={draft.pendingDir !== null}
        onPickDirectory={() => void handlePickDirectory()}
      />

      <SettingsQuizPreferencesSection
        draft={draft}
        onShuffleQuestionsChange={(shuffleQuestions) => updateDraft({ shuffleQuestions })}
        onShuffleOptionsChange={(shuffleOptions) => updateDraft({ shuffleOptions })}
      />

      <SettingsShortcutsSection
        draft={draft}
        errors={errors}
        onShortcutChange={(field, value) => {
          updateDraft({ [field]: value });
          clearFieldError(field);
        }}
      />

      <SettingsMistakeLogSection
        draft={draft}
        errors={errors}
        onMinMistakesChange={(minMistakes) => {
          updateDraft({ minMistakes });
          clearFieldError("minMistakes");
        }}
        onMinFlagsChange={(minFlags) => {
          updateDraft({ minFlags });
          clearFieldError("minFlags");
        }}
        onMaxCorrectnessChange={(maxCorrectness) => {
          updateDraft({ maxCorrectness });
          clearFieldError("maxCorrectness");
        }}
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
