import { Keyboard } from "lucide-react";
import { HotkeyRecorder } from "@/components/settings/HotkeyRecorder";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSettingRow } from "@/components/settings/SettingsSettingRow";
import type { SettingsDraft, SettingsDraftErrors } from "@/lib/settingsDraft";

export function SettingsShortcutsSection({
  draft,
  errors,
  onKnowledgeLinkShortcutChange,
  onKnowledgeNewNoteShortcutChange,
  onZoomInShortcutChange,
  onZoomOutShortcutChange,
  onToggleSidebarShortcutChange,
}: {
  draft: SettingsDraft;
  errors: SettingsDraftErrors;
  onKnowledgeLinkShortcutChange: (value: string) => void;
  onKnowledgeNewNoteShortcutChange: (value: string) => void;
  onZoomInShortcutChange: (value: string) => void;
  onZoomOutShortcutChange: (value: string) => void;
  onToggleSidebarShortcutChange: (value: string) => void;
}) {
  return (
    <SettingsSection icon={Keyboard} title="Shortcuts">
      <SettingsSettingRow
        label="Link knowledge note"
        description="Opens the link search from the references panel."
        error={errors.knowledgeLinkShortcut}
      >
        <HotkeyRecorder
          value={draft.knowledgeLinkShortcut}
          onChange={onKnowledgeLinkShortcutChange}
          aria-label="Change shortcut for Link knowledge note"
        />
      </SettingsSettingRow>

      <SettingsSettingRow
        label="New knowledge note"
        description="Creates a note linked to the current question."
        error={errors.knowledgeNewNoteShortcut}
      >
        <HotkeyRecorder
          value={draft.knowledgeNewNoteShortcut}
          onChange={onKnowledgeNewNoteShortcutChange}
          aria-label="Change shortcut for New knowledge note"
        />
      </SettingsSettingRow>

      <SettingsSettingRow
        label="Zoom in"
        description="Increases app font size in 5% steps."
        error={errors.zoomInShortcut}
      >
        <HotkeyRecorder
          value={draft.zoomInShortcut}
          onChange={onZoomInShortcutChange}
          aria-label="Change shortcut for Zoom in"
        />
      </SettingsSettingRow>

      <SettingsSettingRow
        label="Zoom out"
        description="Decreases app font size in 5% steps. Ctrl/Cmd + scroll wheel also works."
        error={errors.zoomOutShortcut}
      >
        <HotkeyRecorder
          value={draft.zoomOutShortcut}
          onChange={onZoomOutShortcutChange}
          aria-label="Change shortcut for Zoom out"
        />
      </SettingsSettingRow>

      <SettingsSettingRow
        label="Toggle question sidebar"
        description="Shows or hides the question navigator during a quiz."
        error={errors.toggleSidebarShortcut}
      >
        <HotkeyRecorder
          value={draft.toggleSidebarShortcut}
          onChange={onToggleSidebarShortcutChange}
          aria-label="Change shortcut for Toggle question sidebar"
        />
      </SettingsSettingRow>
    </SettingsSection>
  );
}
