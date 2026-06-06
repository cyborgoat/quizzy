import { open } from "@tauri-apps/plugin-dialog";
import { confirm } from "@tauri-apps/plugin-dialog";
import { FolderCog, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useUserProfile } from "@/hooks/useUserProfile";
import { errorMessage, nativeApi } from "@/lib/native";

export function SettingsPage() {
  const { userName, setUserName } = useUserProfile();
  const library = useQuizLibrary();
  const [nameInput, setNameInput] = useState(userName);
  const [pendingDir, setPendingDir] = useState<string | null>(null);

  const displayDir = pendingDir ?? library.directoryPath;
  const hasChanges = nameInput.trim() !== userName || pendingDir !== null;

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
    setUserName(trimmed);
    setNameInput(trimmed);

    if (pendingDir !== null) {
      try {
        await nativeApi.setWorkingDirectory(pendingDir);
        await library.refresh();
        setPendingDir(null);
      } catch (error) {
        toast.error(errorMessage(error));
        return;
      }
    }

    toast.success("Settings saved.");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold text-zinc-950">Settings</h1>
      <p className="mt-1 text-sm text-zinc-500">Configure your profile and quiz directory.</p>

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
            <FolderCog className="size-4" />
            Quiz directory
          </h2>
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-700">Working directory</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Quizzy loads quiz JSON files from this folder.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-zinc-100 px-2 py-1.5 text-xs text-zinc-700">
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
