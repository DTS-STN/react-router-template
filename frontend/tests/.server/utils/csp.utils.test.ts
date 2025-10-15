import { afterEach, describe, expect, it, vi } from 'vitest';

import { serverEnvironment } from '~/.server/environment';
import { adobeAnalyticsCSP, generateContentSecurityPolicy } from '~/.server/utils/csp.utils';

vi.mock('~/.server/environment', () => ({
  serverEnvironment: {
    NODE_ENV: undefined, // set in each test
  },
}));

describe('csp.utils', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateContentSecurityPolicy', () => {
    it('should generate a strict CSP', () => {
      vi.mocked(serverEnvironment).NODE_ENV = 'production';
      const nonce = '1234567890ABCDEF';
      const csp = generateContentSecurityPolicy(nonce);

      expect(csp).toContain(`base-uri 'none';`);
      expect(csp).toContain(`default-src 'none';`);
      expect(csp).toContain(`connect-src 'self' ${adobeAnalyticsCSP.connectSrc};`);
      expect(csp).toContain(`font-src 'self' fonts.gstatic.com use.fontawesome.com www.canada.ca;`);
      expect(csp).toContain(`frame-src 'self' ${adobeAnalyticsCSP.frameSrc};`);
      expect(csp).toContain(
        `img-src 'self' data: www.canada.ca ${adobeAnalyticsCSP.imgSrc} https://purecatamphetamine.github.io;`,
      );
      expect(csp).toContain(`script-src 'self' 'unsafe-inline' ${adobeAnalyticsCSP.scriptSrc}`);
      expect(csp).toContain(`style-src 'self' 'unsafe-inline'`);
    });

    it('should allow HMR websocket connections when NODE_ENV=development', () => {
      vi.mocked(serverEnvironment).NODE_ENV = 'development';

      const nonce = '1234567890ABCDEF';
      const csp = generateContentSecurityPolicy(nonce);

      expect(csp).toContain(`connect-src 'self' ${adobeAnalyticsCSP.connectSrc} ws://localhost:3001;`);
    });
  });
});
