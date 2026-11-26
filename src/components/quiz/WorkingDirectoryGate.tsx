import type { ReactNode } from "react";
import { EmptyState } from "@/components/quiz/EmptyState";
import { LoadingState } from "@/components/quiz/LoadingState";
import { Button } from "@/components/ui/button";

function CenteredGate({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100svh-(var(--app-page-py)*2))] items-center justify-center">
      <div className="w-full">{children}</div>
    </div>
  );
}

export function WorkingDirectoryGate({
  isLoading,
  directoryPath,
  directoryAvailable,
  loadingMessage,
  noDirectoryTitle,
  noDirectoryDescription,
  unavailableTitle,
  unavailableDescription,
  onOpenSettings,
  onChooseDirectory,
  chooseDirectoryLabel = "Choose folder",
  chooseDirectoryBusy = false,
  action,
  children,
}: {
  isLoading: boolean;
  directoryPath: string | null;
  directoryAvailable: boolean;
  loadingMessage: string;
  noDirectoryTitle: string;
  noDirectoryDescription: string;
  unavailableTitle: string;
  unavailableDescription: string;
  onOpenSettings: () => void;
  onChooseDirectory?: () => void;
  chooseDirectoryLabel?: string;
  chooseDirectoryBusy?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading && !directoryPath) {
    return (
      <CenteredGate>
        <LoadingState message={loadingMessage} />
      </CenteredGate>
    );
  }

  if (!directoryAvailable) {
    const needsSetup = !directoryPath;
    return (
      <CenteredGate>
        <EmptyState
          className="border-0 bg-transparent"
          icon={
            <img
              src="/quizzy-logo.svg"
              alt=""
              className="mx-auto mb-4 size-14 rounded-xl border border-zinc-200 bg-white shadow-sm"
            />
          }
          title={needsSetup ? noDirectoryTitle : unavailableTitle}
          description={needsSetup ? noDirectoryDescription : unavailableDescription}
          action={
            action ??
            (onChooseDirectory ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button disabled={chooseDirectoryBusy} onClick={onChooseDirectory}>
                  {chooseDirectoryBusy ? "Choosing…" : chooseDirectoryLabel}
                </Button>
                <Button variant="outline" onClick={onOpenSettings}>
                  Open Settings
                </Button>
              </div>
            ) : undefined)
          }
          actionLabel={action || onChooseDirectory ? undefined : "Settings"}
          onAction={action || onChooseDirectory ? undefined : onOpenSettings}
        />
      </CenteredGate>
    );
  }

  return children;
}
