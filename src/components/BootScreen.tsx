// ============================================================================
// Webuntu — Boot Screen (Ubuntu-style boot animation)
// ============================================================================
import { createSignal, onMount, type Component } from 'solid-js';
import { cloudStore } from '../stores/cloud';

interface BootScreenProps {
  onFinished: () => void;
}

export const BootScreen: Component<BootScreenProps> = (props) => {
  const [progress, setProgress] = createSignal(0);
  const [fadingOut, setFadingOut] = createSignal(false);
  const [status, setStatus] = createSignal('Initializing hardware...');
  const [isConnecting] = cloudStore.isConnecting;
  const [error] = cloudStore.error;

  onMount(() => {
    // Simulate initial hardware boot
    setTimeout(() => {
      setProgress(30);
      setStatus('Starting Cloud Orchestrator connection...');
      
      // Connect to Go backend
      cloudStore.connectToCloud().then(() => {
        if (error()) {
          setStatus(`Boot failed: ${error()}`);
        } else {
          setProgress(70);
          setStatus('Cloud VM provisioned successfully...');
          
          setTimeout(() => {
            setProgress(100);
            setStatus('Welcome to Webuntu.');
            setTimeout(() => {
              setFadingOut(true);
              setTimeout(() => props.onFinished(), 600);
            }, 500);
          }, 400);
        }
      });
    }, 500);
  });

  return (
    <div class={`boot-screen ${fadingOut() ? 'fade-out' : ''}`}>
      <div class="boot-content">
        <div class="boot-logo">
          <div class="ubuntu-circle">
            <span class="ubuntu-text">W</span>
          </div>
          <h1 class="boot-title">Webuntu</h1>
          <div class="boot-version">24.04 LTS (Cloud VM)</div>
        </div>
        
        {isConnecting() ? (
          <div class="boot-spinner">
            <div class="spinner-dot" style="--i: 1"></div>
            <div class="spinner-dot" style="--i: 2"></div>
            <div class="spinner-dot" style="--i: 3"></div>
            <div class="spinner-dot" style="--i: 4"></div>
            <div class="spinner-dot" style="--i: 5"></div>
          </div>
        ) : (
          <div class="boot-progress-container">
            <div class="boot-progress-bar" style={{ width: `${progress()}%` }}></div>
          </div>
        )}
        <div class="boot-status" style={{ color: error() ? '#ff5f57' : 'inherit' }}>{status()}</div>
      </div>
    </div>
  );
};
