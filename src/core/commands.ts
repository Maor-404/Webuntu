// ============================================================================
// Webuntu — Shell Commands (25+ built-in Linux commands)
// ============================================================================
import { vfs } from './vfs';
import type { CommandResult, ShellEnv } from '../types';

type CmdFn = (args: string[], env: ShellEnv, cwd: string) => CommandResult;

function ok(output: string): CommandResult { return { output, exitCode: 0 }; }
function err(msg: string, code = 1): CommandResult { return { output: '', exitCode: code, error: msg }; }

function formatPerms(node: { permissions: string; owner: string; group: string; size: number; modified: number; name: string; type: string }): string {
  const d = new Date(node.modified);
  const mon = d.toLocaleString('en', { month: 'short' });
  const day = String(d.getDate()).padStart(2, ' ');
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const size = String(node.size).padStart(6);
  return `${node.permissions} 1 ${node.owner.padEnd(6)} ${node.group.padEnd(6)} ${size} ${mon} ${day} ${time} ${node.name}${node.type === 'directory' ? '/' : ''}`;
}

// ---- Individual Commands ----

const cmd_ls: CmdFn = (args, _env, cwd) => {
  let showAll = false, longFormat = false, showHidden = false;
  const paths: string[] = [];
  for (const a of args) {
    if (a.startsWith('-')) {
      if (a.includes('a') || a.includes('A')) showAll = true;
      if (a.includes('l')) longFormat = true;
      if (a.includes('h')) showHidden = true;
      if (a === '-la' || a === '-al') { showAll = true; longFormat = true; }
    } else {
      paths.push(a);
    }
  }
  const target = paths[0] ? vfs.resolvePath(paths[0], cwd) : cwd;
  if (!vfs.exists(target)) return err(`ls: cannot access '${paths[0] || '.'}': No such file or directory`);
  if (vfs.isFile(target)) {
    const node = vfs.stat(target)!;
    return ok(longFormat ? formatPerms(node) : node.name);
  }
  const nodes = vfs.readdirStat(target);
  const filtered = showAll ? nodes : nodes.filter(n => !n.name.startsWith('.'));
  if (longFormat) {
    const lines = [`total ${filtered.length}`];
    for (const n of filtered) lines.push(formatPerms(n));
    return ok(lines.join('\n'));
  }
  const names = filtered.map(n => n.type === 'directory' ? `\x1b[1;34m${n.name}/\x1b[0m` : n.name);
  return ok(names.join('  '));
};

const cmd_cd: CmdFn = (args, env, cwd) => {
  const target = args[0] || env['HOME'] || '/home/user';
  const resolved = vfs.resolvePath(target, cwd);
  if (!vfs.exists(resolved)) return err(`cd: ${target}: No such file or directory`);
  if (!vfs.isDirectory(resolved)) return err(`cd: ${target}: Not a directory`);
  return { output: '', exitCode: 0, error: `__CD__${resolved}` };
};

const cmd_pwd: CmdFn = (_args, _env, cwd) => ok(cwd);

const cmd_echo: CmdFn = (args, env) => {
  let noNewline = false;
  let processedArgs = args;
  if (args[0] === '-n') { noNewline = true; processedArgs = args.slice(1); }
  let text = processedArgs.join(' ');
  // Expand environment variables
  text = text.replace(/\$(\w+)/g, (_, name) => env[name] || '');
  text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  return ok(noNewline ? text : text);
};

const cmd_cat: CmdFn = (args, _env, cwd) => {
  if (args.length === 0) return err('cat: missing operand');
  const outputs: string[] = [];
  for (const arg of args) {
    const path = vfs.resolvePath(arg, cwd);
    try {
      outputs.push(vfs.readFile(path));
    } catch (e: any) {
      return err(`cat: ${arg}: ${e.message}`);
    }
  }
  return ok(outputs.join(''));
};

const cmd_mkdir: CmdFn = (args, _env, cwd) => {
  let recursive = false;
  const paths: string[] = [];
  for (const a of args) {
    if (a === '-p') recursive = true;
    else paths.push(a);
  }
  if (paths.length === 0) return err('mkdir: missing operand');
  for (const p of paths) {
    try {
      vfs.mkdir(vfs.resolvePath(p, cwd), recursive);
    } catch (e: any) {
      return err(`mkdir: ${e.message}`);
    }
  }
  return ok('');
};

