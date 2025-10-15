import * as v from 'valibot';

import { stringToBooleanSchema } from '~/.server/validation/string-to-boolean-schema';
import { stringToIntegerSchema } from '~/.server/validation/string-to-integer-schema';
import { isValidTimeZone } from '~/utils/date-utils';
import { validUrlSchema } from '~/validation/valid-url-schema';

export type Client = Readonly<v.InferOutput<typeof client>>;

export const defaults = {
  ADOBE_ANALYTICS_JQUERY_SRC: 'https://code.jquery.com/jquery-3.7.1.min.js',
  BASE_TIMEZONE: 'Canada/Eastern',
  BUILD_DATE: '1970-01-01T00:00:00.000Z',
  BUILD_ID: '000000',
  BUILD_REVISION: '00000000',
  BUILD_VERSION: '0.0.0-000000-00000000',
  I18NEXT_DEBUG: 'false',
  SESSION_TIMEOUT_PROMPT_SECONDS: (5 * 60).toString(),
  SESSION_TIMEOUT_SECONDS: (19 * 60).toString(),
  MSCA_BASE_URL: 'http://localhost:3000',
  ECAS_BASE_URL: 'http://localhost:3000',
} as const;

/**
 * Environment variables that are safe to expose publicly to the client.
 * ⚠️ IMPORTANT: DO NOT PUT SENSITIVE CONFIGURATIONS HERE ⚠️
 */
export const client = v.object({
  ADOBE_ANALYTICS_SRC: v.optional(validUrlSchema()),
  ADOBE_ANALYTICS_JQUERY_SRC: v.optional(validUrlSchema(), defaults.ADOBE_ANALYTICS_JQUERY_SRC),
  BASE_TIMEZONE: v.optional(v.pipe(v.string(), v.check(isValidTimeZone)), defaults.BASE_TIMEZONE),
  BUILD_DATE: v.optional(v.string(), defaults.BUILD_DATE),
  BUILD_ID: v.optional(v.string(), defaults.BUILD_ID),
  BUILD_REVISION: v.optional(v.string(), defaults.BUILD_REVISION),
  BUILD_VERSION: v.optional(v.string(), defaults.BUILD_VERSION),
  I18NEXT_DEBUG: v.optional(stringToBooleanSchema(), defaults.I18NEXT_DEBUG),
  SESSION_TIMEOUT_PROMPT_SECONDS: v.optional(stringToIntegerSchema(), defaults.SESSION_TIMEOUT_PROMPT_SECONDS),
  SESSION_TIMEOUT_SECONDS: v.optional(stringToIntegerSchema(), defaults.SESSION_TIMEOUT_SECONDS),
  isProduction: v.boolean(),
  MSCA_BASE_URL: v.optional(v.string(), defaults.MSCA_BASE_URL),
  ECAS_BASE_URL: v.optional(v.string(), defaults.ECAS_BASE_URL),
});
