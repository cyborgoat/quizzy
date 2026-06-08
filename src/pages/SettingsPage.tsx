import { open } from "@tauri-apps/plugin-dialog";
import { confirm } from "@tauri-apps/plugin-dialog";
import { FolderCog, Palette, Shuffle, User, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
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

export function SettingsPage() {
  const { userName, setUserName } = useUserProfile();
  const { shuffleMode, setShuffleMode } = useQuizPreferences();
  const { fontSize, density, setFontSize, setDensity } = useUiPreferences();
  const {
    minMistakes,
    maxCorrectnessPercentage,
    setMinMistakes,
    setMaxCorrectnessPercentage,
  } = useMistakeLogSettings();
  const library = useQuizLibrary();
  const [nameInput, setNameInput] = useState(userName);
  const [shuffleInput, setShuffleInput] = useState(shuffleMode);
  const [fontSizeInput, setFontSizeInput] = useState(String(fontSize));
  const [densityInput, setDensityInput] = useState<UiDensity>(density);
  const [minMistakesInput, setMinMistakesInput] = useState(String(minMistakes));
  const [maxCorrectnessInput, setMaxCorrectnessInput] = useState(String(maxCorrectnessPercentage));
  const [pendingDir, setPendingDir] = useState<string | null>(null);
  const [savedUserName, setSavedUserName] = useState(userName);
  const [savedShuffleMode, setSavedShuffleMode] = useState(shuffleMode);
  const [savedFontSize, setSavedFontSize] = useState(fontSize);
  const [savedDensity, setSavedDensity] = useState<UiDensity>(density);
  const [savedMinMistakes, setSavedMinMistakes] = useState(minMistakes);
  const [savedMaxCorrectness, setSavedMaxCorrectness] = useState(maxCorrectnessPercentage);
  const [fontSizeError, setFontSizeError] = useState<string | null>(null);
  const [minMistakesError, setMinMistakesError] = useState<string | null>(null);
  const [maxCorrectnessError, setMaxCorrectnessError] = useState<string | null>(null);

  if (userName !== savedUserName) {
    setSavedUserName(userName);
    setNameInput(userName);
  }

  if (shuffleMode !== savedShuffleMode) {
    setSavedShuffleMode(shuffleMode);
    setShuffleInput(shuffleMode);
  }

  if (fontSize !== savedFontSize) {
    setSavedFontSize(fontSize);
    setFontSizeInput(String(fontSize));
  }

  if (density !== savedDensity) {
    setSavedDensity(density);
    setDensityInput(density);
  }

  if (minMistakes !== savedMinMistakes) {
    setSavedMinMistakes(minMistakes);
    setMinMistakesInput(String(minMistakes));
  }

  if (maxCorrectnessPercentage !== savedMaxCorrectness) {
    setSavedMaxCorrectness(maxCorrectnessPercentage);
    setMaxCorrectnessInput(String(maxCorrectnessPercentage));
  }

  const displayDir = pendingDir ?? library.directoryPath;
  const hasChanges =
    nameInput.trim() !== userName ||
    pendingDir !== null ||
    shuffleInput !== shuffleMode ||
    fontSizeInput !== String(fontSize) ||
    densityInput !== density ||
    minMistakesInput !== String(minMistakes) ||
    maxCorrectnessInput !== String(maxCorrectnessPercentage);

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

  async function handlePickDirectory() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: displayDir ?? undefined,
        title: "Choose Quizzy working directory",
      });
      if (!selected || Array.isArray(selected)) return;
      setPendingDir(selected);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleSave() {
    const trimmed = nameInput.trim();
    const parsedMinMistakes = Number(minMistakesInput);
    const parsedMaxCorrectness = Number(maxCorrectnessInput);
    const parsedFontSize = Number(fontSizeInput);

    let hasValidationError = false;

    const nextFontSizeError = validateFontSizeInput(fontSizeInput);
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
        shuffleMode: shuffleInput,
        uiFontSize: parsedFontSize,
        uiDensity: densityInput,
        mistakeLogMinMistakes: parsedMinMistakes,
        mistakeLogMaxCorrectnessPercentage: parsedMaxCorrectness,
        ...(pendingDir !== null ? { workingDirectory: pendingDir } : {}),
      });
    } catch (error) {
      toast.error(errorMessage(error));
      return;
    }

    setUserName(trimmed);
    setNameInput(trimmed);
    setShuffleMode(shuffleInput);
    setFontSize(parsedFontSize);
    setDensity(densityInput);
    setMinMistakes(parsedMinMistakes);
    setMaxCorrectnessPercentage(parsedMaxCorrectness);
    setSavedFontSize(parsedFontSize);
    setSavedDensity(densityInput);
    setSavedMinMistakes(parsedMinMistakes);
    setSavedMaxCorrectness(parsedMaxCorrectness);

    if (pendingDir !== null) {
      await library.refresh();
      setPendingDir(null);
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
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
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
                value={fontSizeInput}
                onChange={(e) => {
                  setFontSizeInput(e.target.value);
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
                value={densityInput}
                onValueChange={(value) => setDensityInput(value as UiDensity)}
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
                <p id="shuffle-mode-label" className="text-sm font-medium text-zinc-700">
                  Shuffle mode
                </p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Randomize question order within each question type group.
                </p>
              </div>
              <Switch
                checked={shuffleInput}
                onCheckedChange={setShuffleInput}
                aria-labelledby="shuffle-mode-label"
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
                value={minMistakesInput}
                onChange={(e) => {
                  setMinMistakesInput(e.target.value);
                  setMinMistakesError(null);
                }}
                className="mt-3 max-w-xs"
              />
              {minMistakesError && (
                <p className="mt-1.5 text-sm text-red-600">{minMistakesError}</p>
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
                value={maxCorrectnessInput}
                onChange={(e) => {
                  setMaxCorrectnessInput(e.target.value);
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
            {library.directoryPath && !library.directoryAvailable && !pendingDir && (
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
