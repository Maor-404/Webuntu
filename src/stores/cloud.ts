import { createSignal } from 'solid-js';

// Global state for our cloud orchestrator
export const cloudStore = {
  isConnected: createSignal(false),
  machineIP: createSignal<string | null>(null),
  isConnecting: createSignal(false),
  error: createSignal<string | null>(null),

  async connectToCloud() {
    this.isConnecting[1](true);
    this.error[1](null);

    try {
      // Hit our Go backend running locally on port 8080 (the Fly.io orchestrator)
      const res = await fetch('/api/start');
      if (!res.ok) {
        throw new Error(`Cloud API failed: ${res.statusText}`);
      }
      const data = await res.json();
      
      // In a real Fly.io response, the data contains internal IP and Machine ID
      // For fallback/dev, the Go backend might just return a test container ID
      this.machineIP[1](data.private_ip || 'localhost'); 
      this.isConnected[1](true);
    } catch (err: any) {
      this.error[1](err.message || 'Failed to connect to cloud backend');
    } finally {
      this.isConnecting[1](false);
    }
  }
};
