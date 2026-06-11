import type { ReactNode } from "react";
import { EmptyState } from "@/components/quiz/EmptyState";
import { LoadingState } from "@/components/quiz/LoadingState";

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
  children: ReactNode;
}) {
  if (isLoading && !directoryPath) {
    return <LoadingState message={loadingMessage} />;
  }

  if (!directoryAvailable) {
    return (
      <EmptyState
        title={directoryPath ? unavailableTitle : noDirectoryTitle}
        description={directoryPath ? unavailableDescription : noDirectoryDescription}
        actionLabel="Settings"
        onAction={onOpenSettings}
      />
    );
  }

  return children;
}
