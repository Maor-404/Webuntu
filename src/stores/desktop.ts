// ============================================================================
// Webuntu — Desktop Store (SolidJS signals for window management)
// ============================================================================
import { createSignal, createRoot } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import type { WindowInfo, AppDefinition } from '../types';

export const APP_REGISTRY: AppDefinition[] = [
  { id: 'cloud_desktop', name: 'Cloud Desktop', icon: '☁️', category: 'system', component: 'CloudDesktop', defaultWidth: 1024, defaultHeight: 768, minWidth: 800, minHeight: 600 },
  { id: 'terminal', name: 'Terminal', icon: '🖥️', category: 'system', component: 'Terminal', defaultWidth: 750, defaultHeight: 480, minWidth: 400, minHeight: 250 },
  { id: 'files', name: 'Files', icon: '📁', category: 'system', component: 'FileManager', defaultWidth: 800, defaultHeight: 520, minWidth: 450, minHeight: 300 },
  { id: 'editor', name: 'Text Editor', icon: '📝', category: 'accessories', component: 'TextEditor', defaultWidth: 720, defaultHeight: 500, minWidth: 400, minHeight: 300 },
  { id: 'calculator', name: 'Calculator', icon: '🔢', category: 'accessories', component: 'Calculator', defaultWidth: 320, defaultHeight: 480, minWidth: 280, minHeight: 400 },
  { id: 'settings', name: 'Settings', icon: '⚙️', category: 'system', component: 'Settings', defaultWidth: 700, defaultHeight: 500, minWidth: 500, minHeight: 400 },
  { id: 'monitor', name: 'System Monitor', icon: '📊', category: 'system', component: 'SystemMonitor', defaultWidth: 650, defaultHeight: 450, minWidth: 400, minHeight: 300 },
];

function createDesktopStore() {
  const [windows, setWindows] = createStore<WindowInfo[]>([]);
  const [nextZ, setNextZ] = createSignal(100);
  const [showAppMenu, setShowAppMenu] = createSignal(false);
  const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number; items: { label: string; action: () => void }[] } | null>(null);
  const [booted, setBooted] = createSignal(false);

  let windowCounter = 0;

  function openWindow(appId: string, filePath?: string): string {
    const app = APP_REGISTRY.find(a => a.id === appId);
    if (!app) return '';

    const id = `win-${++windowCounter}`;
    const z = nextZ();
    setNextZ(z + 1);

    // Stagger new windows
    const offset = (windowCounter % 8) * 30;

    const win: WindowInfo = {
      id,
      appId: app.id,
      title: filePath ? `${app.name} — ${filePath.split('/').pop()}` : app.name,
      icon: app.icon,
      x: 120 + offset,
      y: 60 + offset,
      width: app.defaultWidth,
      height: app.defaultHeight,
      minWidth: app.minWidth,
      minHeight: app.minHeight,
      zIndex: z,
      minimized: false,
      maximized: false,
      focused: true,
    };

    // Unfocus all others
    setWindows(produce(ws => {
      ws.forEach(w => w.focused = false);
    }));
    setWindows(produce(ws => { ws.push(win); }));
    setShowAppMenu(false);
    return id;
  }

  function closeWindow(id: string) {
    setWindows(ws => ws.filter(w => w.id !== id));
  }

  function focusWindow(id: string) {
    const z = nextZ();
    setNextZ(z + 1);
    setWindows(produce(ws => {
      ws.forEach(w => {
        w.focused = w.id === id;
        if (w.id === id) {
          w.zIndex = z;
          w.minimized = false;
        }
      });
    }));
  }

  function minimizeWindow(id: string) {
    setWindows(produce(ws => {
      const w = ws.find(w => w.id === id);
      if (w) { w.minimized = true; w.focused = false; }
    }));
  }

  function toggleMaximize(id: string) {
    setWindows(produce(ws => {
      const w = ws.find(w => w.id === id);
      if (w) w.maximized = !w.maximized;
    }));
  }

  function updateWindowPos(id: string, x: number, y: number) {
    setWindows(produce(ws => {
      const w = ws.find(w => w.id === id);
      if (w) { w.x = x; w.y = y; }
    }));
  }

  function updateWindowSize(id: string, width: number, height: number) {
    setWindows(produce(ws => {
      const w = ws.find(w => w.id === id);
      if (w) { w.width = width; w.height = height; }
    }));
  }

  function updateWindowTitle(id: string, title: string) {
    setWindows(produce(ws => {
      const w = ws.find(w => w.id === id);
      if (w) w.title = title;
    }));
  }

  return {
    windows, openWindow, closeWindow, focusWindow,
    minimizeWindow, toggleMaximize,
    updateWindowPos, updateWindowSize, updateWindowTitle,
    showAppMenu, setShowAppMenu,
    contextMenu, setContextMenu,
    booted, setBooted,
  };
}

export const desktopStore = createRoot(createDesktopStore);
