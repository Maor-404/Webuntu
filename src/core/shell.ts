// ============================================================================
// Webuntu — Shell Interpreter (Bash-like with pipes, redirects, env vars)
// ============================================================================
import { vfs } from './vfs';
import { commands } from './commands';
import type { ShellEnv, CommandResult } from '../types';

export class Shell {
  env: ShellEnv;
  cwd: string;
  history: string[] = [];
  private historyIndex = -1;

  constructor() {
    this.cwd = '/home/user';
    this.env = {
      HOME: '/home/user',
      USER: 'user',
      SHELL: '/bin/bash',
      PATH: '/usr/bin:/bin:/usr/sbin:/sbin',
      TERM: 'xterm-256color',
      LANG: 'en_US.UTF-8',
      HOSTNAME: 'webuntu',
      PWD: '/home/user',
      OLDPWD: '/home/user',
      LOGNAME: 'user',
      EDITOR: 'nano',
      PS1: '\\u@\\h:\\w\\$ ',
    };
  }

  getPrompt(): string {
    const dir = this.cwd.replace(/^\/home\/user/, '~') || '/';
    return `\x1b[1;32m${this.env.USER}@webuntu\x1b[0m:\x1b[1;34m${dir}\x1b[0m$ `;
  }

  historyUp(): string | null {
    if (this.history.length === 0) return null;
    if (this.historyIndex < 0) this.historyIndex = this.history.length;
    this.historyIndex = Math.max(0, this.historyIndex - 1);
    return this.history[this.historyIndex] || null;
  }

  historyDown(): string | null {
    if (this.historyIndex < 0) return null;
    this.historyIndex = Math.min(this.history.length, this.historyIndex + 1);
    return this.historyIndex < this.history.length ? this.history[this.historyIndex] : '';
  }

  tabComplete(partial: string): string[] {
    const parts = partial.split(' ');
    const lastPart = parts[parts.length - 1] || '';

    // If it's the first word, complete commands
    if (parts.length <= 1) {
      return Object.keys(commands)
        .filter(c => c.startsWith(lastPart))
        .sort();
    }

    // Otherwise complete file/directory names
    let dir = this.cwd;
    let prefix = lastPart;

    if (lastPart.includes('/')) {
      const lastSlash = lastPart.lastIndexOf('/');
      const dirPart = lastPart.substring(0, lastSlash) || '/';
      dir = vfs.resolvePath(dirPart, this.cwd);
      prefix = lastPart.substring(lastSlash + 1);
    }

    try {
      const entries = vfs.readdir(dir);
      return entries
        .filter(e => e.startsWith(prefix))
        .map(e => {
          const fullPath = vfs.resolvePath(`${dir}/${e}`, '/');
          const suffix = vfs.isDirectory(fullPath) ? '/' : ' ';
          if (lastPart.includes('/')) {
            const dirPart = lastPart.substring(0, lastPart.lastIndexOf('/') + 1);
            return dirPart + e + suffix;
          }
          return e + suffix;
        });
    } catch {
      return [];
    }
  }

