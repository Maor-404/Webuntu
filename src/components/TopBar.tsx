// ============================================================================
// Webuntu — Top Bar (GNOME-style panel)
// ============================================================================
import { createSignal, onMount, onCleanup, type Component, For, Show } from 'solid-js';
import { desktopStore } from '../stores/desktop';

export const TopBar: Component = () => {
  const [time, setTime] = createSignal('');
  const [dateStr, setDateStr] = createSignal('');
  const [showCalendar, setShowCalendar] = createSignal(false);
  const { setShowAppMenu, showAppMenu, windows, focusWindow } = desktopStore;

  function updateTime() {
    const now = new Date();
    setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    setDateStr(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
  }

  onMount(() => {
    updateTime();
    const interval = setInterval(updateTime, 10000);
    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="top-bar" id="topbar">
      {/* Activities Button */}
      <button
        class={`top-bar-activities ${showAppMenu() ? 'active' : ''}`}
        onClick={() => setShowAppMenu(!showAppMenu())}
        id="activities-btn"
      >
        Activities
      </button>

      {/* Active window title (center-ish) */}
      <div class="top-bar-window-title">
        <For each={windows.filter(w => w.focused && !w.minimized)}>
          {(w) => <span class="active-title">{w.icon} {w.title}</span>}
        </For>
      </div>

      {/* Right: System tray */}
      <div class="top-bar-tray">
        {/* Date/Time */}
        <button class="tray-clock" onClick={() => setShowCalendar(!showCalendar())} id="clock-btn">
          <span class="tray-date">{dateStr()}</span>
          <span class="tray-time">{time()}</span>
        </button>

        {/* System indicators */}
        <div class="tray-indicators">
          <span class="tray-icon" title="Network">📶</span>
          <span class="tray-icon" title="Volume">🔊</span>
          <span class="tray-icon" title="Battery">🔋</span>
          <button class="tray-power" title="Power" id="power-btn">⏻</button>
        </div>
      </div>

      {/* Calendar dropdown */}
      <Show when={showCalendar()}>
        <div class="calendar-dropdown">
          <div class="calendar-header">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div class="calendar-body">
            <p class="calendar-note">No events today</p>
          </div>
        </div>
      </Show>
    </div>
  );
};
