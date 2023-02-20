import chalk, { Chalk } from 'chalk';
import { logger } from 'firebase-functions';

type LogLevel = 'debug' | 'error' | 'info' | 'warning';

const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

const loggerMap: Record<LogLevel, (...arg: any[]) => void> = {
  info: isEmulator ? console.info : logger.info,
  debug: isEmulator ? console.debug : logger.debug,
  error: isEmulator ? console.error : logger.error,
  warning: isEmulator ? console.warn : logger.warn,
};

export const UNEXPECTED_TYPE = 'Unexpected';

export const logWarning = (
  type: string,
  message: string | Record<string, unknown>
) => {
  logHelper(type, message, 'warning', chalk.yellow);
};
export const logInfo = (
  type: string,
  message: string | Record<string, unknown>
) => {
  logHelper(type, message, 'info', chalk.blue);
};
export const logError = (
  type: string,
  message: string | Record<string, unknown>
) => {
  logHelper(type, message, 'error', chalk.red);
};

export const logDebug = (
  type: string,
  message: string | Record<string, unknown>
) => {
  logHelper(type, message, 'debug', chalk.magenta);
};

const logHelper = (
  from: string,
  message: string | Record<string, unknown>,
  logLevel: LogLevel,
  chalkColor: Chalk
) => {
  let levelStr = `[${logLevel[0].toUpperCase()}]`;
  levelStr = isEmulator ? chalkColor(levelStr) : levelStr;
  const timeStr = isEmulator ? `${new Date().toLocaleTimeString()}: ` : '';

  loggerMap[logLevel](`${timeStr}${levelStr} ${from} | ${message}`);
};
