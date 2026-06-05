/**
 * Shell commands the terminal understands.
 *
 * Rule: only SHELL UTILITIES live here. Anything that answers a
 * question about the developer is answered by the RAG (see
 * `runAIChat` in Terminal.tsx) and grounded in `knowledge.json`.
 * That's the single source of truth for "what does Ahmad do / use
 * / like" — keep it in one place.
 *
 * What stays:
 *  - help     list the available shell commands
 *  - clear    wipe the terminal
 *  - theme    toggle the page theme
 *  - sudo …   easter egg
 *
 * Everything else is sent to the assistant.
 */
export type CommandResult = {
  text: string | string[]
  sideEffect?: 'clear' | 'theme-dark' | 'theme-light' | 'glitch'
}

type Command = {
  names: string[]
  describe: string
  run: (args: string[]) => CommandResult | null
}

const HELP_LINES = [
  'Shell commands:',
  '  help                  Show this help',
  '  clear                 Clear the terminal',
  '  theme [dark|light]    Switch theme',
  '  sudo rm -rf /         Don\'t.',
  '',
  'Anything else is sent to the assistant. Try: "what is your experience with Python?"',
]

export const COMMANDS: Command[] = [
  {
    names: ['help', '?'],
    describe: 'Show available shell commands',
    run: () => ({ text: HELP_LINES }),
  },
  {
    names: ['clear', 'cls'],
    describe: 'Clear the terminal',
    run: () => ({ text: '', sideEffect: 'clear' }),
  },
  {
    names: ['theme'],
    describe: 'Switch theme (dark|light)',
    run: (args) => {
      const arg = args[0]?.toLowerCase()
      if (arg === 'dark') return { text: 'Switching to dark…', sideEffect: 'theme-dark' }
      if (arg === 'light') return { text: 'Switching to light…', sideEffect: 'theme-light' }
      return { text: 'Usage: theme [dark|light]' }
    },
  },
]

/**
 * Look up a command by the first token of the input. Returns
 * the matching command and the remaining args, or null.
 */
export function findCommand(input: string): { cmd: Command; args: string[] } | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const [head, ...rest] = trimmed.split(/\s+/)
  const cmd = COMMANDS.find((c) => c.names.includes(head.toLowerCase()))
  if (!cmd) return null
  return { cmd, args: rest }
}

/**
 * Check whether the input is the easter-egg command.
 * Match is fuzzy to be forgiving with extra flags.
 */
export function isSudoEasterEgg(input: string): boolean {
  const t = input.trim().toLowerCase()
  if (!t.startsWith('sudo')) return false
  return /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|-rf|-fr|\S+)\s+(\/|\/\s*)$/.test(t)
}
