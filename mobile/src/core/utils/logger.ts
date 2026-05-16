/* eslint-disable no-console */
/**
 * Centralised logger.
 *
 * Verbose in dev (`__DEV__ === true`), silent in release. Use this
 * everywhere instead of `console.*` — ESLint forbids raw `console` calls
 * outside this file.
 */
type LogArg = unknown;

const noop = (): void => undefined;

function tag(level: string): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `[${hh}:${mm}:${ss}][${level}]`;
}

export const logger = __DEV__
  ? {
      debug: (...args: LogArg[]): void => console.log(tag('DBG'), ...args),
      info: (...args: LogArg[]): void => console.log(tag('INF'), ...args),
      warn: (...args: LogArg[]): void => console.warn(tag('WRN'), ...args),
      error: (...args: LogArg[]): void => console.error(tag('ERR'), ...args),
    }
  : {
      debug: noop,
      info: noop,
      // Warnings and errors stay visible in release so crash reporters can
      // attach them; replace these with your reporter's SDK call when wired.
      warn: (...args: LogArg[]): void => console.warn(...args),
      error: (...args: LogArg[]): void => console.error(...args),
    };
