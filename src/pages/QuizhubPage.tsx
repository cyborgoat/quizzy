import { confirm } from "@tauri-apps/plugin-dialog";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CloudDownload,
  FileQuestion,
  Pencil,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/quiz/EmptyState";
import { ErrorState } from "@/components/quiz/ErrorState";
import { LoadingState } from "@/components/quiz/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-styles";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SearchField } from "@/components/ui/search-field";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";
import { useQuizhubCatalog } from "@/hooks/useQuizhubCatalog";
import { formatShortDate } from "@/lib/formatDate";
import {
  errorMessage,
  nativeApi,
  type HubItem,
  type HubItemRef,
  type HubItemState,
} from "@/lib/native";
import {
  filterHubItems,
  formatBytes,
  groupHubItems,
  hubItemKey,
  hubStateDescription,
  hubStateLabel,
  isDownloadable,
  isFromHub,
  notifyQuizhubChanged,
  summarizeHubReport,
  type HubCategoryView,
} from "@/lib/quizhub";
import { cn } from "@/lib/utils";

const stateBadgeClass: Record<HubItemState, string> = {
  available: "",
  nameTaken: "border-amber-200 bg-amber-50 text-amber-800",
  installed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  updateAvailable: "border-sky-200 bg-sky-50 text-sky-800",
  modifiedLocally: "border-amber-200 bg-amber-50 text-amber-800",
  removedRemotely: "border-zinc-300 bg-zinc-100 text-zinc-600",
};

