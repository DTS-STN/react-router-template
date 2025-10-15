import * as v from 'valibot';

/**
 * Creates a Valibot schema to validate a string representing
 * a file size.
 *
 * The input string will be compared against the string representations
 * of max number of files or days (eg. 14 or 14d) and return the string if valid.
 *
 * @returns {v.GenericSchema<string, string>} A Valibot schema that validates
 * a string representing a url.
 *
 * Example usage:
 * ```ts
 * import * as v from 'valibot';
 *
 * const result = v.parse(validUrlSchema(), 'http://google.com'); // returns http://google.com
 *
 */
export function validUrlSchema(): v.GenericSchema<string, string> {
  return v.pipe(v.string(), v.url());
}
