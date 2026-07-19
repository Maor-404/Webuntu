// ============================================================================
// Webuntu — App Shell (Boot Screen → Desktop)
// ============================================================================
import { Show, type Component } from 'solid-js';
import { desktopStore } from './stores/desktop';
import { BootScreen } from './components/BootScreen';
import { Desktop } from './components/Desktop';

export const App: Component = () => {
  const { booted, setBooted } = desktopStore;

  return (
    <div class="app-root">
      <Show when={!booted()} fallback={<Desktop />}>
        <BootScreen onFinished={() => setBooted(true)} />
      </Show>
    </div>
  );
};
