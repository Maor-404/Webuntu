// ============================================================================
// Webuntu — Window Component (draggable, resizable with title bar controls)
// ============================================================================
import { createSignal, onMount, type Component, type JSX, Show } from 'solid-js';
import { desktopStore } from '../stores/desktop';
import type { WindowInfo } from '../types';

interface WindowProps {
  win: WindowInfo;
  children: JSX.Element;
}

export const Window: Component<WindowProps> = (props) => {
  const { closeWindow, focusWindow, minimizeWindow, toggleMaximize, updateWindowPos, updateWindowSize } = desktopStore;
  let windowRef: HTMLDivElement | undefined;

  const [dragging, setDragging] = createSignal(false);
  const [resizing, setResizing] = createSignal(false);
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });

  function startDrag(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.window-controls')) return;
    e.preventDefault();
    focusWindow(props.win.id);
    if (props.win.maximized) return;
    setDragging(true);
    setDragOffset({ x: e.clientX - props.win.x, y: e.clientY - props.win.y });

    const onMove = (ev: MouseEvent) => {
      if (!dragging()) return;
      const x = Math.max(0, ev.clientX - dragOffset().x);
      const y = Math.max(28, ev.clientY - dragOffset().y);
      updateWindowPos(props.win.id, x, y);
    };
    const onUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function startResize(e: MouseEvent, direction: string) {
    e.preventDefault();
    e.stopPropagation();
    focusWindow(props.win.id);
    if (props.win.maximized) return;
    setResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = props.win.width;
    const startH = props.win.height;
    const startPosX = props.win.x;
    const startPosY = props.win.y;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      let newW = startW, newH = startH, newX = startPosX, newY = startPosY;

      if (direction.includes('e')) newW = Math.max(props.win.minWidth, startW + dx);
      if (direction.includes('s')) newH = Math.max(props.win.minHeight, startH + dy);
      if (direction.includes('w')) {
        newW = Math.max(props.win.minWidth, startW - dx);
        if (newW > props.win.minWidth) newX = startPosX + dx;
      }
      if (direction.includes('n')) {
        newH = Math.max(props.win.minHeight, startH - dy);
        if (newH > props.win.minHeight) newY = startPosY + dy;
      }

      updateWindowSize(props.win.id, newW, newH);
      updateWindowPos(props.win.id, newX, newY);
    };

    const onUp = () => {
      setResizing(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function handleDoubleClick() {
    toggleMaximize(props.win.id);
  }

  const style = (): JSX.CSSProperties => {
    if (props.win.maximized) {
      return {
        position: 'absolute',
        left: '72px',
        top: '28px',
        width: 'calc(100% - 72px)',
        height: 'calc(100% - 28px)',
        'z-index': props.win.zIndex,
        'border-radius': '0',
      };
    }
    return {
      position: 'absolute',
      left: `${props.win.x}px`,
      top: `${props.win.y}px`,
      width: `${props.win.width}px`,
      height: `${props.win.height}px`,
      'z-index': props.win.zIndex,
    };
  };

  return (
    <Show when={!props.win.minimized}>
      <div
        ref={windowRef}
        class={`window ${props.win.focused ? 'focused' : ''} ${props.win.maximized ? 'maximized' : ''} ${dragging() ? 'dragging' : ''}`}
        style={style()}
        onMouseDown={() => focusWindow(props.win.id)}
        id={`window-${props.win.id}`}
      >
        {/* Title bar */}
        <div class="window-titlebar" onMouseDown={startDrag} onDblClick={handleDoubleClick}>
          <div class="window-controls">
            <button class="win-btn win-close" onClick={() => closeWindow(props.win.id)} title="Close">
              <svg viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
            </button>
            <button class="win-btn win-minimize" onClick={() => minimizeWindow(props.win.id)} title="Minimize">
              <svg viewBox="0 0 12 12"><path d="M2 6h8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
            </button>
            <button class="win-btn win-maximize" onClick={() => toggleMaximize(props.win.id)} title="Maximize">
              <svg viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
            </button>
          </div>
          <span class="window-title">{props.win.icon} {props.win.title}</span>
          <div class="window-controls-spacer"></div>
        </div>

        {/* Content */}
        <div class="window-content">
          {props.children}
        </div>

        {/* Resize handles */}
        <Show when={!props.win.maximized}>
          <div class="resize-handle resize-n" onMouseDown={(e) => startResize(e, 'n')}></div>
          <div class="resize-handle resize-s" onMouseDown={(e) => startResize(e, 's')}></div>
          <div class="resize-handle resize-e" onMouseDown={(e) => startResize(e, 'e')}></div>
          <div class="resize-handle resize-w" onMouseDown={(e) => startResize(e, 'w')}></div>
          <div class="resize-handle resize-ne" onMouseDown={(e) => startResize(e, 'ne')}></div>
          <div class="resize-handle resize-nw" onMouseDown={(e) => startResize(e, 'nw')}></div>
          <div class="resize-handle resize-se" onMouseDown={(e) => startResize(e, 'se')}></div>
          <div class="resize-handle resize-sw" onMouseDown={(e) => startResize(e, 'sw')}></div>
        </Show>
      </div>
    </Show>
  );
};
