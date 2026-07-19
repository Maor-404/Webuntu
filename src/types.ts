// ============================================================================
// Webuntu — Type Definitions
// ============================================================================

export interface INode {
  id: number;
  name: string;
  type: 'file' | 'directory' | 'symlink';
  permissions: string;
  owner: string;
  group: string;
  size: number;
  modified: number;
  created: number;
  content: string;
  children: Map<string, number>;
  target: string;
  parent: number;
}

export interface ProcessInfo {
  pid: number;
  ppid: number;
  name: string;
  command: string;
  status: 'running' | 'sleeping' | 'stopped' | 'zombie';
  startTime: number;
  cpu: number;
  memory: number;
}

export interface WindowInfo {
  id: string;
  appId: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  focused: boolean;
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  category: 'system' | 'utility' | 'development' | 'accessories';
  component: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
}

export interface DesktopTheme {
  wallpaper: string;
  accentColor: string;
  darkMode: boolean;
  fontSize: number;
  terminalOpacity: number;
}

export interface ShellEnv {
  [key: string]: string;
}

export interface ParsedCommand {
  command: string;
  args: string[];
  stdin: string | null;
  stdout: string | null;
  stdoutAppend: boolean;
  pipe: ParsedCommand | null;
  background: boolean;
}

export interface CommandResult {
  output: string;
  exitCode: number;
  error?: string;
}
