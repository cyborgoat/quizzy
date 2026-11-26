import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OnboardingCompleteStep } from "@/components/onboarding/OnboardingCompleteStep";
import { OnboardingDirectoryStep } from "@/components/onboarding/OnboardingDirectoryStep";
import { OnboardingLanguageStep } from "@/components/onboarding/OnboardingLanguageStep";
import { OnboardingQuizhubStep } from "@/components/onboarding/OnboardingQuizhubStep";
import { Button } from "@/components/ui/button";
import { useAppLocale } from "@/hooks/useAppLocale";
import { usePickWorkingDirectory } from "@/hooks/usePickWorkingDirectory";
import { useQuizhubPreferences } from "@/hooks/useQuizhubPreferences";
import { useWorkingDirectory } from "@/hooks/useWorkingDirectory";
import { useI18n } from "@/lib/i18n";
import type { AppLocale } from "@/lib/locale";
import { errorMessage, nativeApi } from "@/lib/native";
import { QUIZHUB_DEFAULT_BASE_URL } from "@/lib/quizhub";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 4;

function initialStep(localeConfigured: boolean, hasDirectory: boolean): number {
  if (!localeConfigured) return 1;
  if (!hasDirectory) return 2;
  return 3;
}

export function FirstLaunchWizard() {
  const { t } = useI18n();
  const {
    locale,
    localeConfigured,
    setAppLocale,
    completeOnboarding,
    settingsReady,
  } = useAppLocale();
  const { directoryPath, directoryAvailable } = useWorkingDirectory();
  const { pickWorkingDirectory, isPicking } = usePickWorkingDirectory();
  const {
    quizhubEnabled,
    setQuizhubEnabled,
    quizhubBaseUrl,
    setQuizhubBaseUrl,
  } = useQuizhubPreferences();

  const hasDirectory = Boolean(directoryPath && directoryAvailable);
  const [step, setStep] = useState(1);
  const [stepReady, setStepReady] = useState(false);
  const [savingLocale, setSavingLocale] = useState(false);
  const [savingQuizhub, setSavingQuizhub] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [draftUrl, setDraftUrl] = useState(quizhubBaseUrl || QUIZHUB_DEFAULT_BASE_URL);
  const [draftEnabled, setDraftEnabled] = useState(quizhubEnabled);

  useEffect(() => {
    if (!settingsReady || stepReady) return;
    setStep(initialStep(localeConfigured, hasDirectory));
    setDraftEnabled(quizhubEnabled);
    setDraftUrl(quizhubBaseUrl || QUIZHUB_DEFAULT_BASE_URL);
    setStepReady(true);
  }, [
    settingsReady,
    stepReady,
    localeConfigured,
    hasDirectory,
    quizhubEnabled,
    quizhubBaseUrl,
  ]);

  async function handleLocaleChange(next: AppLocale) {
    if (savingLocale) return;
    if (next === locale && localeConfigured) return;
    setSavingLocale(true);
    try {
      await setAppLocale(next);
    } finally {
      setSavingLocale(false);
    }
  }

  async function handleContinueFromLanguage() {
    setSavingLocale(true);
    try {
      await setAppLocale(locale);
      setStep(2);
    } catch {
      // toast already shown
    } finally {
      setSavingLocale(false);
    }
  }

  async function ensureLocaleSaved() {
    await setAppLocale(locale);
  }

  async function handleChooseDirectory() {
    await ensureLocaleSaved();
    await pickWorkingDirectory({ notify: false, locale });
  }

  async function handleContinueFromDirectory() {
    await ensureLocaleSaved();
    if (!hasDirectory) {
      const result = await pickWorkingDirectory({ notify: false, locale });
      if (!result) return;
    }
    setDraftEnabled(quizhubEnabled);
    setDraftUrl(quizhubBaseUrl || QUIZHUB_DEFAULT_BASE_URL);
    setStep(3);
  }

  async function handleContinueFromQuizhub() {
    setSavingQuizhub(true);
    try {
      if (draftEnabled) {
        const trimmed = draftUrl.trim();
        await nativeApi.saveSettings({
          quizhubEnabled: true,
          quizhubBaseUrl:
            !trimmed || trimmed === QUIZHUB_DEFAULT_BASE_URL ? "" : trimmed,
        });
      } else {
        await nativeApi.saveSettings({ quizhubEnabled: false });
      }
      const settings = await nativeApi.getSettings();
      setQuizhubEnabled(settings.quizhubEnabled);
      setQuizhubBaseUrl(settings.quizhubBaseUrl || QUIZHUB_DEFAULT_BASE_URL);
      setDraftEnabled(settings.quizhubEnabled);
      setDraftUrl(settings.quizhubBaseUrl || QUIZHUB_DEFAULT_BASE_URL);
      setStep(4);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingQuizhub(false);
    }
  }

  async function handleGetStarted() {
    setFinishing(true);
    try {
      await completeOnboarding();
    } catch {
      // toast already shown
    } finally {
      setFinishing(false);
    }
  }

  const busy = savingLocale || isPicking || savingQuizhub || finishing;

  if (!settingsReady || !stepReady) {
    return (
      <div className="flex min-h-[calc(100svh-(var(--app-page-py)*2))] items-center justify-center">
        <p className="text-sm text-zinc-500">{t("app.loading")}</p>
      </div>
    );
  }

  async function handleNext() {
    if (step === 1) {
      await handleContinueFromLanguage();
      return;
    }
    if (step === 2) {
      await handleContinueFromDirectory();
      return;
    }
    if (step === 3) {
      await handleContinueFromQuizhub();
      return;
    }
    await handleGetStarted();
  }

  return (
    <div className="flex min-h-[calc(100svh-(var(--app-page-py)*2))] items-center justify-center px-2">
      <div className="flex w-full max-w-xl flex-col">
        <div className="px-2 text-center">
          <img
            src="/quizzy-logo.svg"
            alt=""
            className="mx-auto mb-4 size-16 rounded-2xl"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            {t("onboarding.welcome")}
          </h1>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
            {t("onboarding.stepOf", {
              current: String(step),
              total: String(TOTAL_STEPS),
            })}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2" aria-hidden="true">
            {Array.from({ length: TOTAL_STEPS }, (_, index) => {
              const value = index + 1;
              return (
                <span
                  key={value}
                  className={cn(
                    "h-1.5 w-7 rounded-full transition-colors",
                    value <= step ? "bg-zinc-800" : "bg-zinc-200",
                  )}
                />
              );
            })}
          </div>
        </div>

        <div className="max-h-[min(22rem,45svh)] overflow-y-auto px-2 pt-8">
          {step === 1 && (
            <OnboardingLanguageStep
              locale={locale}
              disabled={busy}
              onLocaleChange={(next) => void handleLocaleChange(next)}
            />
          )}
          {step === 2 && (
            <OnboardingDirectoryStep
              directoryPath={hasDirectory ? directoryPath : null}
              isPicking={isPicking}
              onChooseDirectory={() => void handleChooseDirectory()}
            />
          )}
          {step === 3 && (
            <OnboardingQuizhubStep
              enabled={draftEnabled}
              baseUrl={draftUrl}
              saving={savingQuizhub}
              onEnabledChange={setDraftEnabled}
              onBaseUrlChange={setDraftUrl}
              onBaseUrlReset={() => setDraftUrl(QUIZHUB_DEFAULT_BASE_URL)}
            />
          )}
          {step === 4 && <OnboardingCompleteStep quizhubEnabled={draftEnabled} />}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 px-2">
          {step > 1 ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 px-1 text-zinc-700 hover:bg-transparent hover:text-zinc-950"
              disabled={busy}
              onClick={() => setStep((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="size-4" />
              {t("onboarding.previous")}
            </Button>
          ) : (
            <span />
          )}

          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-1 text-zinc-700 hover:bg-transparent hover:text-zinc-950"
            disabled={busy}
            onClick={() => void handleNext()}
          >
            {step === 4 ? t("onboarding.getStarted") : t("onboarding.next")}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
