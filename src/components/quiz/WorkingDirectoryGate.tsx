import type { ReactNode } from "react";
import { EmptyState } from "@/components/quiz/EmptyState";
import { LoadingState } from "@/components/quiz/LoadingState";
import { Button } from "@/components/ui/button";

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
    return <LoadingState message={loadingMessage} />;
  }

  if (!directoryAvailable) {
    const needsSetup = !directoryPath;
    return (
      <EmptyState
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
    );
  }

  return children;
}
