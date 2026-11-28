import { confirm } from "@tauri-apps/plugin-dialog";
import { Link } from "@tanstack/react-router";
import {
  BookPlus,
  ChevronRight,
  Languages,
  BookOpen,
  Check,
  Download,
  PackagePlus,
  RefreshCw,
  SquareLetterQ,
  type LucideIcon,
} from "lucide-react";
import { useDeferredValue, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/quiz/EmptyState";
import { ErrorState, ErrorStateAction } from "@/components/quiz/ErrorState";
import { QuizhubConflictDialog } from "@/components/quizhub/QuizhubConflictDialog";
import { QuizhubPreviewDialog } from "@/components/quizhub/QuizhubPreviewDialog";
import { QuizhubSearchBar } from "@/components/quizhub/QuizhubSearchBar";
import { QuizhubSourceUrlDialog } from "@/components/quizhub/QuizhubSourceUrlDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-styles";
import { Checkbox } from "@/components/ui/checkbox";
import { RichText } from "@/components/ui/rich-text";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useGoals } from "@/hooks/useGoals";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";
import { useQuizhubCatalog } from "@/hooks/useQuizhubCatalog";
import { useQuizhubScope } from "@/hooks/useQuizhubScope";
import { useQuizhubPreferences } from "@/hooks/useQuizhubPreferences";
import { formatShortDate } from "@/lib/formatDate";
import {
  errorMessage,
  nativeApi,
  type HubConflict,
  type HubResolution,
  type HubItem,
  type HubItemRef,
  type HubItemState,
  type HubScope,
  type HubLocale,
} from "@/lib/native";
import {
  filterHubCategories,
  filterHubDomains,
  filterHubItems,
  formatBytes,
  groupHubDomains,
  hubItemKey,
  hubStateDescriptionKey,
  hubStateLabelKey,
  REMOVED_HUB_CATEGORY,
  isDownloadable,
  isFromHub,
  notifyQuizhubChanged,
  summarizeHubReport,
  type HubCategoryView,
  type HubDomainView,
  type HubSearchSuggestion,
} from "@/lib/quizhub";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { TFunction } from "@/lib/i18n";

function categoryTitle(category: HubCategoryView, t: TFunction) {
  return category.id === REMOVED_HUB_CATEGORY ? t("hub.removedCategory") : category.title;
}

const stateBadgeClass: Record<HubItemState, string> = {
  available: "",
  installed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  updateAvailable: "border-sky-200 bg-sky-50 text-sky-800",
  removedRemotely: "border-zinc-300 bg-zinc-100 text-zinc-600",
};

export function QuizhubPage() {
  const { t } = useI18n();
  const scope = useQuizhubScope();
  const { quizhubEnabled, setQuizhubEnabled } = useQuizhubPreferences();
  const [isEnabling, setIsEnabling] = useState(false);

  async function enableQuizhub() {
    if (isEnabling) return;
    setIsEnabling(true);
    try {
      await nativeApi.saveSettings({ quizhubEnabled: true });
      setQuizhubEnabled(true);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsEnabling(false);
    }
  }

  if (!quizhubEnabled) {
    return (
      <PageShell>
        <PageHeader title="QuizHub" description={t("hub.description")} />
        <div className="mt-6">
          <EmptyState
            title={t("hub.off.title")}
            description={t("hub.off.description")}
            icon={<PackagePlus className="mx-auto mb-4 size-9 text-zinc-400" aria-hidden="true" />}
            action={
              <Button className="mt-6" disabled={isEnabling} onClick={() => void enableQuizhub()}>
                <PackagePlus className="size-3.5" />
                {isEnabling ? t("hub.off.enabling") : t("hub.off.enable")}
              </Button>
            }
          />
        </div>
      </PageShell>
    );
  }

  if (!scope) {
    return (
      <PageShell>
        <PageHeader title="QuizHub" description={t("hub.description")} />
        <div className="mt-6">
          <EmptyState
            title={t("hub.noFolder.title")}
            description={t("hub.noFolder.description")}
            action={
              <Link to="/settings" className={buttonClassName({ className: "mt-6" })}>
                {t("home.openSettings")}
              </Link>
            }
          />
        </div>
      </PageShell>
    );
  }

  return <QuizhubWorkspace key={JSON.stringify(scope)} scope={scope} />;
}

