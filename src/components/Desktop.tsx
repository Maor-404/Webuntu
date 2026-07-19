// ============================================================================
// Webuntu — Desktop (main desktop surface with wallpaper and context menu)
// ============================================================================
import { type Component, For, Show, createSignal } from 'solid-js';
import { desktopStore } from '../stores/desktop';
import { TopBar } from './TopBar';
import { Dock } from './Dock';
import { AppMenu } from './AppMenu';
import { Window } from './Window';
import { Terminal } from '../apps/Terminal';
import { FileManager } from '../apps/FileManager';
import { TextEditor } from '../apps/TextEditor';
import { Calculator } from '../apps/Calculator';
import { Settings } from '../apps/Settings';
import { SystemMonitor } from '../apps/SystemMonitor';
import { CloudDesktop } from '../apps/CloudDesktop';

const appComponents: Record<string, Component<{ windowId: string }>> = {
  Terminal, FileManager, TextEditor, Calculator, Settings, SystemMonitor, CloudDesktop
};

export const Desktop: Component = () => {
  const { windows, openWindow, setContextMenu, contextMenu, setShowAppMenu } = desktopStore;

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: '☁️ Open Cloud Desktop', action: () => openWindow('cloud_desktop') },
        { label: '📁 Open File Manager', action: () => openWindow('files') },
        { label: '🖥️ Open Terminal', action: () => openWindow('terminal') },
        { label: '📝 Open Text Editor', action: () => openWindow('editor') },
        { label: '⚙️ Settings', action: () => openWindow('settings') },
        { label: '🔄 Refresh Desktop', action: () => window.location.reload() },
      ],
    });
  }

  function handleDesktopClick() {
    setContextMenu(null);
    setShowAppMenu(false);
  }

  return (
    <div class="desktop" id="desktop" onContextMenu={handleContextMenu} onClick={handleDesktopClick}>
      {/* Wallpaper (CSS gradient) */}
      <div class="wallpaper"></div>

      <TopBar />
      <Dock />
      <AppMenu />

      {/* Windows */}
      <div class="windows-container">
        <For each={windows}>
          {(win) => {
            const AppComp = appComponents[
              win.appId === 'cloud_desktop' ? 'CloudDesktop' :
              win.appId === 'terminal' ? 'Terminal' :
              win.appId === 'files' ? 'FileManager' :
              win.appId === 'editor' ? 'TextEditor' :
              win.appId === 'calculator' ? 'Calculator' :
              win.appId === 'settings' ? 'Settings' :
              win.appId === 'monitor' ? 'SystemMonitor' : 'Terminal'
            ];
            return (
              <Window win={win}>
                <AppComp windowId={win.id} />
              </Window>
            );
          }}
        </For>
      </div>

      {/* Context Menu */}
      <Show when={contextMenu()}>
        {(menu) => (
          <div class="context-menu" style={{ left: `${menu().x}px`, top: `${menu().y}px` }}>
            <For each={menu().items}>
              {(item) => (
                <button class="context-menu-item" onClick={() => { item.action(); setContextMenu(null); }}>
                  {item.label}
                </button>
              )}
            </For>
          </div>
        )}
      </Show>
    </div>
  );
};
