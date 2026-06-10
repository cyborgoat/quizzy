import { FilePlus, Link2 } from "lucide-react";
import { IconActionButton } from "@/components/ui/icon-action-button";

export function KnowledgeNoteActions({
  onLink,
  onAdd,
}: {
  onLink: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <IconActionButton
        icon={Link2}
        label="Link existing note"
        onClick={onLink}
      />
      <IconActionButton
        icon={FilePlus}
        label="Add new note"
        onClick={onAdd}
      />
    </div>
  );
}
