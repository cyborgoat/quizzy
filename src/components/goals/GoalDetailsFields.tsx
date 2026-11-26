import { Input } from "@/components/ui/input";
import type { GoalDetailsFormValues } from "@/types/goal";
import { useI18n } from "@/lib/i18n";

export function GoalDetailsFields({
  idPrefix,
  values,
  onChange,
  disabled = false,
}: {
  idPrefix: string;
  values: GoalDetailsFormValues;
  onChange: (field: keyof GoalDetailsFormValues, value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <div>
        <label
          className="mb-1.5 block text-xs font-medium text-zinc-700"
          htmlFor={`${idPrefix}-score`}
        >
          {t("goals.field.targetScore")}
        </label>
        <Input
          id={`${idPrefix}-score`}
          type="number"
          min={0}
          max={100}
          value={values.targetScore}
          onChange={(e) => onChange("targetScore", e.target.value)}
          placeholder={t("goals.field.targetPlaceholder")}
          className="w-32"
          disabled={disabled}
        />
      </div>

      <div>
        <label
          className="mb-1.5 block text-xs font-medium text-zinc-700"
          htmlFor={`${idPrefix}-description`}
        >
          {t("goals.field.description")} <span className="font-normal text-zinc-400">{t("goals.field.optional")}</span>
        </label>
        <Input
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder={t("goals.field.descriptionPlaceholder")}
          className="sm:max-w-md"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