const cmd_touch: CmdFn = (args, _env, cwd) => {
  if (args.length === 0) return err('touch: missing operand');
  for (const a of args) {
    vfs.touch(vfs.resolvePath(a, cwd));
  }
  return ok('');
};

const cmd_rm: CmdFn = (args, _env, cwd) => {
  let recursive = false, force = false;
  const paths: string[] = [];
  for (const a of args) {
    if (a.startsWith('-')) {
      if (a.includes('r') || a.includes('R')) recursive = true;
      if (a.includes('f')) force = true;
    } else paths.push(a);
  }
  if (paths.length === 0) return err('rm: missing operand');
  for (const p of paths) {
    const resolved = vfs.resolvePath(p, cwd);
    try {
      vfs.rm(resolved, recursive);
    } catch (e: any) {
      if (!force) return err(`rm: ${e.message}`);
    }
  }
  return ok('');
};

const cmd_cp: CmdFn = (args, _env, cwd) => {
  let recursive = false;
  const paths: string[] = [];
  for (const a of args) {
    if (a === '-r' || a === '-R' || a === '-a') recursive = true;
    else paths.push(a);
  }
  if (paths.length < 2) return err('cp: missing destination');
  try {
    vfs.cp(vfs.resolvePath(paths[0], cwd), vfs.resolvePath(paths[1], cwd), recursive);
  } catch (e: any) {
    return err(`cp: ${e.message}`);
  }
  return ok('');
};

const cmd_mv: CmdFn = (args, _env, cwd) => {
  if (args.length < 2) return err('mv: missing destination');
  try {
    vfs.mv(vfs.resolvePath(args[0], cwd), vfs.resolvePath(args[1], cwd));
  } catch (e: any) {
    return err(`mv: ${e.message}`);
  }
  return ok('');
};

const cmd_grep: CmdFn = (args, _env, cwd) => {
  let ignoreCase = false, lineNumbers = false, invert = false;
  const nonFlags: string[] = [];
  for (const a of args) {
    if (a.startsWith('-')) {
      if (a.includes('i')) ignoreCase = true;
      if (a.includes('n')) lineNumbers = true;
      if (a.includes('v')) invert = true;
    } else nonFlags.push(a);
  }
  if (nonFlags.length < 1) return err('grep: missing pattern');
  const pattern = nonFlags[0];
  const files = nonFlags.slice(1);
  const regex = new RegExp(pattern, ignoreCase ? 'i' : '');
  const processContent = (content: string, filename?: string): string[] => {
    return content.split('\n').reduce<string[]>((acc, line, i) => {
      const matches = regex.test(line);
      if (matches !== invert) {
        let prefix = '';
        if (filename && files.length > 1) prefix = `${filename}:`;
        if (lineNumbers) prefix += `${i + 1}:`;
        const highlighted = line.replace(regex, (m) => `\x1b[1;31m${m}\x1b[0m`);
        acc.push(prefix + highlighted);
      }
      return acc;
    }, []);
  };

  if (files.length === 0) {
    // Read from stdin (pipeline input) — handled by shell
    return ok('grep: (reading from stdin not supported in direct mode)');
  }
  const results: string[] = [];
  for (const f of files) {
    try {
      const content = vfs.readFile(vfs.resolvePath(f, cwd));
      results.push(...processContent(content, f));
    } catch (e: any) {
      return err(`grep: ${f}: ${e.message}`);
    }
  }
  return ok(results.join('\n'));
};

const cmd_head: CmdFn = (args, _env, cwd) => {
  let n = 10;
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n' && args[i + 1]) { n = parseInt(args[++i]); }
    else if (!args[i].startsWith('-')) files.push(args[i]);
  }
  if (files.length === 0) return err('head: missing operand');
  try {
    const content = vfs.readFile(vfs.resolvePath(files[0], cwd));
    return ok(content.split('\n').slice(0, n).join('\n'));
  } catch (e: any) {
    return err(`head: ${e.message}`);
  }
};

