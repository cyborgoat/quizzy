import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { SectionPanel } from "@/components/ui/section-panel";

export function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <SectionPanel icon={Icon} title={title} contentClassName="p-3">
      {children}
    </SectionPanel>
  );
}
