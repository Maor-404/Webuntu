# Webuntu 24.04 LTS (Noble Numbat) — Browser-Based OS Emulator

Webuntu is a client-side web application that simulates a fully functional Ubuntu desktop environment entirely inside a modern web browser. Powered by SolidJS, TypeScript, and a custom POSIX system-call and shell interpreter engine, Webuntu runs 100% serverless, works completely offline as a PWA, and loads in less than 2 seconds.

## 🚀 Key Features

*   **Premium Ubuntu Desktop Shell:** Mimics the Ubuntu Yaru Dark Theme with a custom GNOME-style top bar, Activities search overlay, Left Dock launcher, context menus, and a window stacking manager.
*   **Virtual File System (VFS):** Inode-based ext2-like virtual filesystem supporting paths, directories, files, permissions, size, modification tracking, search (`find`), and persistable state.
*   **Built-in Shell Interpreter:** Supports env vars, pipes (`|`), input/output redirection (`>`, `>>`), command history, tab completion, and wildcard glob expansion (`*`).
*   **37+ Classic CLI Commands:** Includes `ls`, `cd`, `pwd`, `cat`, `grep`, `mkdir`, `rm`, `cp`, `mv`, `chmod`, `wc`, `neofetch`, `apt`, and many more.
*   **Integrated Desktop Apps:**
    *   **Terminal:** An interactive xterm.js TTY connected to the system shell.
    *   **Files:** A Nautilus-style file manager supporting grid/list view, breadcrumb navigation, and sidebars.
    *   **Text Editor:** A gedit-style file writer with line numbers, code textarea, and file browser.
    *   **Calculator:** A GNOME-style calculator with a complete grid layout.
    *   **Settings:** Customize wallpaper, accent colors, text size, terminal opacity, and check device specs.
    *   **System Monitor:** Live resource tracking graphs (CPU/Memory) and active processes.

---

## 🎮 The Ultimate Goal: Can it Run DOOM?

Yes, it will! Running DOOM is the gold standard of operating system emulation. The project's future phases outline compiling generic **chocolate-doom** directly into WebAssembly using Emscripten (packaged with MSYS2/MinGW), loading the shareware `doom1.wad` block, and mapping keyboard control hooks into a custom canvas-based Webuntu app.

---

## ⚙️ Getting Started

### Prerequisites

*   Node.js (v18+)
*   npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/webuntu.git
   cd webuntu
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000/`.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    BROWSER TAB                             │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          SolidJS Desktop Shell (UI Layer)             │  │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │Top Bar │ │ Dock   │ │ Window   │ │ Activities │  │  │
│  │  │(clock) │ │(icons) │ │ Manager  │ │ Overlay    │  │  │
│  │  └────────┘ └────────┘ └──────────┘ └────────────┘  │  │
│  └──────┼───────────────────────────────────────────────┘  │
│         │ stdin/stdout                                      │
│  ┌──────▼───────────────────────────────────────────────┐  │
│  │                 WEBUNTU SHELL ENGINE                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │   POSIX     │  │   Virtual   │  │   Process    │  │  │
│  │  │   Syscall   │  │   File      │  │   Table &    │  │  │
│  │  │   Layer     │  │   System    │  │   Scheduler  │  │  │
│  │  └─────────────┘  └──────┬──────┘  └──────────────┘  │  │
│  │                          │                            │  │
│  │  ┌─────────────┐  ┌─────▼────────┐                   │  │
│  │  │ Bash-like   │  │ Persistence  │                   │  │
│  │  │ Shell       │  │ IndexedDB    │                   │  │
│  │  └─────────────┘  └──────────────┘                   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Roadmap

- [x] Phase 1: Setup SolidJS + Vite + Custom Yaru CSS Design System
- [x] Phase 2: Create custom Inode-based Virtual Filesystem (VFS)
- [x] Phase 3: Build Unix Shell interpreter & pipe parser
- [x] Phase 4: Construct Desktop Apps (Terminal, Files, Editor, Calculator, Settings, Monitor)
- [ ] Phase 5: Integrate Emscripten pipeline to cross-compile C-based tools to WASI WASM
- [ ] Phase 6: Run DOOM in a browser canvas window using WebAssembly compilation

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/webuntu/issues).

## 📄 License

This project is licensed under the MIT License.
