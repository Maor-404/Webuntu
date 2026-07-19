// ============================================================================
// Webuntu — Terminal App (xterm.js + custom shell)
// ============================================================================
import { onMount, onCleanup, type Component } from 'solid-js';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Shell } from '../core/shell';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps { windowId: string; }

export const Terminal: Component<TerminalProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let term: XTerm | undefined;
  let fitAddon: FitAddon | undefined;
  let socket: WebSocket | undefined;
  const [machineIP] = cloudStore.machineIP;

  onMount(() => {
    if (!containerRef) return;

    term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: "'Ubuntu Mono', 'Cascadia Code', 'Fira Code', monospace",
      lineHeight: 1.2,
      letterSpacing: 0,
      theme: {
        background: '#300a24',
        foreground: '#e0e0e0',
        cursor: '#e0e0e0',
        cursorAccent: '#300a24',
        selectionBackground: '#5e2750',
        selectionForeground: '#ffffff',
      },
    });

    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef);

    try { fitAddon.fit(); } catch {}

    term.writeln('\x1b[1;32mConnecting to Cloud Ubuntu Instance...\x1b[0m');

    if (machineIP()) {
      socket = new WebSocket(`ws://localhost:8080/ws/terminal?ip=${machineIP()}`);
      
      socket.onopen = () => {
        term?.writeln('\x1b[1;34mConnected to Cloud Terminal!\x1b[0m');
      };

      socket.onmessage = (event) => {
        if (event.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            term?.write(new Uint8Array(reader.result as ArrayBuffer));
          };
          reader.readAsArrayBuffer(event.data);
        } else {
          term?.write(event.data);
        }
      };

      socket.onclose = () => {
        term?.writeln('\n\x1b[1;31mConnection closed.\x1b[0m');
      };

      socket.onerror = () => {
        term?.writeln('\n\x1b[1;31mConnection error.\x1b[0m');
      };

      // Send terminal input to the backend
      term.onData((data) => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(data);
        }
      });
    } else {
      term.writeln('\x1b[1;31mError: Cloud Machine IP not available. Boot failed.\x1b[0m');
    }

    // Resize observer
    const observer = new ResizeObserver(() => {
      try { fitAddon?.fit(); } catch {}
    });
    observer.observe(containerRef);
    onCleanup(() => { 
      observer.disconnect(); 
      term?.dispose(); 
      socket?.close();
    });
  });

  return (
    <div ref={containerRef} class="terminal-container" id={`terminal-${props.windowId}`}></div>
  );
};
