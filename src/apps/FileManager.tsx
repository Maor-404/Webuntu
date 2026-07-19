// ============================================================================
// Webuntu — File Manager (Nautilus-style)
// ============================================================================
import { createSignal, For, Show, type Component } from 'solid-js';
import { vfs } from '../core/vfs';
import { desktopStore } from '../stores/desktop';

interface FileManagerProps { windowId: string; }

export const FileManager: Component<FileManagerProps> = (props) => {
  const [cwd, setCwd] = createSignal('/home/user');
  const [selected, setSelected] = createSignal<string | null>(null);
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [showHidden, setShowHidden] = createSignal(false);
  const { openWindow, updateWindowTitle } = desktopStore;

  const entries = () => {
    try {
      const nodes = vfs.readdirStat(cwd());
      return showHidden() ? nodes : nodes.filter(n => !n.name.startsWith('.'));
    } catch { return []; }
  };

  const breadcrumbs = () => {
    const parts = cwd().split('/').filter(Boolean);
    const crumbs = [{ name: '/', path: '/' }];
    let current = '';
    for (const p of parts) {
      current += '/' + p;
      crumbs.push({ name: p, path: current });
    }
    return crumbs;
  };

  function navigate(path: string) {
    if (vfs.isDirectory(path)) {
      setCwd(path);
      setSelected(null);
      const dirName = path.split('/').pop() || '/';
      updateWindowTitle(props.windowId, `Files — ${dirName}`);
    } else if (vfs.isFile(path)) {
      openWindow('editor');
    }
  }

  function goUp() {
    const parent = cwd().substring(0, cwd().lastIndexOf('/')) || '/';
    navigate(parent);
  }

  function getFileIcon(node: { type: string; name: string }): string {
    if (node.type === 'directory') return '📁';
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'txt': case 'md': case 'log': return '📄';
      case 'py': return '🐍';
      case 'js': case 'ts': case 'tsx': return '📜';
      case 'sh': case 'bash': return '⚡';
      case 'json': case 'yml': case 'yaml': return '📋';
      case 'html': case 'css': return '🌐';
      case 'png': case 'jpg': case 'svg': return '🖼️';
      case 'mp3': case 'wav': return '🎵';
      case 'mp4': case 'mkv': return '🎬';
      case 'zip': case 'tar': case 'gz': return '📦';
      default: return '📄';
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div class="file-manager">
      {/* Toolbar */}
      <div class="fm-toolbar">
        <button class="fm-btn" onClick={goUp} title="Go Up">⬆️</button>
        <button class="fm-btn" onClick={() => navigate('/home/user')} title="Home">🏠</button>

        <div class="fm-breadcrumbs">
          <For each={breadcrumbs()}>
            {(crumb, i) => (
              <>
                <Show when={i() > 0}><span class="crumb-sep">/</span></Show>
                <button class="crumb-btn" onClick={() => navigate(crumb.path)}>{crumb.name}</button>
              </>
            )}
          </For>
        </div>

        <div class="fm-toolbar-right">
          <button class={`fm-btn ${showHidden() ? 'active' : ''}`} onClick={() => setShowHidden(!showHidden())} title="Show Hidden">👁️</button>
          <button class={`fm-btn ${viewMode() === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid View">⊞</button>
          <button class={`fm-btn ${viewMode() === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List View">☰</button>
        </div>
      </div>

      {/* Sidebar */}
      <div class="fm-body">
        <div class="fm-sidebar">
          <button class="fm-sidebar-item" onClick={() => navigate('/home/user')}>🏠 Home</button>
          <button class="fm-sidebar-item" onClick={() => navigate('/home/user/Desktop')}>🖥️ Desktop</button>
          <button class="fm-sidebar-item" onClick={() => navigate('/home/user/Documents')}>📄 Documents</button>
          <button class="fm-sidebar-item" onClick={() => navigate('/home/user/Downloads')}>⬇️ Downloads</button>
          <button class="fm-sidebar-item" onClick={() => navigate('/home/user/Music')}>🎵 Music</button>
          <button class="fm-sidebar-item" onClick={() => navigate('/home/user/Pictures')}>🖼️ Pictures</button>
          <button class="fm-sidebar-item" onClick={() => navigate('/home/user/Videos')}>🎬 Videos</button>
          <div class="fm-sidebar-sep"></div>
          <button class="fm-sidebar-item" onClick={() => navigate('/tmp')}>📂 /tmp</button>
          <button class="fm-sidebar-item" onClick={() => navigate('/')}>💽 File System</button>
        </div>

        {/* File list / grid */}
        <div class={`fm-content ${viewMode()}`}>
          <Show when={entries().length === 0}>
            <div class="fm-empty">This folder is empty</div>
          </Show>

          <For each={entries()}>
            {(node) => {
              const fullPath = () => cwd() === '/' ? `/${node.name}` : `${cwd()}/${node.name}`;
              const isSelected = () => selected() === node.name;

              return viewMode() === 'grid' ? (
                <button
                  class={`fm-grid-item ${isSelected() ? 'selected' : ''}`}
                  onClick={() => setSelected(node.name)}
                  onDblClick={() => navigate(fullPath())}
                >
                  <span class="fm-item-icon">{getFileIcon(node)}</span>
                  <span class="fm-item-name">{node.name}</span>
                </button>
              ) : (
                <button
                  class={`fm-list-item ${isSelected() ? 'selected' : ''}`}
                  onClick={() => setSelected(node.name)}
                  onDblClick={() => navigate(fullPath())}
                >
                  <span class="fm-item-icon-sm">{getFileIcon(node)}</span>
                  <span class="fm-item-name-list">{node.name}</span>
                  <span class="fm-item-size">{formatSize(node.size)}</span>
                  <span class="fm-item-date">{formatDate(node.modified)}</span>
                  <span class="fm-item-perms">{node.permissions}</span>
                </button>
              );
            }}
          </For>
        </div>
      </div>

      {/* Status bar */}
      <div class="fm-statusbar">
        <span>{entries().length} items</span>
        <Show when={selected()}>
          <span> | Selected: {selected()}</span>
        </Show>
      </div>
    </div>
  );
};
