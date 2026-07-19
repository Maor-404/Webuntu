// ============================================================================
// Webuntu — Settings Store
// ============================================================================
import { createRoot } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { DesktopTheme } from '../types';

function createSettingsStore() {
  const [theme, setTheme] = createStore<DesktopTheme>({
    wallpaper: 'default',
    accentColor: '#E95420',
    darkMode: true,
    fontSize: 14,
    terminalOpacity: 0.92,
  });

  function updateTheme(updates: Partial<DesktopTheme>) {
    setTheme(prev => ({ ...prev, ...updates }));
  }

  // Load from localStorage
  try {
    const saved = localStorage.getItem('webuntu-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTheme(prev => ({ ...prev, ...parsed }));
    }
  } catch { /* ignore */ }

  function save() {
    localStorage.setItem('webuntu-settings', JSON.stringify(theme));
  }

  return { theme, updateTheme, save };
}

export const settingsStore = createRoot(createSettingsStore);
