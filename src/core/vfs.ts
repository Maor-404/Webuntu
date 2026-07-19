// ============================================================================
// Webuntu — Virtual File System (ext2-like inode-based VFS)
// ============================================================================
import type { INode } from '../types';

class VirtualFileSystem {
  private inodes: Map<number, INode> = new Map();
  private nextId = 1;

  constructor() {
    this.seed();
  }

  private createINode(
    name: string,
    type: INode['type'],
    parentId: number,
    permissions = type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--',
    content = '',
    owner = 'user',
    group = 'user'
  ): INode {
    const id = this.nextId++;
    const now = Date.now();
    const node: INode = {
      id, name, type, permissions, owner, group,
      size: content.length,
      modified: now, created: now,
      content,
      children: new Map(),
      target: '',
      parent: parentId,
    };
    this.inodes.set(id, node);
    if (parentId >= 0) {
      const parent = this.inodes.get(parentId);
      if (parent) parent.children.set(name, id);
    }
    return node;
  }

  private seed(): void {
    // Root
    const root = this.createINode('/', 'directory', -1, 'drwxr-xr-x', '', 'root', 'root');

    // Top-level dirs
    const home = this.createINode('home', 'directory', root.id, 'drwxr-xr-x', '', 'root', 'root');
    const etc = this.createINode('etc', 'directory', root.id, 'drwxr-xr-x', '', 'root', 'root');
    const usr = this.createINode('usr', 'directory', root.id, 'drwxr-xr-x', '', 'root', 'root');
    const tmp = this.createINode('tmp', 'directory', root.id, 'drwxrwxrwt', '', 'root', 'root');
    const varDir = this.createINode('var', 'directory', root.id, 'drwxr-xr-x', '', 'root', 'root');
    const rootHome = this.createINode('root', 'directory', root.id, 'drwx------', '', 'root', 'root');
    const proc = this.createINode('proc', 'directory', root.id, 'dr-xr-xr-x', '', 'root', 'root');
    const dev = this.createINode('dev', 'directory', root.id, 'drwxr-xr-x', '', 'root', 'root');
    const bin = this.createINode('bin', 'directory', root.id, 'drwxr-xr-x', '', 'root', 'root');
    const sbin = this.createINode('sbin', 'directory', root.id, 'drwxr-xr-x', '', 'root', 'root');
    const opt = this.createINode('opt', 'directory', root.id, 'drwxr-xr-x', '', 'root', 'root');
    const mnt = this.createINode('mnt', 'directory', root.id, 'drwxr-xr-x', '', 'root', 'root');

    // /home/user
    const userDir = this.createINode('user', 'directory', home.id, 'drwxr-xr-x');
    const desktop = this.createINode('Desktop', 'directory', userDir.id);
    const docs = this.createINode('Documents', 'directory', userDir.id);
    const downloads = this.createINode('Downloads', 'directory', userDir.id);
    const music = this.createINode('Music', 'directory', userDir.id);
    const pictures = this.createINode('Pictures', 'directory', userDir.id);
    const videos = this.createINode('Videos', 'directory', userDir.id);

    // Create /home/user/Documents/docs for official documentation
    const officialDocs = this.createINode('docs', 'directory', docs.id);
    this.createINode('getting-started.md', 'file', officialDocs.id, '-rw-r--r--',
      '# Webuntu Documentation: Getting Started\n\n' +
      'Welcome to Webuntu! This is a client-side Ubuntu emulator running entirely in the browser.\n\n' +
      '## Keyboard Shortcuts\n' +
      '- `Ctrl + Alt + T`: Open Terminal (coming soon)\n' +
      '- `Alt + F2`: Run Command (coming soon)\n\n' +
      '## System Layout\n' +
      '- `/home/user`: User workspace\n' +
      '- `/etc`: System configurations\n' +
      '- `/proc`: System monitor and hardware stubs\n'
    );
    this.createINode('support.md', 'file', officialDocs.id, '-rw-r--r--',
      '# Webuntu Support\n\n' +
      'If you encounter bugs or want to request features:\n' +
      '1. Open an issue on our GitHub: https://github.com/user/webuntu\n' +
      '2. Check out the community wiki.\n' +
      '3. Join the community Discord (link on GitHub).\n\n' +
      'Enjoy your private, browser-sandboxed Ubuntu experience!\n'
    );
    this.createINode('doom.md', 'file', officialDocs.id, '-rw-r--r--',
      '# Can It Run DOOM?\n\n' +
      'YES! Running DOOM in Webuntu is the ultimate benchmark.\n\n' +
      '## The Plan to Run DOOM\n' +
      '1. Compile WebDOOM (or generic chocolate-doom) to WebAssembly using Emscripten.\n' +
      '2. Bundle the shareware `doom1.wad` file.\n' +
      '3. Embed a `<canvas>` element inside a custom Webuntu desktop window app.\n' +
      '4. Pass key events from browser DOM to the emulated C engine.\n\n' +
      'Stay tuned! The DOOM component is coming in the next updates.\n'
    );

    // config files
    this.createINode('.bashrc', 'file', userDir.id, '-rw-r--r--',
      '# ~/.bashrc: executed by bash for non-login shells.\n\n' +
      'export PS1="\\u@webuntu:\\w\\$ "\n' +
      'export PATH="/usr/bin:/bin:/usr/sbin:/sbin"\n' +
      'alias ll="ls -la"\n' +
      'alias la="ls -A"\n' +
      'alias l="ls -CF"\n\n' +
      '# Welcome message\n' +
      'echo "Welcome to Webuntu 24.04 LTS"\n'
    );

    this.createINode('.profile', 'file', userDir.id, '-rw-r--r--',
      '# ~/.profile: executed by the command interpreter for login shells.\n' +
      'if [ -n "$BASH_VERSION" ]; then\n' +
      '    if [ -f "$HOME/.bashrc" ]; then\n' +
      '        . "$HOME/.bashrc"\n' +
      '    fi\n' +
      'fi\n'
    );

    // Sample files
    this.createINode('readme.md', 'file', docs.id, '-rw-r--r--',
      '# Welcome to Webuntu\n\n' +
      'This is a fully functional Ubuntu desktop emulator\n' +
      'running entirely in your browser.\n\n' +
      '## Features\n' +
      '- Real terminal with 25+ commands\n' +
      '- Virtual file system with persistence\n' +
      '- Window management (drag, resize, min/max)\n' +
      '- File manager, text editor, calculator\n' +
      '- Ubuntu Yaru dark theme\n\n' +
      'Built with SolidJS, TypeScript, and xterm.js\n'
    );

    this.createINode('hello.py', 'file', docs.id, '-rw-r--r--',
      '#!/usr/bin/env python3\n\n' +
      'def main():\n' +
      '    print("Hello from Webuntu!")\n' +
      '    name = input("What is your name? ")\n' +
      '    print(f"Welcome to Webuntu, {name}!")\n\n' +
      'if __name__ == "__main__":\n' +
      '    main()\n'
    );

    this.createINode('notes.txt', 'file', desktop.id, '-rw-r--r--',
      'Webuntu Desktop Notes\n' +
      '=====================\n\n' +
      'Things to try:\n' +
      '1. Open a terminal (Ctrl+Alt+T or click the icon)\n' +
      '2. Navigate with cd, ls, pwd\n' +
      '3. Create files with touch and echo\n' +
      '4. Use pipes: ls -la | grep txt\n' +
      '5. Open the file manager\n' +
      '6. Try the text editor\n'
    );

    // /etc files
    this.createINode('hostname', 'file', etc.id, '-rw-r--r--', 'webuntu\n', 'root', 'root');
    this.createINode('os-release', 'file', etc.id, '-rw-r--r--',
      'NAME="Webuntu"\n' +
      'VERSION="24.04 LTS (Noble Numbat)"\n' +
      'ID=webuntu\n' +
      'ID_LIKE=ubuntu\n' +
      'PRETTY_NAME="Webuntu 24.04 LTS"\n' +
      'VERSION_ID="24.04"\n' +
      'HOME_URL="https://webuntu.dev"\n',
      'root', 'root'
    );
    this.createINode('passwd', 'file', etc.id, '-rw-r--r--',
      'root:x:0:0:root:/root:/bin/bash\n' +
      'user:x:1000:1000:Webuntu User:/home/user:/bin/bash\n' +
      'nobody:x:65534:65534:Nobody:/nonexistent:/usr/sbin/nologin\n',
      'root', 'root'
    );
    this.createINode('hosts', 'file', etc.id, '-rw-r--r--',
      '127.0.0.1\tlocalhost\n' +
      '127.0.1.1\twebuntu\n' +
      '::1\t\tlocalhost ip6-localhost ip6-loopback\n',
      'root', 'root'
    );

    // /usr/bin (command stubs)
    const usrBin = this.createINode('bin', 'directory', usr.id, 'drwxr-xr-x', '', 'root', 'root');
    const cmds = ['bash', 'ls', 'cd', 'pwd', 'echo', 'cat', 'grep', 'mkdir', 'rm', 'cp', 'mv', 'touch', 'chmod', 'head', 'tail', 'wc', 'date', 'whoami', 'uname', 'clear', 'env', 'export', 'history', 'ps', 'kill', 'man', 'apt', 'nano', 'find', 'sort', 'uniq', 'tr', 'xargs'];
    for (const cmd of cmds) {
      this.createINode(cmd, 'file', usrBin.id, '-rwxr-xr-x', `#!/bin/bash\n# ${cmd} built-in\n`, 'root', 'root');
    }

    // /var/log
    const log = this.createINode('log', 'directory', varDir.id, 'drwxr-xr-x', '', 'root', 'root');
    this.createINode('syslog', 'file', log.id, '-rw-r-----',
      `[${new Date().toISOString()}] Webuntu kernel: Boot complete\n` +
      `[${new Date().toISOString()}] Webuntu kernel: Virtual filesystem mounted\n` +
      `[${new Date().toISOString()}] Webuntu systemd: Reached target Multi-User System\n`,
      'root', 'root'
    );

    // /dev
    this.createINode('null', 'file', dev.id, 'crw-rw-rw-', '', 'root', 'root');
    this.createINode('zero', 'file', dev.id, 'crw-rw-rw-', '', 'root', 'root');
    this.createINode('random', 'file', dev.id, 'crw-rw-rw-', '', 'root', 'root');
    this.createINode('tty', 'file', dev.id, 'crw-rw-rw-', '', 'root', 'root');

    // /proc stubs
    this.createINode('version', 'file', proc.id, '-r--r--r--',
      'Linux version 6.8.0-webuntu (user@webuntu) (gcc version 13.2.0) #1 SMP PREEMPT_DYNAMIC Webuntu 6.8.0\n',
      'root', 'root'
    );
    this.createINode('cpuinfo', 'file', proc.id, '-r--r--r--',
      'processor\t: 0\n' +
      'vendor_id\t: WebAssembly\n' +
      'cpu family\t: wasm\n' +
      'model name\t: Webuntu Virtual CPU @ Browser\n' +
      'cpu MHz\t\t: 3000.000\n' +
      'cache size\t: 8192 KB\n' +
      'bogomips\t: 6000.00\n',
      'root', 'root'
    );
    this.createINode('meminfo', 'file', proc.id, '-r--r--r--',
      'MemTotal:        4096000 kB\n' +
      'MemFree:         2048000 kB\n' +
      'MemAvailable:    3072000 kB\n' +
      'Buffers:          256000 kB\n' +
      'Cached:           512000 kB\n' +
      'SwapTotal:       2048000 kB\n' +
      'SwapFree:        2048000 kB\n',
      'root', 'root'
    );
    this.createINode('uptime', 'file', proc.id, '-r--r--r--', '0.00 0.00\n', 'root', 'root');
  }

