let toggleSidebarHandler: (() => void) | null = null;

export function registerSidebarToggle(handler: () => void) {
  toggleSidebarHandler = handler;
  return () => {
    if (toggleSidebarHandler === handler) {
      toggleSidebarHandler = null;
    }
  };
}

export function toggleSidebarFromShortcut() {
  toggleSidebarHandler?.();
}
