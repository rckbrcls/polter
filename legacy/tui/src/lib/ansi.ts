// Strip ANSI escape sequences (SGR, cursor movement, OSC, etc.)
const ANSI_RE =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ANSI stripping
  /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, "");
}
