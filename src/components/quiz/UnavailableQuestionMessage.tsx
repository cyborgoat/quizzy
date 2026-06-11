import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function UnavailableQuestionCard({ prompt }: { prompt?: string }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      {prompt ? <p className="text-sm font-semibold text-zinc-950">{prompt}</p> : null}
      <p className={prompt ? "mt-3 text-sm text-zinc-600" : "text-sm text-zinc-600"}>
        This question could not be loaded from the quiz file. It may have been removed or the quiz
        file is unavailable.
      </p>
    </article>
  );
}

export function UnavailableQuestionAlert() {
  return (
    <Alert>
      <AlertTitle>Question unavailable</AlertTitle>
      <AlertDescription>
        This question could not be loaded. The quiz or question may have been removed or is
        unavailable in your working directory.
      </AlertDescription>
    </Alert>
  );
}