const cmd_tail: CmdFn = (args, _env, cwd) => {
  let n = 10;
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n' && args[i + 1]) { n = parseInt(args[++i]); }
    else if (!args[i].startsWith('-')) files.push(args[i]);
  }
  if (files.length === 0) return err('tail: missing operand');
  try {
    const content = vfs.readFile(vfs.resolvePath(files[0], cwd));
    const lines = content.split('\n');
    return ok(lines.slice(-n).join('\n'));
  } catch (e: any) {
    return err(`tail: ${e.message}`);
  }
};

const cmd_wc: CmdFn = (args, _env, cwd) => {
  if (args.length === 0) return err('wc: missing operand');
  const results: string[] = [];
  for (const f of args) {
    if (f.startsWith('-')) continue;
    try {
      const content = vfs.readFile(vfs.resolvePath(f, cwd));
      const lines = content.split('\n').length;
      const words = content.split(/\s+/).filter(Boolean).length;
      const chars = content.length;
      results.push(`  ${lines}  ${words} ${chars} ${f}`);
    } catch (e: any) {
      return err(`wc: ${f}: ${e.message}`);
    }
  }
  return ok(results.join('\n'));
};

const cmd_chmod: CmdFn = (args, _env, cwd) => {
  if (args.length < 2) return err('chmod: missing operand');
  try {
    vfs.chmod(vfs.resolvePath(args[1], cwd), args[0]);
  } catch (e: any) {
    return err(`chmod: ${e.message}`);
  }
  return ok('');
};

const cmd_whoami: CmdFn = (_a, env) => ok(env['USER'] || 'user');

const cmd_date: CmdFn = () => ok(new Date().toString());

const cmd_uname: CmdFn = (args) => {
  if (args.includes('-a')) return ok('Linux webuntu 6.8.0-webuntu #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux');
  if (args.includes('-r')) return ok('6.8.0-webuntu');
  if (args.includes('-s')) return ok('Linux');
  if (args.includes('-n')) return ok('webuntu');
  if (args.includes('-m')) return ok('x86_64');
  return ok('Linux');
};

const cmd_clear: CmdFn = () => ({ output: '__CLEAR__', exitCode: 0 });

