import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { questionLinkKey } from "@/lib/knowledgeLinks";
import { searchKnowledgeItems } from "@/lib/knowledgeSearch";
import { errorMessage } from "@/lib/native";
import type { KnowledgeItem } from "@/types/knowledge";

export function LinkKnowledgeNoteDialog({
  open,
  onOpenChange,
  quizId,
  questionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  questionId: string;
}) {
  const { items, saveItem } = useKnowledgeLibrary();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [isLinking, setIsLinking] = useState(false);

  const questionKey = questionLinkKey(quizId, questionId);

  const linkableItems = useMemo(
    () =>
      items.filter(
        (item) =>
          !item.linkedQuizQuestions.some(
            (link) => questionLinkKey(link.quizId, link.questionId) === questionKey,
          ),
      ),
    [items, questionKey],
  );

  const options = useMemo(() => {
    if (!deferredSearch.trim()) return [];

    return searchKnowledgeItems(linkableItems, deferredSearch, { limit: 8 });
  }, [linkableItems, deferredSearch]);

  const showSuggestions = search.trim().length > 0;

  async function handleLink(item: KnowledgeItem) {
    setIsLinking(true);
    try {
      await saveItem({
        ...item,
        linkedQuizQuestions: [
          ...item.linkedQuizQuestions,
          { quizId, questionId },
        ],
      });
      toast.success(`Linked "${item.title}" to this question.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsLinking(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isLinking) return;
    if (!nextOpen) setSearch("");
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="z-60 max-w-lg"
        overlayClassName="z-60"
      >
        <DialogHeader>
          <DialogTitle>Link knowledge note</DialogTitle>
          <DialogDescription>
            Search for an existing note in your knowledge base and link it to this question.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search knowledge notes"
            className="h-9 pl-9"
            disabled={isLinking || linkableItems.length === 0}
          />

          {showSuggestions && (
            <ul className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-sm">
              {options.length === 0 ? (
                <li className="px-3 py-2 text-sm text-zinc-500">No matching notes.</li>
              ) : (
                options.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 disabled:opacity-50"
                      onClick={() => void handleLink(item)}
                      disabled={isLinking}
                    >
                      <span className="font-medium text-zinc-950">{item.title}</span>
                      {item.tags.length > 0 && (
                        <span className="mt-0.5 block truncate text-xs text-zinc-500">
                          {item.tags.join(", ")}
                        </span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {linkableItems.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {items.length === 0
              ? "No knowledge notes yet. Create one first."
              : "Every knowledge note is already linked to this question."}
          </p>
        ) : (
          <p className="text-xs text-zinc-500">
            {linkableItems.length} note{linkableItems.length === 1 ? "" : "s"} available to link.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLinking}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
