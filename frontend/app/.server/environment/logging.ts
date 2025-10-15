import * as v from 'valibot';

import { maxFilesRegexSchema } from '~/.server/validation/max-files-regex-schema';
import { maxSizeRegexSchema } from '~/.server/validation/max-size-regex-schema';
import { stringToBooleanSchema } from '~/.server/validation/string-to-boolean-schema';

export type Logging = Readonly<v.InferOutput<typeof logging>>;

const isProduction = process.env.NODE_ENV === 'production';

export const logLevels = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  audit: 4,
  debug: 5,
  trace: 6,
} as const;

export type LogLevel = keyof typeof logLevels;

export const defaults = {
  LOG_LEVEL: isProduction ? 'info' : 'debug',
  LOG_AUDITING_ENABLED: isProduction ? 'true' : 'false',
  AUDIT_LOG_DIR_NAME: 'logs',
  AUDIT_LOG_FILE_NAME: 'audit-%DATE%',
  AUDIT_LOG_MAX_FILES: '14d',
  AUDIT_LOG_MAX_SIZE: '20m',
} as const;

export const logging = v.object({
  LOG_LEVEL: v.optional(v.picklist(Object.keys(logLevels) as LogLevel[]), defaults.LOG_LEVEL),
  LOG_AUDITING_ENABLED: v.optional(stringToBooleanSchema(), defaults.LOG_AUDITING_ENABLED),
  AUDIT_LOG_DIR_NAME: v.optional(v.pipe(v.string(), v.nonEmpty()), defaults.AUDIT_LOG_DIR_NAME),
  AUDIT_LOG_FILE_NAME: v.optional(v.pipe(v.string(), v.nonEmpty()), defaults.AUDIT_LOG_FILE_NAME),
  AUDIT_LOG_MAX_SIZE: v.optional(maxSizeRegexSchema(), defaults.AUDIT_LOG_MAX_SIZE),
  AUDIT_LOG_MAX_FILES: v.optional(maxFilesRegexSchema(), defaults.AUDIT_LOG_MAX_FILES),
});
