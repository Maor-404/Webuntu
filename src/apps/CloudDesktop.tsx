// ============================================================================
// Webuntu — Cloud Desktop (noVNC Viewer)
// ============================================================================
import { onMount, onCleanup, type Component } from 'solid-js';
import RFB from '@novnc/novnc/core/rfb';
import { cloudStore } from '../stores/cloud';

interface CloudDesktopProps { windowId: string; }

export const CloudDesktop: Component<CloudDesktopProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let rfb: RFB | undefined;
  const [machineIP] = cloudStore.machineIP;

  onMount(() => {
    if (!containerRef || !machineIP()) return;

    // Connect to our Go backend's WebSocket proxy which routes to the Cloud VM
    // Standard websockify port for linuxserver/novnc is typically handled internally
    const wsUrl = `ws://localhost:8080/ws/proxy?ip=${machineIP()}`;

    try {
      rfb = new RFB(containerRef, wsUrl, {
        credentials: { password: '' } // No password required for default linuxserver/novnc
      });

      rfb.scaleViewport = true;
      rfb.resizeSession = true;
      rfb.showDotCursor = true;

      rfb.addEventListener('connect', () => {
        console.log('Connected to Cloud X11 Desktop');
      });

      rfb.addEventListener('disconnect', (e: CustomEvent) => {
        console.log('Disconnected from Cloud Desktop', e.detail);
      });
    } catch (err) {
      console.error('noVNC connection error:', err);
    }

    onCleanup(() => {
      if (rfb) {
        rfb.disconnect();
      }
    });
  });

  return (
    <div class="cloud-desktop-app" style="width: 100%; height: 100%; background: #000;">
      <div 
        ref={containerRef} 
        id={`novnc-${props.windowId}`} 
        style="width: 100%; height: 100%; overflow: hidden;"
      ></div>
    </div>
  );
};
