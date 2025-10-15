import * as v from 'valibot';
import { assert, describe, expect, it } from 'vitest';

import { validUrlSchema } from '~/validation/valid-url-schema';

describe('validUrlSchema', () => {
  it('should parse google url successfully', () => {
    const schema = validUrlSchema();
    const result = v.safeParse(schema, 'http://google.com');
    assert(result.success === true);
    expect(result.output).toBe('http://google.com');
  });

  it('should fail to parse invalid-url', () => {
    const schema = validUrlSchema();
    const result = v.safeParse(schema, 'invalid-url');
    assert(result.success === false);
  });
});
