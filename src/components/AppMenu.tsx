// ============================================================================
// Webuntu — App Menu (GNOME Activities overlay)
// ============================================================================
import { type Component, For, createSignal, Show } from 'solid-js';
import { desktopStore, APP_REGISTRY } from '../stores/desktop';

export const AppMenu: Component = () => {
  const { showAppMenu, setShowAppMenu, openWindow, windows, focusWindow } = desktopStore;
  const [search, setSearch] = createSignal('');

  const filteredApps = () => {
    const q = search().toLowerCase();
    if (!q) return APP_REGISTRY;
    return APP_REGISTRY.filter(a => a.name.toLowerCase().includes(q) || a.category.includes(q));
  };

  function launchApp(id: string) {
    openWindow(id);
    setSearch('');
  }

  return (
    <Show when={showAppMenu()}>
      <div class="app-menu-overlay" onClick={() => { setShowAppMenu(false); setSearch(''); }} id="app-menu">
        <div class="app-menu-content" onClick={(e) => e.stopPropagation()}>
          {/* Search */}
          <div class="app-menu-search">
            <input
              type="text"
              placeholder="Type to search..."
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
              autofocus
              id="app-search"
              class="app-search-input"
            />
          </div>

          {/* Open windows */}
          <Show when={windows.length > 0 && !search()}>
            <div class="app-menu-section">
              <h3 class="app-menu-section-title">Open Windows</h3>
              <div class="app-menu-windows">
                <For each={windows.filter(w => !w.minimized)}>
                  {(w) => (
                    <button class="app-menu-window-preview" onClick={() => { focusWindow(w.id); setShowAppMenu(false); }}>
                      <span class="preview-icon">{w.icon}</span>
                      <span class="preview-title">{w.title}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* App grid */}
          <div class="app-menu-section">
            <h3 class="app-menu-section-title">{search() ? 'Search Results' : 'Applications'}</h3>
            <div class="app-menu-grid">
              <For each={filteredApps()}>
                {(app) => (
                  <button class="app-menu-item" onClick={() => launchApp(app.id)} id={`launch-${app.id}`}>
                    <span class="app-menu-icon">{app.icon}</span>
                    <span class="app-menu-name">{app.name}</span>
                  </button>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};
