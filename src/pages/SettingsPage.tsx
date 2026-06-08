import { open } from "@tauri-apps/plugin-dialog";
import { confirm } from "@tauri-apps/plugin-dialog";
import { FolderCog, Shuffle, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizPreferences } from "@/hooks/useQuizPreferences";
import { useUserProfile } from "@/hooks/useUserProfile";
import { errorMessage, nativeApi } from "@/lib/native";

export function SettingsPage() {
  const { userName, setUserName } = useUserProfile();
  const { shuffleMode, setShuffleMode } = useQuizPreferences();
  const library = useQuizLibrary();
  const [nameInput, setNameInput] = useState(userName);
  const [shuffleInput, setShuffleInput] = useState(shuffleMode);
  const [pendingDir, setPendingDir] = useState<string | null>(null);
  const [savedUserName, setSavedUserName] = useState(userName);
  const [savedShuffleMode, setSavedShuffleMode] = useState(shuffleMode);

  if (userName !== savedUserName) {
    setSavedUserName(userName);
    setNameInput(userName);
  }

  if (shuffleMode !== savedShuffleMode) {
    setSavedShuffleMode(shuffleMode);
    setShuffleInput(shuffleMode);
  }

  const displayDir = pendingDir ?? library.directoryPath;
  const hasChanges =
    nameInput.trim() !== userName ||
    pendingDir !== null ||
    shuffleInput !== shuffleMode;

  const blocker = useBlocker(hasChanges);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    confirm("You have unsaved changes. Leave without saving?", {
      title: "Unsaved changes",
      kind: "warning",
    }).then((ok) => {
      if (ok) blocker.proceed();
      else blocker.reset();
    });
  }, [blocker]);

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

    try {
      await nativeApi.saveSettings({
        profileName: trimmed,
        shuffleMode: shuffleInput,
        ...(pendingDir !== null ? { workingDirectory: pendingDir } : {}),
      });
    } catch (error) {
      toast.error(errorMessage(error));
      return;
    }

    setUserName(trimmed);
    setNameInput(trimmed);
    setShuffleMode(shuffleInput);

    if (pendingDir !== null) {
      await library.refresh();
      setPendingDir(null);
    }

    toast.success("Settings saved.");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold text-zinc-950">Settings</h1>
      <p className="mt-1 text-sm text-zinc-500">Configure your profile, quiz preferences, and directory.</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-950">
            <User className="size-4" />
            Profile
          </h2>
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
            <label className="block text-xs font-medium text-zinc-700" htmlFor="full-name">
              Full name
            </label>
            <p className="mt-0.5 text-xs text-zinc-500">Shown on the home page.</p>
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
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-950">
            <Shuffle className="size-4" />
            Quiz preferences
          </h2>
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p id="shuffle-mode-label" className="text-xs font-medium text-zinc-700">
                  Shuffle mode
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
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
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-950">
            <FolderCog className="size-4" />
            Quiz directory
          </h2>
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-700">Working directory</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Quizzy loads quiz JSON files from this folder.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code
                className="min-w-0 flex-1 truncate rounded bg-zinc-100 px-2 py-1.5 text-xs text-zinc-700"
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
              <p className="mt-2 text-xs text-red-600">
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
    </main>
  );
}
