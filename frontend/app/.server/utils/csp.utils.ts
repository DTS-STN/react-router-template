import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';

export const adobeAnalyticsCSP = {
  connectSrc: 'https://*.demdex.net https://cm.everesttech.net https://assets.adobedtm.com https://*.omtrdc.net',
  frameSrc: 'https://*.demdex.net',
  imgSrc: 'https://*.demdex.net https://cm.everesttech.net https://assets.adobedtm.com https://*.omtrdc.net',
  scriptSrc: 'https://code.jquery.com https://*.demdex.net https://cm.everesttech.net https://assets.adobedtm.com',
} as const;

/**
 * Generate a strict content security policy.
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
 */
export function generateContentSecurityPolicy(nonce: string) {
  const log = LogFactory.getLogger('csp-utils.server/generateContentSecurityPolicy');
  const { NODE_ENV } = serverEnvironment;
  const isDevelopment = NODE_ENV === 'development';

  const contentSecurityPolicy = [
    `base-uri 'none'`,
    `default-src 'none'`,
    `connect-src 'self' ${adobeAnalyticsCSP.connectSrc}` + (isDevelopment ? ' ws://localhost:3001' : ''),
    `font-src 'self' fonts.gstatic.com use.fontawesome.com www.canada.ca`,
    `form-action 'self'`,
    `frame-ancestors 'self'`,
    `frame-src 'self' ${adobeAnalyticsCSP.frameSrc}`,
    `img-src 'self' data: www.canada.ca ${adobeAnalyticsCSP.imgSrc} https://purecatamphetamine.github.io`,
    `object-src data:`,
    `script-src 'self' 'unsafe-inline' ${adobeAnalyticsCSP.scriptSrc} ${nonce}`,
    // NOTE: unsafe-inline is required by Radix Primitives 💩
    // see https://github.com/radix-ui/primitives/discussions/3130
    `style-src 'self' 'unsafe-inline' fonts.googleapis.com use.fontawesome.com www.canada.ca`,
  ].join('; ');

  log.trace(`Generated content security policy: [${contentSecurityPolicy}]`);
  return contentSecurityPolicy;
}