export function QuizhubPage() {
  const quizLibrary = useQuizLibrary();
  const knowledgeLibrary = useKnowledgeLibrary();
  const [isWorking, setIsWorking] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const directoryReady = Boolean(quizLibrary.directoryPath && quizLibrary.directoryAvailable);

  const { catalog, error: loadError, isRefreshing: isLoading, refresh: load } =
    useQuizhubCatalog(quizLibrary.directoryPath, directoryReady);
  const { openQuizStart } = useQuizStartDialog();
  const quizSources = useMemo(
    () => new Map(quizLibrary.quizzes.map((source) => [source.fileName, source])),
    [quizLibrary.quizzes],
  );

  const categories = useMemo(
    () => (catalog ? groupHubItems(catalog.categories, catalog.items) : []),
    [catalog],
  );
  const activeCategory = categories.find((category) => category.id === categoryId) ?? null;
  const updateCount = catalog?.items.filter((item) => item.state === "updateAvailable").length ?? 0;

  async function afterChange() {
    notifyQuizhubChanged();
    await Promise.all([
      quizLibrary.refresh({ background: true }),
      knowledgeLibrary.refresh({ background: true }),
      load(false, true),
    ]);
  }

  async function download(items: HubItemRef[], force = false) {
    if (items.length === 0 || isWorking) return;
    setIsWorking(true);
    try {
      const report = await nativeApi.hubDownload(items, force);
      const summary = summarizeHubReport(report);
      const problems = report.outcomes.filter(
        (outcome) => outcome.result === "failed" || outcome.result === "skipped",
      );
      if (report.failed > 0) {
        toast.error(summary, {
          description: problems.map((outcome) => `${outcome.title}: ${outcome.detail ?? outcome.result}`).join("\n"),
        });
      } else if (report.skipped > 0) {
        toast.warning(summary, {
          description: problems.map((outcome) => `${outcome.title}: ${outcome.detail ?? outcome.result}`).join("\n"),
        });
      } else {
        toast.success(summary);
      }
      setSelected(new Set());
      await afterChange();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsWorking(false);
    }
  }

  async function replaceWithRemote(item: HubItem) {
    const message =
      item.state === "modifiedLocally"
        ? `Replace your edited copy of "${item.title}" with the quizhub version? Your changes will be lost.`
        : `Replace the local file ${item.fileName} with "${item.title}" from quizhub? The local file will be overwritten.`;
    const approved = await confirm(message, { title: "Replace local file?", kind: "warning" });
    if (approved) await download([item], true);
  }

  async function remove(item: HubItem) {
    if (isWorking) return;
    const edited = item.state === "modifiedLocally";
    const approved = await confirm(
      edited
        ? `Delete "${item.title}"? You edited it after downloading, and your changes will be lost.`
        : `Delete "${item.title}" from your library? You can download it again later.`,
      { title: "Remove downloaded item?", kind: "warning" },
    );
    if (!approved) return;
    setIsWorking(true);
    try {
      await nativeApi.hubRemove(item, { force: edited });
      toast.success(`Removed ${item.title}.`);
      await afterChange();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsWorking(false);
    }
  }

  async function keepAsLocal(item: HubItem) {
    if (isWorking) return;
    setIsWorking(true);
    try {
      await nativeApi.hubRemove(item, { keepFile: true });
      toast.success(`${item.title} is now a local file.`);
      await afterChange();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsWorking(false);
    }
  }

  function toggle(item: HubItem) {
    if (!isDownloadable(item.state)) return;
    setSelected((current) => {
      const next = new Set(current);
      const key = hubItemKey(item);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (!directoryReady) {
    return (
      <PageShell>
        <PageHeader title="Quizhub" description="Browse and download curated quizzes and notes." />
        <div className="mt-6">
          <EmptyState
            title="Choose a quiz folder first"
            description="Quizhub downloads quizzes and notes into your working directory. Select one in Settings to get started."
            action={
              <Link to="/settings" className={buttonClassName({ className: "mt-6" })}>
                Open Settings
              </Link>
            }
          />
        </div>
      </PageShell>
    );
  }

  const selectedRefs: HubItemRef[] =
    catalog?.items
      .filter((item) => selected.has(hubItemKey(item)) && isDownloadable(item.state))
      .map(({ kind, id }) => ({ kind, id })) ?? [];

  return (
    <PageShell>
      <PageHeader
        title="Quizhub"
        description="Browse curated quizzes and notes, and download the ones you want. Downloaded files are marked as Quizhub content; edits you make are never overwritten."
        actions={
          <>
            {updateCount > 0 && (
              <Button
                size="sm"
                disabled={isWorking}
                onClick={() =>
                  void download(
                    catalog!.items
                      .filter((item) => item.state === "updateAvailable")
                      .map(({ kind, id }) => ({ kind, id })),
                  )
                }
              >
                <CloudDownload className="size-3.5" />
                Update all ({updateCount})
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading || isWorking}
              onClick={() => void load(true)}
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
              Check for updates
            </Button>
          </>
        }
      >
        <SourceUrl baseUrl={catalog?.baseUrl} onSaved={() => void load(true)} />
      </PageHeader>

      <div className="mt-5">
        {loadError && catalog && (
          <p role="status" className="mb-3 text-sm text-amber-700">
            Couldn’t check for updates. Showing the saved catalog. {loadError}
          </p>
        )}
        {loadError && !catalog ? (
          <ErrorState
            title="Couldn't load quizhub"
            description={loadError}
            actionLabel="Try again"
            onAction={() => void load(true)}
          />
        ) : !catalog ? (
          <LoadingState message="Loading quizhub catalog…" />
        ) : activeCategory ? (
          <CategoryView
            category={activeCategory}
            query={query}
            onQueryChange={setQuery}
            selected={selected}
            isWorking={isWorking}
            onBack={() => {
              setCategoryId(null);
              setQuery("");
              setSelected(new Set());
            }}
            onToggle={toggle}
            onSelectAll={(items) =>
              setSelected(new Set(items.filter((item) => isDownloadable(item.state)).map(hubItemKey)))
            }
            renderOpenAction={(item) => {
              if (item.kind !== "quiz" || !isFromHub(item.state)) return null;
              const source = quizSources.get(item.fileName);
              if (!source) return null;
              return (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={source.archived}
                  onClick={() => openQuizStart({ quizId: source.quiz.id })}
                >
                  <Play className="size-3.5" />
                  {source.archived ? "Archived" : "Start quiz"}
                </Button>
              );
            }}
            onDownload={(item) => void download([item])}
            onReplace={(item) => void replaceWithRemote(item)}
            onRemove={(item) => void remove(item)}
            onKeepAsLocal={(item) => void keepAsLocal(item)}
          />
        ) : (
          <CategoryGrid categories={categories} onOpen={setCategoryId} />
        )}
        {catalog && catalog.skipped.length > 0 && (
          <p className="mt-4 text-xs text-zinc-500">
            {catalog.skipped.length} item(s) need a newer Quizzy and were hidden: {catalog.skipped.join(", ")}
          </p>
        )}
      </div>

      {selectedRefs.length > 0 && (
        <div className="sticky bottom-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2 shadow-md">
          <span className="text-sm text-zinc-700">{selectedRefs.length} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button size="sm" disabled={isWorking} onClick={() => void download(selectedRefs)}>
              <CloudDownload className="size-3.5" />
              {isWorking ? "Downloading…" : "Download selected"}
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function SourceUrl({ baseUrl, onSaved }: { baseUrl?: string; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(value: string) {
    setSaving(true);
    try {
      await nativeApi.saveSettings({ quizhubBaseUrl: value });
      setEditing(false);
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-zinc-500">
        <span className="shrink-0">Source:</span>
        <code className="min-w-0 truncate rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-700">
          {baseUrl ?? "…"}
        </code>
        <button
          type="button"
          aria-label="Change quizhub source"
          className="rounded p-1 hover:bg-zinc-100"
          onClick={() => {
            setDraft(baseUrl ?? "");
            setEditing(true);
          }}
        >
          <Pencil className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-2 flex max-w-xl items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void save(draft);
      }}
    >
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        aria-label="Quizhub URL"
        placeholder="https://cyborgoat.github.io/quizhub/"
        className="h-7 text-xs"
        autoFocus
      />
      <Button size="sm" type="submit" disabled={saving}>
        Save
      </Button>
      <Button size="sm" type="button" variant="ghost" disabled={saving} onClick={() => void save("")}>
        Reset
      </Button>
      <Button size="sm" type="button" variant="ghost" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </form>
  );
}

function CategoryGrid({
  categories,
  onOpen,
}: {
  categories: HubCategoryView[];
  onOpen: (id: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <EmptyState title="Quizhub is empty" description="No categories are published at this source yet." />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onOpen(category.id)}
          className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <span className="text-base font-semibold text-zinc-950">{category.title}</span>
          <span className="text-xs text-zinc-500">
            {category.quizCount} {category.quizCount === 1 ? "quiz" : "quizzes"} · {category.noteCount}{" "}
            {category.noteCount === 1 ? "note" : "notes"}
          </span>
          <span className="flex flex-wrap gap-1.5">
            {category.downloadedCount > 0 && (
              <Badge className={stateBadgeClass.installed}>{category.downloadedCount} downloaded</Badge>
            )}
            {category.updateCount > 0 && (
              <Badge className={stateBadgeClass.updateAvailable}>
                {category.updateCount} {category.updateCount === 1 ? "update" : "updates"}
              </Badge>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

function CategoryView({
  category,
  query,
  onQueryChange,
  selected,
  isWorking,
  onBack,
  onToggle,
  onSelectAll,
  renderOpenAction,
  onDownload,
  onReplace,
  onRemove,
  onKeepAsLocal,
}: {
  category: HubCategoryView;
  query: string;
  onQueryChange: (value: string) => void;
  selected: ReadonlySet<string>;
  isWorking: boolean;
  onBack: () => void;
  onToggle: (item: HubItem) => void;
  onSelectAll: (items: HubItem[]) => void;
  renderOpenAction: (item: HubItem) => ReactNode;
  onDownload: (item: HubItem) => void;
  onReplace: (item: HubItem) => void;
  onRemove: (item: HubItem) => void;
  onKeepAsLocal: (item: HubItem) => void;
}) {
  const items = filterHubItems(category.items, query);
  const selectable = items.filter((item) => isDownloadable(item.state));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-3.5" />
          All categories
        </Button>
        <h2 className="text-lg font-semibold text-zinc-950">{category.title}</h2>
        <div className="ml-auto flex items-center gap-2">
          <SearchField
            value={query}
            onChange={onQueryChange}
            placeholder="Search this category"
            className="w-64"
          />
          {selectable.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => onSelectAll(selectable)}>
              Select all ({selectable.length})
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">No items match.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {items.map((item) => {
            const key = hubItemKey(item);
            const canSelect = isDownloadable(item.state);
            const KindIcon = item.kind === "quiz" ? FileQuestion : BookOpen;
            return (
              <li key={key} className="flex items-center gap-3 px-3 py-2.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selected.has(key)}
                  aria-label={`Select ${item.title}`}
                  disabled={!canSelect}
                  onClick={() => onToggle(item)}
                  className="disabled:cursor-default"
                >
                  {canSelect ? (
                    <Checkbox checked={selected.has(key)} />
                  ) : (
                    <span className="flex size-5 items-center justify-center text-emerald-600">
                      {item.state === "installed" && <Check className="size-4" />}
                    </span>
                  )}
                </button>
                <KindIcon className="size-4 shrink-0 text-zinc-400" aria-label={item.kind} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-zinc-950">{item.title}</span>
                    {item.state !== "available" && (
                      <Badge
                        className={cn("px-2 py-0 text-[11px]", stateBadgeClass[item.state])}
                        title={hubStateDescription[item.state]}
                      >
                        {hubStateLabel[item.state]}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                    <span>{item.kind === "quiz" ? "Quiz" : "Note"}</span>
                    {item.size > 0 && <span>· {formatBytes(item.size)}</span>}
                    {item.updated && <span>· Updated {formatShortDate(item.updated)}</span>}
                    {item.tags.length > 0 && <span>· {item.tags.join(", ")}</span>}
                  </div>
                </div>
                {renderOpenAction(item)}
                <ItemActions
                  item={item}
                  disabled={isWorking}
                  onDownload={onDownload}
                  onReplace={onReplace}
                  onRemove={onRemove}
                  onKeepAsLocal={onKeepAsLocal}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ItemActions({
  item,
  disabled,
  onDownload,
  onReplace,
  onRemove,
  onKeepAsLocal,
}: {
  item: HubItem;
  disabled: boolean;
  onDownload: (item: HubItem) => void;
  onReplace: (item: HubItem) => void;
  onRemove: (item: HubItem) => void;
  onKeepAsLocal: (item: HubItem) => void;
}) {
  const removeButton = (
    <Button
      size="icon"
      variant="ghost"
      aria-label={`Remove ${item.title}`}
      title="Remove downloaded file"
      disabled={disabled}
      onClick={() => onRemove(item)}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );

  switch (item.state) {
    case "available":
      return (
        <Button size="sm" variant="outline" disabled={disabled} onClick={() => onDownload(item)}>
          <CloudDownload className="size-3.5" />
          Download
        </Button>
      );
    case "updateAvailable":
      return (
        <div className="flex items-center gap-1">
          <Button size="sm" disabled={disabled} onClick={() => onDownload(item)}>
            Update
          </Button>
          {removeButton}
        </div>
      );
    case "modifiedLocally":
      return (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            title="Keep your edited copy as a local file and stop tracking it from quizhub"
            disabled={disabled}
            onClick={() => onKeepAsLocal(item)}
          >
            Keep as local
          </Button>
          <Button size="sm" variant="outline" disabled={disabled} onClick={() => onReplace(item)}>
            Replace with remote
          </Button>
        </div>
      );
    case "nameTaken":
      return (
        <Button size="sm" variant="outline" disabled={disabled} onClick={() => onReplace(item)}>
          Replace local file
        </Button>
      );
    case "removedRemotely":
      return (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onKeepAsLocal(item)}>
            Keep as local
          </Button>
          {removeButton}
        </div>
      );
    case "installed":
      return removeButton;
  }
}