const cmd_env: CmdFn = (_args, env) => ok(Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n'));

const cmd_export: CmdFn = (args, env) => {
  for (const a of args) {
    const eq = a.indexOf('=');
    if (eq > 0) {
      const key = a.substring(0, eq);
      const val = a.substring(eq + 1).replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
  return ok('');
};

const cmd_history: CmdFn = () => ({ output: '__HISTORY__', exitCode: 0 });

const cmd_which: CmdFn = (args) => {
  if (args.length === 0) return err('which: missing argument');
  const cmd = args[0];
  if (commands[cmd]) return ok(`/usr/bin/${cmd}`);
  return err(`which: no ${cmd} in (/usr/bin:/bin)`);
};

const cmd_man: CmdFn = (args) => {
  if (args.length === 0) return err('What manual page do you want?');
  const cmd = args[0];
  const manPages: Record<string, string> = {
    ls: 'ls - list directory contents\n\nUsage: ls [OPTION]... [FILE]...\n  -a  include hidden files\n  -l  long listing format\n  -h  human-readable sizes',
    cd: 'cd - change the working directory\n\nUsage: cd [DIR]\n  If DIR is omitted, $HOME is used.',
    cat: 'cat - concatenate files and print on standard output\n\nUsage: cat [FILE]...',
    grep: 'grep - search for patterns in files\n\nUsage: grep [OPTION]... PATTERN [FILE]...\n  -i  ignore case\n  -n  show line numbers\n  -v  invert match',
    echo: 'echo - display a line of text\n\nUsage: echo [OPTION]... [STRING]...\n  -n  do not output trailing newline',
    mkdir: 'mkdir - make directories\n\nUsage: mkdir [OPTION]... DIRECTORY...\n  -p  make parent directories as needed',
    rm: 'rm - remove files or directories\n\nUsage: rm [OPTION]... FILE...\n  -r  remove directories recursively\n  -f  force, ignore nonexistent files',
    touch: 'touch - change file timestamps\n\nUsage: touch FILE...',
    find: 'find - search for files in a directory hierarchy\n\nUsage: find [PATH] [-name PATTERN] [-type TYPE]',
    apt: 'apt - package management\n\nUsage: apt [install|remove|update|list] [PACKAGE]...',
  };
  return ok(manPages[cmd] || `No manual entry for ${cmd}`);
};

const cmd_find: CmdFn = (args, _env, cwd) => {
  let path = '.';
  let name: string | undefined;
  let type: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-name' && args[i + 1]) name = args[++i];
    else if (args[i] === '-type' && args[i + 1]) type = args[++i];
    else if (!args[i].startsWith('-')) path = args[i];
  }
  const resolved = vfs.resolvePath(path, cwd);
  const results = vfs.find(resolved, name, type);
  return ok(results.join('\n'));
};

const cmd_sort: CmdFn = (args, _env, cwd) => {
  let reverse = false;
  const files: string[] = [];
  for (const a of args) {
    if (a === '-r') reverse = true;
    else files.push(a);
  }
  if (files.length === 0) return err('sort: missing operand');
  try {
    const content = vfs.readFile(vfs.resolvePath(files[0], cwd));
    const lines = content.split('\n').filter(Boolean).sort();
    if (reverse) lines.reverse();
    return ok(lines.join('\n'));
  } catch (e: any) {
    return err(`sort: ${e.message}`);
  }
};

const cmd_uniq: CmdFn = (args, _env, cwd) => {
  if (args.length === 0) return err('uniq: missing operand');
  try {
    const content = vfs.readFile(vfs.resolvePath(args[0], cwd));
    const lines = content.split('\n');
    const result = lines.filter((line, i) => i === 0 || line !== lines[i - 1]);
    return ok(result.join('\n'));
  } catch (e: any) {
    return err(`uniq: ${e.message}`);
  }
};

const cmd_tr: CmdFn = (args) => {
  if (args.length < 2) return err('tr: missing operand');
  return ok(`tr: (operates on piped input — use with pipes)`);
};

const cmd_ps: CmdFn = () => {
  const lines = [
    '  PID TTY          TIME CMD',
    '    1 pts/0    00:00:00 bash',
    '    2 pts/0    00:00:00 webuntu-desktop',
    '    3 pts/0    00:00:00 ps',
  ];
  return ok(lines.join('\n'));
};

const cmd_kill: CmdFn = (args) => {
  if (args.length === 0) return err('kill: missing operand');
  return ok(`kill: sent signal to process ${args[0]}`);
};

const cmd_apt: CmdFn = (args) => {
  if (args.length === 0) return err('Usage: apt [install|remove|update|upgrade|list|search] [package]');
  const sub = args[0];
  switch (sub) {
    case 'update':
      return ok(
        'Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\n' +
        'Hit:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease\n' +
        'Hit:3 http://security.ubuntu.com/ubuntu noble-security InRelease\n' +
        'Reading package lists... Done\n' +
        'Building dependency tree... Done\n' +
        'All packages are up to date.'
      );
    case 'upgrade':
      return ok('Reading package lists... Done\nCalculating upgrade... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.');
    case 'install':
      if (args.length < 2) return err('apt install: missing package name');
      return ok(
        `Reading package lists... Done\n` +
        `Building dependency tree... Done\n` +
        `The following NEW packages will be installed:\n` +
        `  ${args.slice(1).join(' ')}\n` +
        `0 upgraded, ${args.length - 1} newly installed, 0 to remove.\n` +
        `Setting up ${args[1]} ... Done`
      );
    case 'remove':
      if (args.length < 2) return err('apt remove: missing package name');
      return ok(`Removing ${args[1]}... Done`);
    case 'list':
      return ok(
        'bash/noble 5.2.21 amd64 [installed]\n' +
        'coreutils/noble 9.4 amd64 [installed]\n' +
        'grep/noble 3.11 amd64 [installed]\n' +
        'nano/noble 7.2 amd64 [installed]\n' +
        'python3/noble 3.12.3 amd64 [installed]\n' +
        'vim/noble 9.1 amd64 [installed]'
      );
    case 'search':
      return ok(args[1] ? `Searching for ${args[1]}...\n${args[1]}/noble - Package description` : 'apt search: missing search term');
    default:
      return err(`apt: unknown command '${sub}'`);
  }
};

const cmd_hostname: CmdFn = () => ok('webuntu');

const cmd_id: CmdFn = () => ok('uid=1000(user) gid=1000(user) groups=1000(user),4(adm),27(sudo)');

const cmd_df: CmdFn = () => ok(
  'Filesystem     1K-blocks    Used Available Use% Mounted on\n' +
  'webuntu-vfs     10485760  524288   9961472   5% /\n' +
  'tmpfs             204800       0    204800   0% /tmp\n' +
  'devtmpfs          204800       0    204800   0% /dev'
);

const cmd_free: CmdFn = () => ok(
  '               total        used        free      shared  buff/cache   available\n' +
  'Mem:         4096000     1024000     2048000       64000     1024000     3072000\n' +
  'Swap:        2048000           0     2048000'
);

const cmd_uptime: CmdFn = () => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  return ok(` ${time} up 0 days,  0:01,  1 user,  load average: 0.00, 0.01, 0.05`);
};

const cmd_neofetch: CmdFn = (_a, env) => {
  const user = env['USER'] || 'user';
  return ok(
    `\x1b[1;33m        _\x1b[0m\n` +
    `\x1b[1;33m    ---(_)\x1b[0m    \x1b[1;33m${user}\x1b[0m@\x1b[1;33mwebuntu\x1b[0m\n` +
    `\x1b[1;33m   _/  ---\\\x1b[0m   ---------------\n` +
    `\x1b[1;33m  (_) |   |\x1b[0m   \x1b[1mOS:\x1b[0m Webuntu 24.04 LTS x86_64\n` +
    `\x1b[1;33m    \\  --- _\x1b[0m   \x1b[1mHost:\x1b[0m Browser Virtual Machine\n` +
    `\x1b[1;33m     ---(_)\x1b[0m    \x1b[1mKernel:\x1b[0m 6.8.0-webuntu\n` +
    `\x1b[1;33m            \x1b[0m   \x1b[1mShell:\x1b[0m webuntu-sh\n` +
    `                \x1b[1mDE:\x1b[0m Webuntu Desktop\n` +
    `                \x1b[1mWM:\x1b[0m Webuntu WM\n` +
    `                \x1b[1mTheme:\x1b[0m Yaru-dark\n` +
    `                \x1b[1mTerminal:\x1b[0m xterm.js\n` +
    `                \x1b[1mCPU:\x1b[0m WebAssembly Virtual\n` +
    `                \x1b[1mMemory:\x1b[0m 1024MiB / 4096MiB\n`
  );
};

const cmd_help: CmdFn = () => ok(
  '\x1b[1;32mWebuntu Shell — Built-in Commands\x1b[0m\n\n' +
  'Navigation:     cd, ls, pwd, find\n' +
  'Files:          cat, head, tail, touch, cp, mv, rm, mkdir, chmod\n' +
  'Text:           echo, grep, sort, uniq, wc, tr\n' +
  'System:         ps, kill, uname, hostname, whoami, id, date, uptime\n' +
  'Info:           df, free, neofetch, env, export, which, man, help\n' +
  'Package:        apt [install|remove|update|list|search]\n' +
  'Terminal:       clear, history, exit\n'
);

// ---- Registry ----

export const commands: Record<string, CmdFn> = {
  ls: cmd_ls, cd: cmd_cd, pwd: cmd_pwd, echo: cmd_echo,
  cat: cmd_cat, mkdir: cmd_mkdir, touch: cmd_touch, rm: cmd_rm,
  cp: cmd_cp, mv: cmd_mv, grep: cmd_grep, head: cmd_head,
  tail: cmd_tail, wc: cmd_wc, chmod: cmd_chmod, whoami: cmd_whoami,
  date: cmd_date, uname: cmd_uname, clear: cmd_clear, env: cmd_env,
  export: cmd_export, history: cmd_history, which: cmd_which, man: cmd_man,
  find: cmd_find, sort: cmd_sort, uniq: cmd_uniq, tr: cmd_tr,
  ps: cmd_ps, kill: cmd_kill, apt: cmd_apt, 'apt-get': cmd_apt,
  hostname: cmd_hostname, id: cmd_id, df: cmd_df, free: cmd_free,
  uptime: cmd_uptime, neofetch: cmd_neofetch, help: cmd_help,
  true: () => ok(''), false: () => err('', 1),
};
