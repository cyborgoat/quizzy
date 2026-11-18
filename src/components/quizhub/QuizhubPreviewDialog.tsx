import { Download, Play, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { KnowledgeProse } from "@/components/knowledge/KnowledgeProse";
import { MarkdownContent } from "@/components/quiz/MarkdownContent";
import { ErrorState } from "@/components/quiz/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResizableDialogShell } from "@/components/ui/resizable-dialog-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { quizSchema } from "@/data/quizSchema";
import { splitFrontMatter } from "@/lib/frontMatter";
import { errorMessage, nativeApi, type HubItem, type HubPreview } from "@/lib/native";
import { isDownloadable, isFromHub } from "@/lib/quizhub";
import type { Quiz, QuizQuestion } from "@/types/quiz";

const questionTypeLabel: Record<QuizQuestion["type"], string> = {
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  true_false: "True / false",
};

export function QuizhubPreviewDialog({
  item,
  onOpenChange,
  onDownload,
  onStartQuiz,
  onRemove,
  isDownloading = false,
  isWorking = false,
}: {
  item: HubItem | null;
  onOpenChange: (open: boolean) => void;
  onDownload?: (item: HubItem) => void;
  onStartQuiz?: (item: HubItem) => void;
  onRemove?: (item: HubItem) => void;
  isDownloading?: boolean;
  isWorking?: boolean;
}) {
  const open = item !== null;
  const [preview, setPreview] = useState<HubPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!item) {
      setPreview(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setPreview(null);
    setError(null);

    void nativeApi
      .hubPreviewItem({ kind: item.kind, id: item.id })
      .then((result) => {
        if (!active) return;
        setPreview(result);
      })
      .catch((cause) => {
        if (!active) return;
        setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [item, reloadKey]);

  if (!item) return null;

  const canDownload = Boolean(isDownloadable(item.state) && onDownload);
  const canRemove = Boolean(isFromHub(item.state) && onRemove);
  const canStartQuiz = Boolean(item.kind === "quiz" && isFromHub(item.state) && onStartQuiz);
  const fromLocal = isFromHub(item.state);
  const downloadLabel = item.state === "updateAvailable" ? "Update" : "Download";
  const description =
    item.kind === "quiz"
      ? fromLocal
        ? "Preview of your local quiz. Answers are hidden."
        : "Quiz preview from Quizhub. Answers are hidden."
      : fromLocal
        ? "Preview of your local knowledge note."
        : "Knowledge preview from Quizhub.";

  return (
    <ResizableDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={item.title}
      description={description}
      footer={
        <div className="flex w-full items-center gap-2">
          {canRemove && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={isWorking}
              onClick={() => onRemove?.(item)}
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {canStartQuiz && (
              <Button
                size="sm"
                variant={canDownload ? "outline" : "default"}
                disabled={isWorking}
                onClick={() => onStartQuiz?.(item)}
              >
                <Play className="size-3.5 fill-current" />
                Start quiz
              </Button>
            )}
            {canDownload && (
              <Button
                size="sm"
                disabled={isDownloading}
                onClick={() => onDownload?.(item)}
              >
                {isDownloading ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <Download className="size-3.5" />
                )}
                {isDownloading
                  ? item.state === "updateAvailable"
                    ? "Updating…"
                    : "Downloading…"
                  : downloadLabel}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {isLoading ? (
        <PreviewSkeleton kind={item.kind} />
      ) : error ? (
        <ErrorState
          title="Couldn't load preview"
          description={error}
          actionLabel="Try again"
          onAction={() => setReloadKey((current) => current + 1)}
        />
      ) : preview ? (
        preview.kind === "quiz" ? (
          <QuizPreviewBody contents={preview.contents} />
        ) : (
          <NotePreviewBody contents={preview.contents} />
        )
      ) : null}
    </ResizableDialogShell>
  );
}

function PreviewSkeleton({ kind }: { kind: HubItem["kind"] }) {
  if (kind === "note") {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading preview">
        <Skeleton className="h-7 w-2/3" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading preview">
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="space-y-3 rounded-xl border border-zinc-200 px-4 py-3"
        >
          <div className="flex gap-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2 pt-1">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3.5 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function QuizPreviewBody({ contents }: { contents: string }) {
  let quiz: Quiz | null = null;
  let parseError: string | null = null;

  try {
    const json: unknown = JSON.parse(contents);
    const result = quizSchema.safeParse(json);
    if (result.success) {
      quiz = result.data;
    } else {
      parseError = result.error.issues[0]?.message ?? "Quiz file is invalid.";
    }
  } catch {
    parseError = "Quiz file is not valid JSON.";
  }

  if (!quiz) {
    return (
      <p className="text-sm text-red-600">{parseError ?? "Unable to parse quiz."}</p>
    );
  }

  return (
    <div className="space-y-5">
      {quiz.description && (
        <p className="text-sm leading-6 text-zinc-600">{quiz.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border-zinc-200 bg-zinc-50 text-zinc-700">
          {quiz.questions.length} {quiz.questions.length === 1 ? "question" : "questions"}
        </Badge>
        {quiz.tags.map((tag) => (
          <Badge key={tag} className="border-zinc-200 bg-zinc-50 text-zinc-600">
            {tag}
          </Badge>
        ))}
      </div>
      <ol className="space-y-4">
        {quiz.questions.map((question, index) => (
          <li
            key={question.id}
            className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium tabular-nums text-zinc-500">
                Q{index + 1}
              </span>
              <Badge className="border-zinc-200 bg-white px-2 py-0 text-[11px] text-zinc-600">
                {questionTypeLabel[question.type]}
              </Badge>
            </div>
            <div className="mt-2 text-sm text-zinc-950">
              <MarkdownContent>{question.prompt}</MarkdownContent>
            </div>
            {question.type === "true_false" ? (
              <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                <li>True</li>
                <li>False</li>
              </ul>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
                {question.options.map((option, optionIndex) => (
                  <li key={`${question.id}-${optionIndex}`}>
                    <MarkdownContent inline>{option}</MarkdownContent>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function NotePreviewBody({ contents }: { contents: string }) {
  const split = splitFrontMatter(contents);
  if ("error" in split) {
    return (
      <KnowledgeProse>
        <MarkdownContent variant="prose">{contents}</MarkdownContent>
      </KnowledgeProse>
    );
  }

  const title = split.frontMatter.title?.trim();
  const tags = split.frontMatter.tags ?? [];

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-zinc-950">{title}</h3>}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} className="border-zinc-200 bg-zinc-50 text-zinc-600">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      {split.content.trim() ? (
        <KnowledgeProse>
          <MarkdownContent variant="prose">{split.content}</MarkdownContent>
        </KnowledgeProse>
      ) : (
        <p className="text-sm text-zinc-500">This note has no body content.</p>
      )}
    </div>
  );
}
