import { Input } from "@/components/ui/input";
import type { GoalDetailsFormValues } from "@/types/goal";

export function GoalDetailsFields({
  idPrefix,
  values,
  onChange,
}: {
  idPrefix: string;
  values: GoalDetailsFormValues;
  onChange: (field: keyof GoalDetailsFormValues, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label
          className="mb-1.5 block text-xs font-medium text-zinc-700"
          htmlFor={`${idPrefix}-description`}
        >
          Description <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <Input
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="e.g. Score at least 80% without hints"
          className="sm:max-w-md"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label
            className="mb-1.5 block text-xs font-medium text-zinc-700"
            htmlFor={`${idPrefix}-score`}
          >
            Target score (%)
          </label>
          <Input
            id={`${idPrefix}-score`}
            type="number"
            min={0}
            max={100}
            value={values.targetScore}
            onChange={(e) => onChange("targetScore", e.target.value)}
            placeholder="e.g. 80"
            className="w-32"
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-xs font-medium text-zinc-700"
            htmlFor={`${idPrefix}-deadline`}
          >
            Deadline
          </label>
          <Input
            id={`${idPrefix}-deadline`}
            type="date"
            value={values.deadline}
            onChange={(e) => onChange("deadline", e.target.value)}
            className="w-40"
          />
        </div>
      </div>
    </div>
  );
}
