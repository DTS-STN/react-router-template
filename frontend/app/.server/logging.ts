/**
 * This module provides a centralized logging configuration for the application.
 * It uses the `winston` library to create and manage loggers, allowing for
 * structured logging with various levels (none, error, warn, info, audit, debug, trace).
 * The module supports console logging and includes features for formatting log messages,
 * handling exceptions and rejections, and dynamically adjusting the log level based on
 * environment variables. It also provides a factory for creating and retrieving logger
 * instances for different categories within the application.
 */
import os from 'node:os';
import util from 'node:util';
import * as v from 'valibot';
import type * as w from 'winston';
import winston, { format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { fullFormat } from 'winston-error-format';

import { logging, logLevels } from './environment/logging';

import { preprocess } from '~/utils/validation-utils';

const consoleTransport = new transports.Console({
  handleExceptions: true,
  handleRejections: true,
});

// Note: the logging config is not read from `serverEnvironment` because it needs to be available before the serverEnvironment is parsed.
const loggingConfig = v.parse(logging, preprocess(process.env));

export const LogFactory = {
  /**
   * Gets a logger instance for the specified category.
   *
   * Creates a new logger instance with a configured format and console transport if it doesn't exist for the provided category.
   * Otherwise, retrieves the existing logger.
   */
  getLogger: (category: string): w.Logger => {
    if (winston.loggers.has(category)) {
      return winston.loggers.get(category);
    }

    // accommodate the extra uncaughtException and unhandledRejection listeners used by the console transport
    // This fixes the following warnigns that are logged by nodejs: MaxListenersExceededWarning: Possible EventEmitter memory leak detected
    // see: https://github.com/winstonjs/winston/blob/v3.17.0/lib/winston/exception-handler.js#L51
    // see: https://github.com/winstonjs/winston/blob/v3.17.0/lib/winston/rejection-handler.js#L51
    const maxListeners = process.getMaxListeners();
    process.setMaxListeners(maxListeners + 2);

    const logger = winston.loggers.add(category, {
      level: loggingConfig.LOG_LEVEL,
      levels: logLevels,
      format: format.combine(
        format.label({ label: category }),
        format.timestamp(),
        format.splat(),
        fullFormat({ stack: true }),
        format.printf(asFormattedInfo),
      ),
      transports: [consoleTransport],
    });

    if (loggingConfig.LOG_AUDITING_ENABLED) {
      const dailyRotateFileTransport = new DailyRotateFile({
        level: 'audit',
        dirname: loggingConfig.AUDIT_LOG_DIR_NAME,
        filename: loggingConfig.AUDIT_LOG_FILE_NAME,
        format: format.printf((info) => `${info.message}`),
        extension: `_${os.hostname()}.log`,
        utc: true,
        maxSize: loggingConfig.AUDIT_LOG_MAX_SIZE,
        maxFiles: loggingConfig.AUDIT_LOG_MAX_FILES,
      });
      logger.add(dailyRotateFileTransport);
    }

    logger.trace('process.maxListeners increased to %s', process.getMaxListeners());

    return logger;
  },
};

/**
 * Formats a log message for output.
 *
 * This function takes a Logform.TransformableInfo object and returns a formatted string.
 * The formatted string includes the timestamp, level, label, message, and any additional metadata.
 */
function asFormattedInfo(transformableInfo: w.Logform.TransformableInfo): string {
  const { label, level, message, timestamp, ...rest } = transformableInfo;
  const formattedInfo = `${timestamp} ${level.toUpperCase().padStart(7)} --- [${formatLabel(`${label}`, 25)}]: ${message}`;
  const sanitizedRest = Object.fromEntries(Object.entries(rest).filter(([key]) => typeof key !== 'symbol'));
  return isEmpty(sanitizedRest) ? formattedInfo : `${formattedInfo} --- ${util.inspect(sanitizedRest, false, null, true)}`;
}

/**
 * Checks if an object is empty.
 *
 * @param obj - The object to check.
 * @returns `true` if the object is empty, `false` otherwise.
 */
function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Formats a label string to a specified size.
 * If the label is longer than the specified size, it truncates the label and adds an ellipsis (...) at the beginning.
 */
function formatLabel(label: string, size: number): string {
  return label.length > size ? `…${label.slice(-size + 1)}` : label.padStart(size);
}
