import { open } from "@tauri-apps/plugin-dialog";
import { confirm } from "@tauri-apps/plugin-dialog";
import { FolderCog, Palette, Shuffle, User, ClipboardList } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBlocker } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useWorkingDirectory } from "@/hooks/useWorkingDirectory";
import { useQuizPreferences } from "@/hooks/useQuizPreferences";
import { useMistakeLogSettings } from "@/hooks/useMistakeLogSettings";
import { useUiPreferences } from "@/hooks/useUiPreferences";
import { useUserProfile } from "@/hooks/useUserProfile";
import { errorMessage, nativeApi } from "@/lib/native";
import {
  UI_DENSITY_OPTIONS,
  UI_FONT_SIZE_MAX,
  UI_FONT_SIZE_MIN,
  validateFontSizeInput,
  type UiDensity,
} from "@/lib/uiPreferences";

type SettingsDraft = {
  name: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  fontSize: string;
  density: UiDensity;
  minMistakes: string;
  minFlags: string;
  maxCorrectness: string;
  pendingDir: string | null;
};

function draftFromPersisted({
  userName,
  shuffleQuestions,
  shuffleOptions,
  fontSize,
  density,
  minMistakes,
  minFlags,
  maxCorrectnessPercentage,
}: {
  userName: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  fontSize: number;
  density: UiDensity;
  minMistakes: number;
  minFlags: number;
  maxCorrectnessPercentage: number;
}): SettingsDraft {
  return {
    name: userName,
    shuffleQuestions,
    shuffleOptions,
    fontSize: String(fontSize),
    density,
    minMistakes: String(minMistakes),
    minFlags: String(minFlags),
    maxCorrectness: String(maxCorrectnessPercentage),
    pendingDir: null,
  };
}

