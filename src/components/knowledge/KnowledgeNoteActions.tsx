import { FilePlus, Link2 } from "lucide-react";
import { IconActionButton } from "@/components/ui/icon-action-button";

export function KnowledgeNoteActions({
  onLink,
  onAdd,
  linkDisabled = false,
  linkLabel = "Link",
  newNoteLabel = "New note",
}: {
  onLink: () => void;
  onAdd: () => void;
  linkDisabled?: boolean;
  linkLabel?: string;
  newNoteLabel?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <IconActionButton
        icon={Link2}
        label={linkLabel}
        onClick={onLink}
        disabled={linkDisabled}
      />
      <IconActionButton
        icon={FilePlus}
        label={newNoteLabel}
        onClick={onAdd}
      />
    </div>
  );
}
