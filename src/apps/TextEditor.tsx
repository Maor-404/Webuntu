// ============================================================================
// Webuntu — Text Editor (gedit-style)
// ============================================================================
import { createSignal, For, Show, type Component } from 'solid-js';
import { vfs } from '../core/vfs';
import { desktopStore } from '../stores/desktop';

interface TextEditorProps { windowId: string; }

export const TextEditor: Component<TextEditorProps> = (props) => {
  const [content, setContent] = createSignal('');
  const [filePath, setFilePath] = createSignal('');
  const [modified, setModified] = createSignal(false);
  const [showOpenDialog, setShowOpenDialog] = createSignal(true);
  const [browsePath, setBrowsePath] = createSignal('/home/user');
  const [lineCount, setLineCount] = createSignal(1);
  const [cursorLine, setCursorLine] = createSignal(1);
  const { updateWindowTitle } = desktopStore;

  const browseEntries = () => {
    try {
      return vfs.readdirStat(browsePath()).filter(n => n.type === 'file' || n.type === 'directory');
    } catch { return []; }
  };

  function openFile(path: string) {
    if (vfs.isDirectory(path)) {
      setBrowsePath(path);
      return;
    }
    try {
      const text = vfs.readFile(path);
      setContent(text);
      setFilePath(path);
      setModified(false);
      setShowOpenDialog(false);
      setLineCount(text.split('\n').length);
      const name = path.split('/').pop() || 'Untitled';
      updateWindowTitle(props.windowId, `Text Editor — ${name}`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  }

  function saveFile() {
    if (!filePath()) {
      const name = prompt('Save as (full path):', '/home/user/Documents/untitled.txt');
      if (!name) return;
      setFilePath(name);
    }
    try {
      vfs.writeFile(filePath(), content());
      setModified(false);
      const name = filePath().split('/').pop() || 'Untitled';
      updateWindowTitle(props.windowId, `Text Editor — ${name}`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  }

  function newFile() {
    setContent('');
    setFilePath('');
    setModified(false);
    setShowOpenDialog(false);
    updateWindowTitle(props.windowId, 'Text Editor — Untitled');
  }

  function handleInput(e: InputEvent) {
    const textarea = e.currentTarget as HTMLTextAreaElement;
    setContent(textarea.value);
    setModified(true);
    setLineCount(textarea.value.split('\n').length);
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveFile();
    }
    // Tab inserts spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newVal = content().substring(0, start) + '    ' + content().substring(end);
      setContent(newVal);
      // Restore cursor
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  }

  function handleCursorChange(e: Event) {
    const textarea = e.currentTarget as HTMLTextAreaElement;
    const text = textarea.value.substring(0, textarea.selectionStart);
    setCursorLine(text.split('\n').length);
  }

  return (
    <div class="text-editor">
      <Show when={showOpenDialog()} fallback={
        <>
          {/* Editor toolbar */}
          <div class="te-toolbar">
            <button class="te-btn" onClick={newFile}>📄 New</button>
            <button class="te-btn" onClick={() => setShowOpenDialog(true)}>📂 Open</button>
            <button class="te-btn" onClick={saveFile}>💾 Save</button>
            <div class="te-toolbar-spacer"></div>
            <Show when={filePath()}>
              <span class="te-filepath">{filePath()}{modified() ? ' •' : ''}</span>
            </Show>
          </div>

          {/* Editor area */}
          <div class="te-editor-container">
            <div class="te-line-numbers">
              <For each={Array.from({ length: lineCount() }, (_, i) => i + 1)}>
                {(num) => (
                  <span class={`te-line-num ${num === cursorLine() ? 'active' : ''}`}>{num}</span>
                )}
              </For>
            </div>
            <textarea
              class="te-textarea"
              value={content()}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onClick={handleCursorChange}
              onKeyUp={handleCursorChange}
              spellcheck={false}
              placeholder="Start typing..."
            />
          </div>

          {/* Status bar */}
          <div class="te-statusbar">
            <span>Ln {cursorLine()}, Col 1</span>
            <span>{lineCount()} lines</span>
            <span>UTF-8</span>
            <span>Plain Text</span>
          </div>
        </>
      }>
        {/* Open file dialog */}
        <div class="te-open-dialog">
          <div class="te-dialog-header">
            <h3>Open File</h3>
            <button class="te-btn" onClick={newFile}>New Empty File</button>
          </div>
          <div class="te-dialog-path">
            <button class="te-btn" onClick={() => {
              const parent = browsePath().substring(0, browsePath().lastIndexOf('/')) || '/';
              setBrowsePath(parent);
            }}>⬆️ Up</button>
            <span class="te-dialog-cwd">{browsePath()}</span>
          </div>
          <div class="te-dialog-list">
            <For each={browseEntries()}>
              {(node) => (
                <button
                  class="te-dialog-item"
                  onClick={() => {
                    const path = browsePath() === '/' ? `/${node.name}` : `${browsePath()}/${node.name}`;
                    openFile(path);
                  }}
                >
                  <span>{node.type === 'directory' ? '📁' : '📄'}</span>
                  <span>{node.name}</span>
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
};