export function SettingsPage() {
  const { userName, setUserName } = useUserProfile();
  const {
    shuffleQuestions,
    shuffleOptions,
    setShuffleQuestions,
    setShuffleOptions,
  } = useQuizPreferences();
  const { fontSize, density, setFontSize, setDensity } = useUiPreferences();
  const {
    minMistakes,
    minFlags,
    maxCorrectnessPercentage,
    setMinMistakes,
    setMinFlags,
    setMaxCorrectnessPercentage,
  } = useMistakeLogSettings();
  const library = useQuizLibrary();
  const { refresh: refreshWorkingDirectory } = useWorkingDirectory();

  const persisted = useMemo(
    () =>
      draftFromPersisted({
        userName,
        shuffleQuestions,
        shuffleOptions,
        fontSize,
        density,
        minMistakes,
        minFlags,
        maxCorrectnessPercentage,
      }),
    [
      userName,
      shuffleQuestions,
      shuffleOptions,
      fontSize,
      density,
      minMistakes,
      minFlags,
      maxCorrectnessPercentage,
    ],
  );

  const [draft, setDraft] = useState<SettingsDraft>(persisted);
  const [fontSizeError, setFontSizeError] = useState<string | null>(null);
  const [minMistakesError, setMinMistakesError] = useState<string | null>(null);
  const [minFlagsError, setMinFlagsError] = useState<string | null>(null);
  const [maxCorrectnessError, setMaxCorrectnessError] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reset draft when persisted settings change */
    setDraft(persisted);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [persisted]);

  const displayDir = draft.pendingDir ?? library.directoryPath;
  const hasChanges =
    draft.name.trim() !== persisted.name ||
    draft.pendingDir !== null ||
    draft.shuffleQuestions !== persisted.shuffleQuestions ||
    draft.shuffleOptions !== persisted.shuffleOptions ||
    draft.fontSize !== persisted.fontSize ||
    draft.density !== persisted.density ||
    draft.minMistakes !== persisted.minMistakes ||
    draft.minFlags !== persisted.minFlags ||
    draft.maxCorrectness !== persisted.maxCorrectness;

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => hasChanges,
    withResolver: true,
    enableBeforeUnload: hasChanges,
  });

  useEffect(() => {
    if (status !== "blocked") return;
    confirm("You have unsaved changes. Leave without saving?", {
      title: "Unsaved changes",
      kind: "warning",
    }).then((ok) => {
      if (ok) proceed();
      else reset();
    });
  }, [status, proceed, reset]);

  function updateDraft(patch: Partial<SettingsDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function handlePickDirectory() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: displayDir ?? undefined,
        title: "Choose Quizzy working directory",
      });
      if (!selected || Array.isArray(selected)) return;
      updateDraft({ pendingDir: selected });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleSave() {
    const trimmed = draft.name.trim();
    const parsedMinMistakes = Number(draft.minMistakes);
    const parsedMinFlags = Number(draft.minFlags);
    const parsedMaxCorrectness = Number(draft.maxCorrectness);
    const parsedFontSize = Number(draft.fontSize);

    let hasValidationError = false;

    const nextFontSizeError = validateFontSizeInput(draft.fontSize);
    if (nextFontSizeError) {
      setFontSizeError(nextFontSizeError);
      hasValidationError = true;
    } else {
      setFontSizeError(null);
    }

    if (!Number.isInteger(parsedMinMistakes) || parsedMinMistakes < 1) {
      setMinMistakesError("Enter a whole number of at least 1.");
      hasValidationError = true;
    } else {
      setMinMistakesError(null);
    }

    if (!Number.isInteger(parsedMinFlags) || parsedMinFlags < 1) {
      setMinFlagsError("Enter a whole number of at least 1.");
      hasValidationError = true;
    } else {
      setMinFlagsError(null);
    }

    if (
      !Number.isFinite(parsedMaxCorrectness) ||
      parsedMaxCorrectness < 0 ||
      parsedMaxCorrectness > 100
    ) {
      setMaxCorrectnessError("Enter a number between 0 and 100.");
      hasValidationError = true;
    } else {
      setMaxCorrectnessError(null);
    }

    if (hasValidationError) return;

    try {
      await nativeApi.saveSettings({
        profileName: trimmed,
        shuffleQuestions: draft.shuffleQuestions,
        shuffleOptions: draft.shuffleOptions,
        uiFontSize: parsedFontSize,
        uiDensity: draft.density,
        mistakeLogMinMistakes: parsedMinMistakes,
        mistakeLogMinFlags: parsedMinFlags,
        mistakeLogMaxCorrectnessPercentage: parsedMaxCorrectness,
        ...(draft.pendingDir !== null ? { workingDirectory: draft.pendingDir } : {}),
      });
    } catch (error) {
      toast.error(errorMessage(error));
      return;
    }

    setUserName(trimmed);
    setShuffleQuestions(draft.shuffleQuestions);
    setShuffleOptions(draft.shuffleOptions);
    setFontSize(parsedFontSize);
    setDensity(draft.density);
    setMinMistakes(parsedMinMistakes);
    setMinFlags(parsedMinFlags);
    setMaxCorrectnessPercentage(parsedMaxCorrectness);

    if (draft.pendingDir !== null) {
      await refreshWorkingDirectory();
      await library.refresh();
    }

    toast.success("Settings saved.");
  }

  return (
    <PageShell width="narrow">
      <h1 className="text-2xl font-semibold text-zinc-950 xl:text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-zinc-500 lg:text-base">
        Configure your profile, appearance, quiz preferences, and directory.
      </p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-zinc-950">
            <User className="size-4" />
            Profile
          </h2>
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
            <Label htmlFor="full-name">Full name</Label>
            <p className="mt-0.5 text-sm text-zinc-500">Shown on the home page.</p>
            <Input
              id="full-name"
              value={draft.name}
              onChange={(e) => updateDraft({ name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && hasChanges && void handleSave()}
              placeholder="Your full name"
              className="mt-3 max-w-xs"
            />
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-zinc-950">
            <Palette className="size-4" />
            Appearance
          </h2>
          <div className="mt-3 space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
            <div>
              <Label htmlFor="font-size">Font size (%)</Label>
              <p className="mt-0.5 text-sm text-zinc-500">
                Scale text size from {UI_FONT_SIZE_MIN}% to {UI_FONT_SIZE_MAX}%. Use Ctrl/Cmd + or
                − to adjust in steps of 5.
              </p>
              <Input
                id="font-size"
                type="number"
                min={UI_FONT_SIZE_MIN}
                max={UI_FONT_SIZE_MAX}
                step={5}
                value={draft.fontSize}
                onChange={(e) => {
                  updateDraft({ fontSize: e.target.value });
                  setFontSizeError(null);
                }}
                className="mt-3 max-w-xs"
              />
              {fontSizeError && (
                <p className="mt-1.5 text-sm text-red-600">{fontSizeError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="layout-density">Layout density</Label>
              <p className="mt-0.5 text-sm text-zinc-500">
                Widen content areas and add breathing room on larger displays.
              </p>
              <Select
                value={draft.density}
                onValueChange={(value) => updateDraft({ density: value as UiDensity })}
              >
                <SelectTrigger id="layout-density" className="mt-3 max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UI_DENSITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-zinc-950">
            <Shuffle className="size-4" />
            Quiz preferences
          </h2>
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p id="shuffle-questions-label" className="text-sm font-medium text-zinc-700">
                  Shuffle questions
                </p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Randomize question order within each question type group. Does not apply to
                  Mistake Log review, which always uses the original quiz file order.
                </p>
              </div>
              <Switch
                checked={draft.shuffleQuestions}
                onCheckedChange={(value) => updateDraft({ shuffleQuestions: value })}
                aria-labelledby="shuffle-questions-label"
                className="mt-0.5"
              />
            </div>
            <div className="mt-4 flex items-start justify-between gap-4 border-t border-zinc-200 pt-4">
              <div className="min-w-0">
                <p id="shuffle-options-label" className="text-sm font-medium text-zinc-700">
                  Shuffle options
                </p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Randomize answer option order while keeping correct answers mapped. Mistake Log
                  review always shows options in the original quiz file order.
                </p>
              </div>
              <Switch
                checked={draft.shuffleOptions}
                onCheckedChange={(value) => updateDraft({ shuffleOptions: value })}
                aria-labelledby="shuffle-options-label"
                className="mt-0.5"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-zinc-950">
            <ClipboardList className="size-4" />
            Mistake Log
          </h2>
          <div className="mt-3 space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
            <div>
              <Label htmlFor="min-mistakes">Minimum mistakes per question</Label>
              <p className="mt-0.5 text-sm text-zinc-500">
                A question appears in the Mistake Log only when it has at least this many mistakes
                and its per-question correctness is at or below the maximum percentage below.
              </p>
              <Input
                id="min-mistakes"
                type="number"
                min={1}
                step={1}
                value={draft.minMistakes}
                onChange={(e) => {
                  updateDraft({ minMistakes: e.target.value });
                  setMinMistakesError(null);
                }}
                className="mt-3 max-w-xs"
              />
              {minMistakesError && (
                <p className="mt-1.5 text-sm text-red-600">{minMistakesError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="min-flags">Minimum flags per question</Label>
              <p className="mt-0.5 text-sm text-zinc-500">
                Flagged questions are included only when they reach at least this many flags.
              </p>
              <Input
                id="min-flags"
                type="number"
                min={1}
                step={1}
                value={draft.minFlags}
                onChange={(e) => {
                  updateDraft({ minFlags: e.target.value });
                  setMinFlagsError(null);
                }}
                className="mt-3 max-w-xs"
              />
              {minFlagsError && (
                <p className="mt-1.5 text-sm text-red-600">{minFlagsError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="max-correctness">Maximum correctness percentage per question</Label>
              <p className="mt-0.5 text-sm text-zinc-500">
                Per-question correctness is calculated across all scored attempts for that quiz.
              </p>
              <Input
                id="max-correctness"
                type="number"
                min={0}
                max={100}
                step={1}
                value={draft.maxCorrectness}
                onChange={(e) => {
                  updateDraft({ maxCorrectness: e.target.value });
                  setMaxCorrectnessError(null);
                }}
                className="mt-3 max-w-xs"
              />
              {maxCorrectnessError && (
                <p className="mt-1.5 text-sm text-red-600">{maxCorrectnessError}</p>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-zinc-950">
            <FolderCog className="size-4" />
            Quiz directory
          </h2>
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
            <Label>Working directory</Label>
            <p className="mt-0.5 text-sm text-zinc-500">
              Quizzy loads quiz JSON files from this folder.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code
                className="min-w-0 flex-1 truncate rounded bg-zinc-100 px-2 py-1.5 text-sm text-zinc-700"
                title={displayDir ?? undefined}
              >
                {displayDir ?? "No directory selected"}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handlePickDirectory()}
              >
                <FolderCog className="size-3.5" />
                {displayDir ? "Change" : "Select folder"}
              </Button>
            </div>
            {library.directoryPath && !library.directoryAvailable && draft.pendingDir === null && (
              <p className="mt-2 text-sm text-red-600">
                This directory is currently unavailable.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-10 flex justify-end">
        <Button onClick={() => void handleSave()} disabled={!hasChanges}>
          Save
        </Button>
      </div>
    </PageShell>
  );
}