  // ---- Path Resolution ----

  resolvePath(path: string, cwd: string): string {
    if (!path) return cwd;
    let resolved = path.startsWith('/') ? path : `${cwd}/${path}`;
    // Handle ~ as home
    resolved = resolved.replace(/^~/, '/home/user');
    // Normalize
    const parts = resolved.split('/').filter(Boolean);
    const stack: string[] = [];
    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') { stack.pop(); continue; }
      stack.push(p);
    }
    return '/' + stack.join('/');
  }

  private getNodeByPath(path: string): INode | null {
    if (path === '/') return this.inodes.get(1) || null;
    const parts = path.split('/').filter(Boolean);
    let current = this.inodes.get(1); // root
    if (!current) return null;
    for (const part of parts) {
      const childId = current.children.get(part);
      if (childId === undefined) return null;
      current = this.inodes.get(childId);
      if (!current) return null;
      // Follow symlinks
      if (current.type === 'symlink' && current.target) {
        current = this.getNodeByPath(current.target);
        if (!current) return null;
      }
    }
    return current;
  }

  // ---- Public API ----

  exists(path: string): boolean {
    return this.getNodeByPath(path) !== null;
  }

  stat(path: string): INode | null {
    return this.getNodeByPath(path);
  }

  isDirectory(path: string): boolean {
    const n = this.getNodeByPath(path);
    return n !== null && n.type === 'directory';
  }

  isFile(path: string): boolean {
    const n = this.getNodeByPath(path);
    return n !== null && n.type === 'file';
  }

  readFile(path: string): string {
    const node = this.getNodeByPath(path);
    if (!node) throw new Error(`No such file: ${path}`);
    if (node.type === 'directory') throw new Error(`Is a directory: ${path}`);
    return node.content;
  }

  writeFile(path: string, content: string): void {
    let node = this.getNodeByPath(path);
    if (node && node.type === 'directory') throw new Error(`Is a directory: ${path}`);
    if (!node) {
      // create
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const parent = this.getNodeByPath(parentPath);
      if (!parent) throw new Error(`No such directory: ${parentPath}`);
      const name = path.substring(path.lastIndexOf('/') + 1);
      node = this.createINode(name, 'file', parent.id);
    }
    node.content = content;
    node.size = content.length;
    node.modified = Date.now();
  }

  appendFile(path: string, content: string): void {
    let existing = '';
    try { existing = this.readFile(path); } catch { /* file doesn't exist */ }
    this.writeFile(path, existing + content);
  }

  mkdir(path: string, recursive = false): void {
    if (this.exists(path)) return;
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    if (!this.exists(parentPath)) {
      if (recursive) this.mkdir(parentPath, true);
      else throw new Error(`No such directory: ${parentPath}`);
    }
    const parent = this.getNodeByPath(parentPath)!;
    const name = path.substring(path.lastIndexOf('/') + 1);
    this.createINode(name, 'directory', parent.id);
  }

  readdir(path: string): string[] {
    const node = this.getNodeByPath(path);
    if (!node) throw new Error(`No such directory: ${path}`);
    if (node.type !== 'directory') throw new Error(`Not a directory: ${path}`);
    return Array.from(node.children.keys()).sort();
  }

  readdirStat(path: string): INode[] {
    const node = this.getNodeByPath(path);
    if (!node || node.type !== 'directory') return [];
    return Array.from(node.children.values())
      .map(id => this.inodes.get(id)!)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  rm(path: string, recursive = false): void {
    const node = this.getNodeByPath(path);
    if (!node) throw new Error(`No such file or directory: ${path}`);
    if (node.type === 'directory' && !recursive) {
      if (node.children.size > 0) throw new Error(`Directory not empty: ${path}`);
    }
    // Remove children recursively
    if (node.type === 'directory' && recursive) {
      for (const [, childId] of node.children) {
        const child = this.inodes.get(childId);
        if (child) {
          const childPath = path === '/' ? `/${child.name}` : `${path}/${child.name}`;
          this.rm(childPath, true);
        }
      }
    }
    // Remove from parent
    const parent = this.inodes.get(node.parent);
    if (parent) parent.children.delete(node.name);
    this.inodes.delete(node.id);
  }

  cp(src: string, dst: string, recursive = false): void {
    const srcNode = this.getNodeByPath(src);
    if (!srcNode) throw new Error(`No such file: ${src}`);
    if (srcNode.type === 'directory' && !recursive) {
      throw new Error(`cp: -r not specified; omitting directory '${src}'`);
    }
    if (srcNode.type === 'file') {
      this.writeFile(dst, srcNode.content);
    } else {
      this.mkdir(dst, true);
      for (const [childName, childId] of srcNode.children) {
        const child = this.inodes.get(childId);
        if (child) {
          const childSrc = `${src}/${childName}`;
          const childDst = `${dst}/${childName}`;
          this.cp(childSrc, childDst, true);
        }
      }
    }
  }

  mv(src: string, dst: string): void {
    this.cp(src, dst, true);
    this.rm(src, true);
  }

  chmod(path: string, mode: string): void {
    const node = this.getNodeByPath(path);
    if (!node) throw new Error(`No such file: ${path}`);
    // Simple mapping of numeric modes
    const prefix = node.type === 'directory' ? 'd' : '-';
    const modeMap: Record<string, string> = {
      '7': 'rwx', '6': 'rw-', '5': 'r-x', '4': 'r--',
      '3': '-wx', '2': '-w-', '1': '--x', '0': '---',
    };
    if (/^\d{3}$/.test(mode)) {
      node.permissions = prefix + mode.split('').map(d => modeMap[d] || '---').join('');
    } else {
      // Symbolic mode (+x, -w, etc.) — simplified
      if (mode === '+x') {
        node.permissions = node.permissions.substring(0, 3) + 'x' + node.permissions.substring(4);
      }
    }
    node.modified = Date.now();
  }

  touch(path: string): void {
    if (this.exists(path)) {
      const node = this.getNodeByPath(path)!;
      node.modified = Date.now();
    } else {
      this.writeFile(path, '');
    }
  }

  find(startPath: string, name?: string, type?: string): string[] {
    const results: string[] = [];
    const walk = (currentPath: string) => {
      const node = this.getNodeByPath(currentPath);
      if (!node) return;

      let match = true;
      if (name) {
        const pattern = name.replace(/\*/g, '.*').replace(/\?/g, '.');
        match = new RegExp(`^${pattern}$`).test(node.name);
      }
      if (type) {
        if (type === 'f' && node.type !== 'file') match = false;
        if (type === 'd' && node.type !== 'directory') match = false;
      }
      if (match) results.push(currentPath);

      if (node.type === 'directory') {
        for (const childName of node.children.keys()) {
          walk(currentPath === '/' ? `/${childName}` : `${currentPath}/${childName}`);
        }
      }
    };
    walk(startPath);
    return results;
  }

  getPathString(nodeId: number): string {
    const parts: string[] = [];
    let current = this.inodes.get(nodeId);
    while (current && current.id !== 1) {
      parts.unshift(current.name);
      current = this.inodes.get(current.parent);
    }
    return '/' + parts.join('/');
  }

  // ---- Persistence (serialize/deserialize) ----

  serialize(): string {
    const data: Array<[number, INode & { childrenArr: [string, number][] }]> = [];
    for (const [id, node] of this.inodes) {
      data.push([id, { ...node, childrenArr: Array.from(node.children.entries()), children: new Map() }]);
    }
    return JSON.stringify({ nextId: this.nextId, inodes: data });
  }

  deserialize(json: string): void {
    const data = JSON.parse(json);
    this.nextId = data.nextId;
    this.inodes.clear();
    for (const [id, nodeData] of data.inodes) {
      const node: INode = {
        ...nodeData,
        children: new Map(nodeData.childrenArr),
      };
      this.inodes.set(id, node);
    }
  }
}

// Singleton
export const vfs = new VirtualFileSystem();