function QuizhubWorkspace({ scope }: { scope: HubScope }) {
  const preference = "quizzy:quizhub-language:" + scope.baseUrl;
  const { locale: appLocale } = useAppLocale();
  // Only persist an override after the user picks an edition in QuizHub.
  const [explicitLocale, setExplicitLocale] = useState<string | null>(() => localStorage.getItem(preference));
  const locale = explicitLocale ?? appLocale;
  const [knownLocales, setKnownLocales] = useState<HubLocale[]>([]);
  const snapshot = useQuizhubCatalog(scope, locale);
  const { catalog } = snapshot;

  function selectLanguage(id: string) {
    if (id === (catalog?.activeLocale ?? locale)) return;
    setKnownLocales(catalog?.locales ?? knownLocales);
    localStorage.setItem(preference, id);
    setExplicitLocale(id);
  }
  return (
    <QuizhubBrowser
      scope={scope}
      languages={catalog?.locales ?? knownLocales}
      language={catalog?.activeLocale ?? locale}
      onSelectLocale={selectLanguage}
      {...snapshot}
    />
  );
}

function QuizhubBrowser({
  scope,
  catalog,
  error: loadError,
  isRefreshing: isLoading,
  refresh: load,
  languages,
  language,
  onSelectLocale,
}: ReturnType<typeof useQuizhubCatalog> & {
  scope: HubScope;
  languages: HubLocale[];
  language?: string;
  onSelectLocale: (locale: string) => void;
}) {
  const { t } = useI18n();
  const quizLibrary = useQuizLibrary();
  const knowledgeLibrary = useKnowledgeLibrary();
  const { refreshAfterSync } = useGoals();
  const { openQuizStart } = useQuizStartDialog();
  const {
    quizhubBaseUrl,
    setQuizhubBaseUrl,
    quizhubDefaultBaseUrl,
  } = useQuizhubPreferences();
  const isActive = useRef(false);
  const [conflict, setConflict] = useState<HubConflict | null>(null);
  const [sourceUrlDialogOpen, setSourceUrlDialogOpen] = useState(false);
  const [savingSourceUrl, setSavingSourceUrl] = useState(false);
  const resolveConflict = useRef<((decision: HubResolution | null) => void) | null>(null);
  function finishConflict(decision: HubResolution | null) {
    const resolve = resolveConflict.current;
    if (!resolve) return;
    resolveConflict.current = null;
    setConflict(null);
    resolve(decision);
  }

  async function saveSourceUrl(nextUrl: string) {
    if (savingSourceUrl) return;
    const trimmed = nextUrl.trim();
    const previous = quizhubBaseUrl;
    setSavingSourceUrl(true);
    try {
      await nativeApi.saveSettings({
        quizhubBaseUrl:
          !trimmed || trimmed === quizhubDefaultBaseUrl ? "" : trimmed,
      });
      const settings = await nativeApi.getSettings();
      setQuizhubBaseUrl(settings.quizhubBaseUrl || settings.quizhubDefaultBaseUrl);
      setSourceUrlDialogOpen(false);
    } catch (error) {
      setQuizhubBaseUrl(previous);
      toast.error(errorMessage(error));
    } finally {
      setSavingSourceUrl(false);
    }
  }
  useLayoutEffect(() => {
    isActive.current = true;
    return () => {
      isActive.current = false;
      resolveConflict.current?.(null);
      resolveConflict.current = null;
    };
  }, []);

  const [isWorking, setIsWorking] = useState(false);
  const [downloadingKeys, setDownloadingKeys] = useState<ReadonlySet<string>>(new Set());
  const [domainId, setDomainId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isSearchPending = query !== deferredQuery;
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [previewItem, setPreviewItem] = useState<HubItem | null>(null);
  const previousLanguage = useRef(language);

  function clearSelectionMode() {
    setSelecting(false);
    setSelected(new Set());
  }

  // Keep domain/category when switching editions; drop locale-specific UI only.
  useLayoutEffect(() => {
    if (previousLanguage.current === language) return;
    previousLanguage.current = language;
    setQuery("");
    setSelecting(false);
    setSelected(new Set());
    setPreviewItem(null);
    const resolve = resolveConflict.current;
    resolveConflict.current = null;
    setConflict(null);
    resolve?.(null);
  }, [language]);

  const activeLocale = catalog?.activeLocale;
  const manifestUrl = catalog?.manifestUrl;
  const selection = useMemo(() => activeLocale && manifestUrl
    ? { scope, locale: activeLocale, manifestUrl }
    : null, [scope, activeLocale, manifestUrl]);
  const canInstall = Boolean(selection);

  const grouped = useMemo(
    () => catalog ? groupHubDomains(catalog.domains, catalog.categories, catalog.items) : null,
    [catalog],
  );
  const domains = grouped?.domains ?? [];
  const visibleDomains = useMemo(
    () => filterHubDomains(domains, deferredQuery),
    [domains, deferredQuery],
  );
  const activeDomain = domains.find((domain) => domain.id === domainId);
  const visibleCategories = useMemo(
    () => (activeDomain ? filterHubCategories(activeDomain.categories, deferredQuery) : []),
    [activeDomain, deferredQuery],
  );
  const activeCategory = activeDomain?.categories.find((category) => category.id === categoryId) ??
    (grouped?.removed?.id === categoryId ? grouped?.removed : null);
  const visibleRemoved =
    grouped?.removed && filterHubCategories([grouped.removed], deferredQuery).length > 0
      ? grouped.removed
      : undefined;

  // Drop browse position when the active edition no longer has that domain/category.
  useLayoutEffect(() => {
    if (!grouped) return;
    if (domainId && !domains.some((domain) => domain.id === domainId)) {
      setDomainId(null);
      setCategoryId(null);
      return;
    }
    if (
      categoryId &&
      categoryId !== grouped.removed?.id &&
      !activeDomain?.categories.some((category) => category.id === categoryId)
    ) {
      setCategoryId(null);
    }
  }, [grouped, domains, domainId, categoryId, activeDomain]);
  const updateCount = canInstall
    ? catalog?.items.filter((item) => item.state === "updateAvailable").length ?? 0
    : 0;
  const quizSources = useMemo(
    () => new Map(quizLibrary.quizzes.map((source) => [source.fileName, source])),
    [quizLibrary.quizzes],
  );

  async function afterChange() {
    await Promise.all([
      quizLibrary.refresh({ background: true }),
      knowledgeLibrary.refresh({ background: true }),
      refreshAfterSync(),
      load(false, true),
    ]);
  }

  async function download(items: HubItemRef[]) {
    if (!selection || !canInstall || items.length === 0 || isWorking || !isActive.current) return;
    setDownloadingKeys(new Set(items.map(hubItemKey)));
    setIsWorking(true);
    try {
      // Revalidate so renamed hub paths/ids are picked up before the download round-trip.
      await load(true, true);
      if (!isActive.current) return;
      const report = await nativeApi.hubDownload(selection, items);
      const pending = [...report.conflicts];
      while (pending.length > 0 && isActive.current) {
        const next = pending.shift()!;
        // Close preview first so its overlay does not sit above the conflict dialog.
        setPreviewItem(null);
        const decision = await new Promise<HubResolution | null>((resolve) => {
          resolveConflict.current = resolve;
          setConflict(next);
        });
        if (!decision) {
          report.skipped += 1;
          continue;
        }
        const result = await nativeApi.hubDownload(selection, [decision.item], decision);
        pending.unshift(...result.conflicts);
        report.added += result.added;
        report.updated += result.updated;
        report.unchanged += result.unchanged;
        report.skipped += result.skipped;
        report.failed += result.failed;
        report.outcomes.push(...result.outcomes);
      }
      notifyQuizhubChanged();
      if (!isActive.current) {
        await afterChange();
        return;
      }
      const summary = summarizeHubReport(report, t);
      const problems = report.outcomes.filter(
        (outcome) => outcome.result === "failed" || outcome.result === "skipped",
      );
      if (report.failed > 0 || report.skipped > 0) {
        const options = {
          description: problems.map((outcome) => `${outcome.title}: ${outcome.detail ?? outcome.result}`).join("\n"),
        };
        if (report.failed > 0) toast.error(summary, options);
        else toast.warning(summary, options);
      } else {
        toast.success(summary);
        setPreviewItem(null);
      }
      setSelected(new Set());
      await afterChange();
    } catch (error) {
      if (isActive.current) toast.error(errorMessage(error));
    } finally {
      if (isActive.current) {
        setDownloadingKeys(new Set());
        setIsWorking(false);
      }
    }
  }

  async function remove(item: HubItem, keepFile = false) {
    if (!selection || !canInstall || isWorking) return;
    if (!keepFile) {
      const approved = await confirm(
        t("hub.confirmRemove", { title: item.title }),
        { title: t("hub.confirmRemoveTitle"), kind: "warning" },
      );
      if (!approved) return;
    }
    if (!isActive.current) return;
    setIsWorking(true);
    try {
      await nativeApi.hubRemove(selection, item, { keepFile, force: !keepFile });
      notifyQuizhubChanged();
      if (!isActive.current) {
        await afterChange();
        return;
      }
      toast.success(
        keepFile
          ? t("hub.nowLocal", { title: item.title })
          : t("hub.removed", { title: item.title }),
      );
      setPreviewItem(null);
      await afterChange();
    } catch (error) {
      if (isActive.current) toast.error(errorMessage(error));
    } finally {
      if (isActive.current) setIsWorking(false);
    }
  }

  function toggle(item: HubItem) {
    if (!canInstall || !isDownloadable(item.state)) return;
    setSelected((current) => {
      const next = new Set(current);
      const key = hubItemKey(item);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function navigateSuggestion(suggestion: HubSearchSuggestion) {
    clearSelectionMode();
    setQuery("");
    if (suggestion.kind === "domain") {
      setDomainId(suggestion.domainId);
      setCategoryId(null);
      setPreviewItem(null);
      return;
    }
    if (suggestion.kind === "category") {
      setDomainId(suggestion.domainId);
      setCategoryId(suggestion.categoryId);
      setPreviewItem(null);
      return;
    }
    setDomainId(suggestion.domainId);
    setCategoryId(suggestion.categoryId);
    setPreviewItem(suggestion.item);
  }

  const selectedRefs: HubItemRef[] =
    catalog?.items
      .filter((item) => selected.has(hubItemKey(item)) && isDownloadable(item.state))
      .map(({ kind, id }) => ({ kind, id })) ?? [];

  const previewSource =
    previewItem?.kind === "quiz" && isFromHub(previewItem.state)
      ? quizSources.get(previewItem.fileName)
      : undefined;
  const canStartPreviewQuiz = Boolean(previewSource && !previewSource.archived);

  return (
    <PageShell>
      <PageHeader
        title="QuizHub"
        description={t("hub.description")}
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
                <Download className="size-3.5" />
                {t("hub.updateAll", { count: updateCount })}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading || isWorking}
              onClick={() => void load(true)}
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
              {t("hub.checkUpdates")}
            </Button>
          </>
        }
      />

      <div className="mt-5">
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <nav aria-label={t("hub.breadcrumb.aria")} className="min-w-0 text-sm">
              {activeDomain || activeCategory ? (
                <ol className="flex flex-wrap items-center gap-2">
                  <li>
                    <button
                      type="button"
                      className="font-medium text-zinc-700 hover:underline"
                      onClick={() => {
                        setDomainId(null);
                        setCategoryId(null);
                        setQuery("");
                        clearSelectionMode();
                      }}
                    >
                      QuizHub
                    </button>
                  </li>
                  {activeDomain && (
                    <li className="flex items-center gap-2">
                      <ChevronRight className="size-4 text-zinc-400" aria-hidden="true" />
                      {activeCategory ? (
                        <button
                          type="button"
                          className="font-medium text-zinc-700 hover:underline"
                          onClick={() => {
                            setCategoryId(null);
                            setQuery("");
                            clearSelectionMode();
                          }}
                        >
                          {activeDomain.title}
                        </button>
                      ) : (
                        <span aria-current="location" className="font-semibold text-zinc-950">
                          {activeDomain.title}
                        </span>
                      )}
                    </li>
                  )}
                  {activeCategory && (
                    <li aria-current="location" className="flex items-center gap-2 font-semibold text-zinc-950">
                      <ChevronRight className="size-4 text-zinc-400" aria-hidden="true" />
                      {categoryTitle(activeCategory, t)}
                    </li>
                  )}
                </ol>
              ) : (
                <p className="font-medium text-zinc-700">{t("hub.chooseDomain")}</p>
              )}
            </nav>
            {languages.length > 0 && (
              <div className="flex shrink-0 items-center gap-2">
                <Languages className="size-4 text-zinc-600" aria-hidden="true" />
                <label htmlFor="quizhub-language" className="text-sm font-medium text-zinc-800">{t("home.languageLabel")}</label>
                <Select value={language} onValueChange={onSelectLocale} disabled={isWorking}>
                  <SelectTrigger id="quizhub-language" className="w-36 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {languages.map((edition) => (
                      <SelectItem key={edition.id} value={edition.id}>{edition.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {catalog && !catalog.editionError && (
            <QuizhubSearchBar
              value={query}
              onChange={setQuery}
              pending={isSearchPending}
              domains={domains}
              removed={grouped?.removed}
              onSelect={navigateSuggestion}
            />
          )}
        </div>
        {loadError && catalog && (
          <p role="status" className="mb-3 text-sm text-amber-700">
            {t("hub.updateCheckFailed", { error: loadError })}
          </p>
        )}
        {loadError && !catalog ? (
          <ErrorState
            title={t("hub.loadFailedTitle")}
            description={loadError}
            actions={
              <RichText
                text={t("hub.loadFailedActions")}
                slots={{
                  retry: (
                    <ErrorStateAction onClick={() => void load(true)}>
                      {t("hub.tryAgain")}
                    </ErrorStateAction>
                  ),
                  changeSource: (
                    <ErrorStateAction onClick={() => setSourceUrlDialogOpen(true)}>
                      {t("hub.changeSourceUrl")}
                    </ErrorStateAction>
                  ),
                }}
              />
            }
          />
        ) : !catalog ? (
          <div
            className="flex flex-col items-center justify-center gap-3 py-20"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <Spinner className="size-6 text-zinc-500" />
            <p className="text-sm text-zinc-500">{t("hub.loading")}</p>
          </div>
        ) : catalog.editionError ? (
          <ErrorState
            title={t("hub.editionFailedTitle")}
            description={catalog.editionError}
            actions={
              <ErrorStateAction onClick={() => void load(true)}>
                {t("hub.tryAgain")}
              </ErrorStateAction>
            }
          />
        ) : activeCategory ? (
          <CategoryView
            category={activeCategory}
            canInstall={canInstall}
            query={deferredQuery}
            selecting={selecting}
            selected={selected}
            isWorking={isWorking}
            downloadingKeys={downloadingKeys}
            onToggle={toggle}
            onStartSelecting={() => setSelecting(true)}
            onCancelSelecting={clearSelectionMode}
            onSelectAll={(items) =>
              setSelected(new Set(items.filter((item) => isDownloadable(item.state)).map(hubItemKey)))
            }
            onPreview={setPreviewItem}
            onDownload={(item) => void download([item])}
            onKeepAsLocal={(item) => void remove(item, true)}
          />
        ) : activeDomain ? (
          deferredQuery.trim() && visibleCategories.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">{t("hub.noMatch")}</p>
          ) : (
            <CategoryGrid categories={visibleCategories} onOpen={setCategoryId} />
          )
        ) : deferredQuery.trim() && visibleDomains.length === 0 && !visibleRemoved ? (
          <p className="py-10 text-center text-sm text-zinc-500">{t("hub.noMatch")}</p>
        ) : (
          <DomainGrid
            domains={visibleDomains}
            removed={visibleRemoved}
            onOpen={setDomainId}
            onOpenRemoved={setCategoryId}
          />
        )}
        {catalog && catalog.skipped.length > 0 && (
          <p className="mt-4 text-xs text-zinc-500">
            {t("hub.skippedNewer", {
              count: catalog.skipped.length,
              list: catalog.skipped.join(", "),
            })}
          </p>
        )}
      </div>

      <QuizhubConflictDialog conflict={conflict} onResolve={finishConflict} />

      <QuizhubSourceUrlDialog
        open={sourceUrlDialogOpen}
        onOpenChange={setSourceUrlDialogOpen}
        initialUrl={quizhubBaseUrl || quizhubDefaultBaseUrl}
        defaultUrl={quizhubDefaultBaseUrl}
        saving={savingSourceUrl}
        onSave={saveSourceUrl}
      />

      <QuizhubPreviewDialog
        item={previewItem}
        selection={selection}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPreviewItem(null);
        }}
        isDownloading={Boolean(previewItem && downloadingKeys.has(hubItemKey(previewItem)))}
        isWorking={isWorking}
        onDownload={canInstall ? (item) => void download([item]) : undefined}
        onRemove={canInstall ? (item) => void remove(item) : undefined}
        onStartQuiz={
          canStartPreviewQuiz
            ? (item) => {
                const source = quizSources.get(item.fileName);
                if (!source || source.archived) return;
                setPreviewItem(null);
                openQuizStart({ quizId: source.quiz.id });
              }
            : undefined
        }
      />

      {selecting && selectedRefs.length > 0 && (
        <div className="sticky bottom-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2 shadow-md">
          <span className="text-sm text-zinc-700">{t("hub.selectedCount", { count: selectedRefs.length })}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              {t("common.clear")}
            </Button>
            <Button
              size="sm"
              disabled={isWorking}
              onClick={() => void download(selectedRefs)}
            >
              {downloadingKeys.size > 0 ? (
                <Spinner className="size-3.5" />
              ) : (
                <Download className="size-3.5" />
              )}
              {downloadingKeys.size > 0 ? t("hub.downloading") : t("hub.downloadSelected")}
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function DomainGrid({
  domains,
  removed,
  onOpen,
  onOpenRemoved,
}: {
  domains: HubDomainView[];
  removed?: HubCategoryView;
  onOpen: (id: string) => void;
  onOpenRemoved: (id: string) => void;
}) {
  const { t } = useI18n();
  if (domains.length === 0 && !removed) {
    return <EmptyState title={t("hub.empty.title")} description={t("hub.empty.edition")} />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {domains.map((domain) => (
        <button key={domain.id} type="button" onClick={() => onOpen(domain.id)} className={catalogTileClass}>
          <ChevronRight className={cn(tileArrowClass, "group-hover:text-zinc-700")} aria-hidden="true" />
          <span className="flex items-center gap-2 text-base font-semibold text-zinc-950">
            <BookPlus
              className={cn(
                "size-4 shrink-0 text-zinc-500 transition-colors duration-300 ease-out",
                "group-hover:animate-cloud-float group-hover:text-zinc-900",
                "motion-reduce:transition-colors motion-reduce:group-hover:animate-none",
              )}
              aria-hidden="true"
            />
            {domain.title}
          </span>
          <span className="text-xs text-zinc-500">
            {t(domain.categories.length === 1 ? "hub.categoryCountOne" : "hub.categoryCountMany", {
              count: domain.categories.length,
            })}
          </span>
        </button>
      ))}
      {removed && (
        <button type="button" onClick={() => onOpenRemoved(removed.id)} className={catalogTileClass}>
          <ChevronRight className={tileArrowClass} aria-hidden="true" />
          <span className="text-base font-semibold text-zinc-950">{categoryTitle(removed, t)}</span>
          <span className="text-xs text-zinc-500">
            {t(removed.items.length === 1 ? "hub.removedItemsOne" : "hub.removedItemsMany", {
              count: removed.items.length,
            })}
          </span>
        </button>
      )}
    </div>
  );
}

const tileArrowClass =
  "absolute right-4 top-4 size-4 text-zinc-500 transition-[color,transform] duration-300 group-hover:translate-x-0.5";

const catalogTileClass =
  "group relative flex min-h-24 flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 pr-10 text-left shadow-sm transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-sky-600";

function CategoryGrid({
  categories,
  onOpen,
}: {
  categories: HubCategoryView[];
  onOpen: (id: string) => void;
}) {
  const { t } = useI18n();
  if (categories.length === 0) {
    return (
      <EmptyState title={t("hub.empty.title")} description={t("hub.empty.source")} />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onOpen(category.id)}
          className={catalogTileClass}
        >
          <ChevronRight className={tileArrowClass} aria-hidden="true" />
          <span className="text-base font-semibold text-zinc-950">{category.title}</span>
          <span className="text-xs text-zinc-500">
            {t(category.quizCount === 1 ? "hub.quizCountOne" : "hub.quizCountMany", {
              count: category.quizCount,
            })}
            {" · "}
            {t(category.noteCount === 1 ? "hub.noteCountOne" : "hub.noteCountMany", {
              count: category.noteCount,
            })}
          </span>
          <span className="flex flex-wrap gap-1.5">
            {category.downloadedCount > 0 && (
              <Badge className="border-zinc-200 bg-zinc-100 text-zinc-600">
                {t("hub.downloadedCount", { count: category.downloadedCount })}
              </Badge>
            )}
            {category.updateCount > 0 && (
              <Badge className={stateBadgeClass.updateAvailable}>
                {t(category.updateCount === 1 ? "hub.updateCountOne" : "hub.updateCountMany", {
                  count: category.updateCount,
                })}
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
  canInstall,
  query,
  selecting,
  selected,
  isWorking,
  downloadingKeys,
  onToggle,
  onStartSelecting,
  onCancelSelecting,
  onSelectAll,
  onPreview,
  onDownload,
  onKeepAsLocal,
}: {
  category: HubCategoryView;
  canInstall: boolean;
  query: string;
  selecting: boolean;
  selected: ReadonlySet<string>;
  isWorking: boolean;
  downloadingKeys: ReadonlySet<string>;
  onToggle: (item: HubItem) => void;
  onStartSelecting: () => void;
  onCancelSelecting: () => void;
  onSelectAll: (items: HubItem[]) => void;
  onPreview: (item: HubItem) => void;
  onDownload: (item: HubItem) => void;
  onKeepAsLocal: (item: HubItem) => void;
}) {
  const { t } = useI18n();
  const items = filterHubItems(category.items, query);
  const quizzes = items.filter((item) => item.kind === "quiz");
  const notes = items.filter((item) => item.kind === "note");
  const selectable = canInstall ? items.filter((item) => isDownloadable(item.state)) : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-zinc-950">{categoryTitle(category, t)}</h2>
        {selectable.length > 0 && (
          selecting ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onSelectAll(selectable)}>
                {t("hub.selectAll", { count: selectable.length })}
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelSelecting}>
                {t("common.cancel")}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={onStartSelecting}>
              {t("hub.select")}
            </Button>
          )
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">{t("hub.noMatch")}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {quizzes.length > 0 && (
            <HubItemSection
              title={t("hub.section.quizzes")}
              icon={SquareLetterQ}
              items={quizzes}
              canInstall={canInstall}
              selecting={selecting}
              selected={selected}
              isWorking={isWorking}
              downloadingKeys={downloadingKeys}
              onToggle={onToggle}
              onPreview={onPreview}
              onDownload={onDownload}
              onKeepAsLocal={onKeepAsLocal}
            />
          )}
          {notes.length > 0 && (
            <HubItemSection
              title={t("hub.section.knowledge")}
              icon={BookOpen}
              items={notes}
              canInstall={canInstall}
              selecting={selecting}
              selected={selected}
              isWorking={isWorking}
              downloadingKeys={downloadingKeys}
              onToggle={onToggle}
              onPreview={onPreview}
              onDownload={onDownload}
              onKeepAsLocal={onKeepAsLocal}
            />
          )}
        </div>
      )}
    </div>
  );
}

function HubItemSection({
  title,
  icon: Icon,
  items,
  canInstall,
  selecting,
  selected,
  isWorking,
  downloadingKeys,
  onToggle,
  onPreview,
  onDownload,
  onKeepAsLocal,
}: {
  title: string;
  icon: LucideIcon;
  items: HubItem[];
  canInstall: boolean;
  selecting: boolean;
  selected: ReadonlySet<string>;
  isWorking: boolean;
  downloadingKeys: ReadonlySet<string>;
  onToggle: (item: HubItem) => void;
  onPreview: (item: HubItem) => void;
  onDownload: (item: HubItem) => void;
  onKeepAsLocal: (item: HubItem) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        <span className="text-xs text-zinc-500">{items.length}</span>
      </header>
      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {items.map((item) => {
          const key = hubItemKey(item);
          const canSelect = selecting && canInstall && isDownloadable(item.state);
          const meta = [
            item.size > 0 ? formatBytes(item.size) : null,
            item.updated ? t("hub.updated", { date: formatShortDate(item.updated) }) : null,
            item.tags.length > 0 ? item.tags.join(", ") : null,
          ].filter(Boolean);

          const showStateBadge = item.state !== "available" && item.state !== "installed";
          const showInstalledMark = !selecting && item.state === "installed";

          return (
            <li key={key} className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50">
              {selecting ? (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selected.has(key)}
                  aria-label={t("hub.selectItem", { title: item.title })}
                  disabled={!canSelect}
                  onClick={() => onToggle(item)}
                  className="disabled:cursor-default"
                >
                  {canSelect ? (
                    <Checkbox checked={selected.has(key)} />
                  ) : (
                    <span
                      className="flex size-5 items-center justify-center text-emerald-600"
                      title={item.state === "installed" ? t(hubStateDescriptionKey.installed) : undefined}
                      aria-label={item.state === "installed" ? t("hub.state.installed") : undefined}
                    >
                      {item.state === "installed" && <Check className="size-4" />}
                    </span>
                  )}
                </button>
              ) : showInstalledMark ? (
                <span
                  className="flex size-5 items-center justify-center text-emerald-600"
                  title={t(hubStateDescriptionKey.installed)}
                  aria-label={t("hub.state.installed")}
                >
                  <Check className="size-4" />
                </span>
              ) : null}
              <button
                type="button"
                className="min-w-0 flex-1 cursor-pointer rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                aria-label={t("hub.previewItem", { title: item.title })}
                onClick={() => onPreview(item)}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-zinc-950">{item.title}</span>
                  {showStateBadge && (
                    <Badge
                      className={cn("px-2 py-0 text-[11px]", stateBadgeClass[item.state])}
                      title={t(hubStateDescriptionKey[item.state])}
                    >
                      {t(hubStateLabelKey[item.state])}
                    </Badge>
                  )}
                </div>
                {meta.length > 0 && (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{meta.join(" · ")}</p>
                )}
              </button>
              {canInstall && (
                <ItemActions
                  item={item}
                  disabled={isWorking}
                  isDownloading={downloadingKeys.has(key)}
                  onDownload={onDownload}
                  onKeepAsLocal={onKeepAsLocal}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ItemActions({
  item,
  disabled,
  isDownloading,
  onDownload,
  onKeepAsLocal,
}: {
  item: HubItem;
  disabled: boolean;
  isDownloading: boolean;
  onDownload: (item: HubItem) => void;
  onKeepAsLocal: (item: HubItem) => void;
}) {
  const { t } = useI18n();
  const downloadIcon = isDownloading ? (
    <Spinner className="size-3.5" />
  ) : (
    <Download className="size-3.5" />
  );

  if (item.state === "removedRemotely") {
    return <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onKeepAsLocal(item)}>{t("hub.keepAsLocal")}</Button>;
  }
  if (item.state === "installed") return null;

  const label = item.state === "updateAvailable" ? t("hub.update") : t("hub.download");
  return (
    <Button
      size="sm"
      className="min-w-9 justify-center sm:min-w-28"
      variant={item.state === "updateAvailable" ? "default" : "outline"}
      aria-label={t(item.state === "updateAvailable" ? "hub.updateItem" : "hub.downloadItem", {
        title: item.title,
      })}
      title={label}
      disabled={disabled}
      onClick={() => onDownload(item)}
    >
      {downloadIcon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
