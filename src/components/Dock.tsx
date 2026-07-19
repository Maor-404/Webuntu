// ============================================================================
// Webuntu — Dock (Ubuntu left sidebar launcher)
// ============================================================================
import { type Component, For, Show } from 'solid-js';
import { desktopStore, APP_REGISTRY } from '../stores/desktop';

export const Dock: Component = () => {
  const { windows, openWindow, focusWindow, minimizeWindow } = desktopStore;

  function handleDockClick(appId: string) {
    // If app is already open, focus it. If focused, minimize it.
    const openWindows = windows.filter(w => w.appId === appId);
    if (openWindows.length > 0) {
      const focused = openWindows.find(w => w.focused && !w.minimized);
      if (focused) {
        minimizeWindow(focused.id);
      } else {
        const win = openWindows.find(w => !w.minimized) || openWindows[0];
        focusWindow(win.id);
      }
    } else {
      openWindow(appId);
    }
  }

  const dockApps = APP_REGISTRY.filter(a => ['terminal', 'files', 'editor', 'calculator', 'settings', 'monitor'].includes(a.id));

  return (
    <div class="dock" id="dock">
      <For each={dockApps}>
        {(app) => {
          const isOpen = () => windows.some(w => w.appId === app.id);
          const isFocused = () => windows.some(w => w.appId === app.id && w.focused && !w.minimized);
          return (
            <button
              class={`dock-icon ${isFocused() ? 'focused' : ''}`}
              onClick={() => handleDockClick(app.id)}
              title={app.name}
              id={`dock-${app.id}`}
            >
              <span class="dock-icon-emoji">{app.icon}</span>
              <Show when={isOpen()}>
                <span class="dock-indicator"></span>
              </Show>
            </button>
          );
        }}
      </For>

      <div class="dock-separator"></div>

      {/* Trash */}
      <button class="dock-icon" title="Trash" id="dock-trash">
        <span class="dock-icon-emoji">🗑️</span>
      </button>
    </div>
  );
};
