import { FilePlus, Link2 } from "lucide-react";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { useI18n } from "@/lib/i18n";

export function KnowledgeNoteActions({
  onLink,
  onAdd,
  linkDisabled = false,
  linkLabel,
  newNoteLabel,
}: {
  onLink: () => void;
  onAdd: () => void;
  linkDisabled?: boolean;
  linkLabel?: string;
  newNoteLabel?: string;
}) {
  const { t } = useI18n();

  return (
    <div className="flex shrink-0 items-center gap-1">
      <IconActionButton
        icon={Link2}
        label={linkLabel ?? t("knowledge.linkAction")}
        onClick={onLink}
        disabled={linkDisabled}
      />
      <IconActionButton
        icon={FilePlus}
        label={newNoteLabel ?? t("knowledge.newNote")}
        onClick={onAdd}
      />
    </div>
  );
}
