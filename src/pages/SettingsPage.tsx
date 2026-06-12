import { PageShell } from "@/components/layout/PageShell";
import { SettingsAppearanceSection } from "@/components/settings/SettingsAppearanceSection";
import { SettingsDirectorySection } from "@/components/settings/SettingsDirectorySection";
import { SettingsMistakeLogSection } from "@/components/settings/SettingsMistakeLogSection";
import { SettingsProfileSection } from "@/components/settings/SettingsProfileSection";
import { SettingsQuizPreferencesSection } from "@/components/settings/SettingsQuizPreferencesSection";
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
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-zinc-950 lg:text-2xl">Settings</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Configure your profile, appearance, quiz preferences, and directory.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-zinc-500">Unsaved changes</span>
          )}
          <Button onClick={() => void handleSave()} disabled={!hasChanges}>
            Save
          </Button>
        </div>
      </div>

      <SettingsProfileSection
        draft={draft}
        hasChanges={hasChanges}
        onNameChange={(name) => updateDraft({ name })}
        onSave={() => void handleSave()}
      />

      <SettingsAppearanceSection
        draft={draft}
        errors={errors}
        onFontSizeChange={(fontSize) => {
          updateDraft({ fontSize });
          clearFieldError("fontSize");
        }}
      />

      <SettingsQuizPreferencesSection
        draft={draft}
        onShuffleQuestionsChange={(shuffleQuestions) => updateDraft({ shuffleQuestions })}
        onShuffleOptionsChange={(shuffleOptions) => updateDraft({ shuffleOptions })}
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

      <SettingsDirectorySection
        displayDir={displayDir}
        directoryPath={directoryPath}
        directoryAvailable={directoryAvailable}
        hasPendingDirChange={draft.pendingDir !== null}
        onPickDirectory={() => void handlePickDirectory()}
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
