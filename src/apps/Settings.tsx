// ============================================================================
// Webuntu — Settings App
// ============================================================================
import { createSignal, type Component, For } from 'solid-js';
import { settingsStore } from '../stores/settings';

interface SettingsProps { windowId: string; }

const wallpapers = [
  { id: 'default', name: 'Noble Numbat', gradient: 'linear-gradient(135deg, #2c001e 0%, #1a0a2e 30%, #16213e 60%, #0a3d62 100%)' },
  { id: 'ocean', name: 'Deep Ocean', gradient: 'linear-gradient(135deg, #0c0e30 0%, #0a1628 30%, #0d2137 60%, #0e3b5e 100%)' },
  { id: 'sunset', name: 'Sunset', gradient: 'linear-gradient(135deg, #2d1b69 0%, #6b2fa0 30%, #c0392b 70%, #e67e22 100%)' },
  { id: 'forest', name: 'Forest', gradient: 'linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 30%, #2d5a2d 60%, #1a4a1a 100%)' },
  { id: 'aurora', name: 'Aurora', gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 30%, #24243e 50%, #0b8793 80%, #360033 100%)' },
  { id: 'minimal', name: 'Minimal Dark', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
];

const accentColors = [
  { name: 'Ubuntu Orange', value: '#E95420' },
  { name: 'Teal', value: '#0097A7' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Purple', value: '#9C27B0' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Pink', value: '#E91E63' },
  { name: 'Red', value: '#F44336' },
  { name: 'Amber', value: '#FF9800' },
];

export const Settings: Component<SettingsProps> = () => {
  const { theme, updateTheme, save } = settingsStore;
  const [activeSection, setActiveSection] = createSignal('appearance');

  const sections = [
    { id: 'appearance', name: '🎨 Appearance', icon: '🎨' },
    { id: 'display', name: '🖥️ Display', icon: '🖥️' },
    { id: 'about', name: 'ℹ️ About', icon: 'ℹ️' },
  ];

  function applyAndSave(updates: Partial<typeof theme>) {
    updateTheme(updates);
    save();
  }

  return (
    <div class="settings-app">
      {/* Sidebar */}
      <div class="settings-sidebar">
        <For each={sections}>
          {(sec) => (
            <button
              class={`settings-nav-item ${activeSection() === sec.id ? 'active' : ''}`}
              onClick={() => setActiveSection(sec.id)}
            >
              {sec.name}
            </button>
          )}
        </For>
      </div>

      {/* Content */}
      <div class="settings-content">
        {activeSection() === 'appearance' && (
          <div class="settings-section">
            <h2 class="settings-title">Appearance</h2>

            <div class="settings-group">
              <h3>Wallpaper</h3>
              <div class="wallpaper-grid">
                <For each={wallpapers}>
                  {(wp) => (
                    <button
                      class={`wallpaper-preview ${theme.wallpaper === wp.id ? 'selected' : ''}`}
                      style={{ background: wp.gradient }}
                      onClick={() => applyAndSave({ wallpaper: wp.id })}
                      title={wp.name}
                    >
                      <span class="wallpaper-name">{wp.name}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>

            <div class="settings-group">
              <h3>Accent Color</h3>
              <div class="accent-grid">
                <For each={accentColors}>
                  {(color) => (
                    <button
                      class={`accent-preview ${theme.accentColor === color.value ? 'selected' : ''}`}
                      style={{ background: color.value }}
                      onClick={() => applyAndSave({ accentColor: color.value })}
                      title={color.name}
                    />
                  )}
                </For>
              </div>
            </div>

            <div class="settings-group">
              <h3>Font Size</h3>
              <div class="settings-row">
                <input
                  type="range"
                  min="11"
                  max="20"
                  value={theme.fontSize}
                  onInput={(e) => applyAndSave({ fontSize: parseInt(e.currentTarget.value) })}
                  class="settings-slider"
                />
                <span class="settings-value">{theme.fontSize}px</span>
              </div>
            </div>

            <div class="settings-group">
              <h3>Terminal Opacity</h3>
              <div class="settings-row">
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={Math.round(theme.terminalOpacity * 100)}
                  onInput={(e) => applyAndSave({ terminalOpacity: parseInt(e.currentTarget.value) / 100 })}
                  class="settings-slider"
                />
                <span class="settings-value">{Math.round(theme.terminalOpacity * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {activeSection() === 'display' && (
          <div class="settings-section">
            <h2 class="settings-title">Display</h2>
            <div class="settings-group">
              <h3>Resolution</h3>
              <p class="settings-info">{window.innerWidth} × {window.innerHeight} (Browser Window)</p>
            </div>
            <div class="settings-group">
              <h3>Refresh Rate</h3>
              <p class="settings-info">60 Hz (Browser-controlled)</p>
            </div>
          </div>
        )}

        {activeSection() === 'about' && (
          <div class="settings-section">
            <h2 class="settings-title">About</h2>
            <div class="about-logo">
              <div class="about-circle">W</div>
            </div>
            <div class="about-info">
              <div class="about-row"><span>Device Name</span><span>webuntu</span></div>
              <div class="about-row"><span>OS Name</span><span>Webuntu 24.04 LTS</span></div>
              <div class="about-row"><span>OS Type</span><span>64-bit (WebAssembly)</span></div>
              <div class="about-row"><span>Kernel</span><span>6.8.0-webuntu</span></div>
              <div class="about-row"><span>Desktop</span><span>Webuntu Desktop</span></div>
              <div class="about-row"><span>Windowing</span><span>Browser DOM</span></div>
              <div class="about-row"><span>Processor</span><span>WebAssembly Virtual CPU</span></div>
              <div class="about-row"><span>Memory</span><span>4.0 GiB (Virtual)</span></div>
              <div class="about-row"><span>Storage</span><span>10 GiB (IndexedDB/OPFS)</span></div>
              <div class="about-row"><span>Graphics</span><span>Browser Canvas/WebGL</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
