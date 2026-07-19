// ============================================================================
// Webuntu — System Monitor
// ============================================================================
import { createSignal, onMount, onCleanup, type Component, For } from 'solid-js';

interface SystemMonitorProps { windowId: string; }

export const SystemMonitor: Component<SystemMonitorProps> = () => {
  const [cpuHistory, setCpuHistory] = createSignal<number[]>(Array(60).fill(0));
  const [memHistory, setMemHistory] = createSignal<number[]>(Array(60).fill(0));
  const [activeTab, setActiveTab] = createSignal<'resources' | 'processes'>('resources');

  const processes = [
    { pid: 1, name: 'systemd', user: 'root', cpu: 0.0, mem: 0.1, status: 'sleeping' },
    { pid: 2, name: 'webuntu-desktop', user: 'user', cpu: 2.1, mem: 3.4, status: 'running' },
    { pid: 3, name: 'webuntu-wm', user: 'user', cpu: 1.2, mem: 1.8, status: 'running' },
    { pid: 4, name: 'bash', user: 'user', cpu: 0.0, mem: 0.5, status: 'sleeping' },
    { pid: 5, name: 'dbus-daemon', user: 'user', cpu: 0.0, mem: 0.2, status: 'sleeping' },
    { pid: 6, name: 'pulseaudio', user: 'user', cpu: 0.1, mem: 0.8, status: 'sleeping' },
    { pid: 7, name: 'gnome-shell', user: 'user', cpu: 1.5, mem: 4.2, status: 'running' },
    { pid: 8, name: 'tracker-miner', user: 'user', cpu: 0.3, mem: 1.1, status: 'sleeping' },
  ];

  onMount(() => {
    const interval = setInterval(() => {
      // Simulate CPU usage
      const newCpu = 5 + Math.random() * 15 + (Math.random() > 0.9 ? Math.random() * 30 : 0);
      setCpuHistory(prev => [...prev.slice(1), newCpu]);

      // Simulate memory usage
      const baseMem = 35 + Math.sin(Date.now() / 10000) * 5;
      setMemHistory(prev => [...prev.slice(1), baseMem + Math.random() * 3]);
    }, 1000);

    onCleanup(() => clearInterval(interval));
  });

  function renderGraph(data: number[], color: string, label: string, max: number = 100) {
    const width = 100;
    const height = 40;
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (val / max) * height;
      return `${x},${y}`;
    }).join(' ');

    const fillPoints = `0,${height} ${points} ${width},${height}`;
    const current = data[data.length - 1]?.toFixed(1) || '0';

    return (
      <div class="monitor-graph-container">
        <div class="monitor-graph-header">
          <span class="monitor-graph-label">{label}</span>
          <span class="monitor-graph-value" style={{ color }}>{current}%</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} class="monitor-graph" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color={color} stop-opacity="0.4" />
              <stop offset="100%" stop-color={color} stop-opacity="0.05" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#333" stroke-width="0.3" />
          <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#333" stroke-width="0.3" />
          <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#333" stroke-width="0.3" />
          {/* Fill */}
          <polygon points={fillPoints} fill={`url(#grad-${label})`} />
          {/* Line */}
          <polyline points={points} fill="none" stroke={color} stroke-width="0.8" />
        </svg>
      </div>
    );
  }

  return (
    <div class="system-monitor">
      <div class="monitor-tabs">
        <button class={`monitor-tab ${activeTab() === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>Resources</button>
        <button class={`monitor-tab ${activeTab() === 'processes' ? 'active' : ''}`} onClick={() => setActiveTab('processes')}>Processes</button>
      </div>

      {activeTab() === 'resources' && (
        <div class="monitor-resources">
          {renderGraph(cpuHistory(), '#E95420', 'CPU')}
          {renderGraph(memHistory(), '#3498db', 'Memory')}

          <div class="monitor-stats">
            <div class="monitor-stat">
              <span class="stat-label">CPU Threads</span>
              <span class="stat-value">{navigator.hardwareConcurrency || 4}</span>
            </div>
            <div class="monitor-stat">
              <span class="stat-label">Memory</span>
              <span class="stat-value">1.4 GiB / 4.0 GiB</span>
            </div>
            <div class="monitor-stat">
              <span class="stat-label">Swap</span>
              <span class="stat-value">0 B / 2.0 GiB</span>
            </div>
            <div class="monitor-stat">
              <span class="stat-label">Disk</span>
              <span class="stat-value">512 MiB / 10 GiB</span>
            </div>
          </div>
        </div>
      )}

      {activeTab() === 'processes' && (
        <div class="monitor-processes">
          <div class="process-header">
            <span class="proc-pid">PID</span>
            <span class="proc-name">Process Name</span>
            <span class="proc-user">User</span>
            <span class="proc-cpu">CPU %</span>
            <span class="proc-mem">Mem %</span>
            <span class="proc-status">Status</span>
          </div>
          <For each={processes}>
            {(proc) => (
              <div class="process-row">
                <span class="proc-pid">{proc.pid}</span>
                <span class="proc-name">{proc.name}</span>
                <span class="proc-user">{proc.user}</span>
                <span class="proc-cpu">{proc.cpu.toFixed(1)}</span>
                <span class="proc-mem">{proc.mem.toFixed(1)}</span>
                <span class={`proc-status status-${proc.status}`}>{proc.status}</span>
              </div>
            )}
          </For>
        </div>
      )}
    </div>
  );
};