  execute(input: string): CommandResult {
    const trimmed = input.trim();
    if (!trimmed) return { output: '', exitCode: 0 };

    this.history.push(trimmed);
    this.historyIndex = -1;

    // Handle special: history command
    if (trimmed === 'history') {
      const output = this.history
        .map((h, i) => `  ${String(i + 1).padStart(4)}  ${h}`)
        .join('\n');
      return { output, exitCode: 0 };
    }

    // Handle variable assignment: FOO=bar
    const assignMatch = trimmed.match(/^(\w+)=(.*)$/);
    if (assignMatch) {
      this.env[assignMatch[1]] = assignMatch[2].replace(/^["']|["']$/g, '');
      return { output: '', exitCode: 0 };
    }

    // Expand env vars in the input
    let expanded = trimmed.replace(/\$\{(\w+)\}/g, (_, name) => this.env[name] || '');
    expanded = expanded.replace(/\$(\w+)/g, (_, name) => this.env[name] || '');

    // Handle pipes
    if (expanded.includes('|')) {
      return this.executePipeline(expanded);
    }

    // Handle output redirect
    let redirectFile: string | null = null;
    let redirectAppend = false;
    if (expanded.includes('>>')) {
      const parts = expanded.split('>>');
      expanded = parts[0].trim();
      redirectFile = parts[1].trim();
      redirectAppend = true;
    } else if (expanded.includes('>')) {
      const parts = expanded.split('>');
      expanded = parts[0].trim();
      redirectFile = parts[1].trim();
    }

    // Parse command and args
    const tokens = this.tokenize(expanded);
    if (tokens.length === 0) return { output: '', exitCode: 0 };

    const cmd = tokens[0];
    const args = tokens.slice(1);

    // Special: exit
    if (cmd === 'exit') {
      return { output: '__EXIT__', exitCode: 0 };
    }

    // Lookup command
    const handler = commands[cmd];
    if (!handler) {
      // Try to run as a file (check if it exists in PATH)
      if (vfs.exists(vfs.resolvePath(cmd, this.cwd))) {
        const content = vfs.readFile(vfs.resolvePath(cmd, this.cwd));
        if (content.startsWith('#!/')) {
          return { output: `${cmd}: script execution not yet supported`, exitCode: 126 };
        }
      }
      return { output: '', exitCode: 127, error: `${cmd}: command not found` };
    }

    const result = handler(args, this.env, this.cwd);

    // Handle cd's special error channel for cwd change
    if (result.error?.startsWith('__CD__')) {
      const newCwd = result.error.substring(6);
      this.env.OLDPWD = this.cwd;
      this.cwd = newCwd;
      this.env.PWD = newCwd;
      return { output: '', exitCode: 0 };
    }

    // Handle redirect
    if (redirectFile && result.output) {
      const path = vfs.resolvePath(redirectFile, this.cwd);
      if (redirectAppend) {
        vfs.appendFile(path, result.output + '\n');
      } else {
        vfs.writeFile(path, result.output + '\n');
      }
      return { output: '', exitCode: result.exitCode };
    }

    return result;
  }

  private executePipeline(input: string): CommandResult {
    const stages = input.split('|').map(s => s.trim());
    let lastOutput = '';

    for (let i = 0; i < stages.length; i++) {
      const tokens = this.tokenize(stages[i]);
      if (tokens.length === 0) continue;

      const cmd = tokens[0];
      let args = tokens.slice(1);

      // For grep in a pipe, feed previous output as stdin
      if (i > 0 && lastOutput) {
        if (cmd === 'grep') {
          // Create a temp file with the piped content, grep it
          const tmpPath = `/tmp/.pipe_${Date.now()}`;
          vfs.writeFile(tmpPath, lastOutput);
          args = [...args, tmpPath];
          const handler = commands[cmd];
          if (handler) {
            const result = handler(args, this.env, this.cwd);
            lastOutput = result.error ? '' : result.output;
            vfs.rm(tmpPath);
            if (result.error && !result.error.startsWith('__')) {
              return result;
            }
            continue;
          }
        } else if (cmd === 'head' || cmd === 'tail' || cmd === 'sort' || cmd === 'uniq' || cmd === 'wc') {
          const tmpPath = `/tmp/.pipe_${Date.now()}`;
          vfs.writeFile(tmpPath, lastOutput);
          args = [...args, tmpPath];
          const handler = commands[cmd];
          if (handler) {
            const result = handler(args, this.env, this.cwd);
            lastOutput = result.error ? '' : result.output;
            vfs.rm(tmpPath);
            continue;
          }
        }
      }

      const handler = commands[cmd];
      if (!handler) return { output: '', exitCode: 127, error: `${cmd}: command not found` };
      const result = handler(args, this.env, this.cwd);

      if (result.error && !result.error.startsWith('__')) {
        return result;
      }
      lastOutput = result.output;
    }

    return { output: lastOutput, exitCode: 0 };
  }

  private tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;
    let escaped = false;

    for (const ch of input) {
      if (escaped) {
        current += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
      if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
      if (ch === ' ' && !inSingle && !inDouble) {
        if (current) { tokens.push(current); current = ''; }
        continue;
      }
      current += ch;
    }
    if (current) tokens.push(current);

    // Glob expansion for * patterns
    return tokens.flatMap(token => {
      if (token.includes('*') && !inSingle) {
        try {
          const dir = token.includes('/') ?
            vfs.resolvePath(token.substring(0, token.lastIndexOf('/')), this.cwd) :
            this.cwd;
          const pattern = token.includes('/') ? token.substring(token.lastIndexOf('/') + 1) : token;
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
          const entries = vfs.readdir(dir).filter(e => regex.test(e));
          if (entries.length > 0) return entries;
        } catch { /* fall through */ }
      }
      return [token];
    });
  }
}
