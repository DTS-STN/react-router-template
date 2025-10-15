import * as v from 'valibot';

/**
 * Creates a Valibot schema to validate a string representing
 * a file size.
 *
 * The input string will be compared against the string representations
 * of file sizes (eg. 20m or 20g or 20k) and return the string if valid.
 *
 * @returns {v.GenericSchema<string, string>} A Valibot schema that validates
 * a file size string.
 *
 * Example usage:
 * ```ts
 * import * as v from 'valibot';
 *
 * const result = v.parse(stringToBooleanSchema(), '20m'); // returns 20m
 *
 */
export function maxSizeRegexSchema(): v.GenericSchema<string, string> {
  return v.pipe(v.string(), v.trim(), v.nonEmpty(), v.regex(/^\d+[kmg]{0,1}$/));
}
