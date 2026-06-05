import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function QuizFeedback({
  isCorrect,
  explanation,
}: {
  isCorrect: boolean;
  explanation?: string;
}) {
  return (
    <Alert className="mt-8" variant={isCorrect ? "success" : "destructive"}>
      <AlertTitle>{isCorrect ? "Correct" : "Incorrect"}</AlertTitle>
      <AlertDescription>
        {explanation ?? (isCorrect ? "That is the correct answer." : "Review the correct answer highlighted above.")}
      </AlertDescription>
    </Alert>
  );
}
