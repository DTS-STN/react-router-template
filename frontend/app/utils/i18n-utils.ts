import type { RouteModule } from 'react-router';

import type { Namespace } from 'i18next';

/**
 * Returns the i81n namespace required by the given routes by examining the route's i18nNamespace handle property.
 * @see https://reactrouter.com/start/framework/route-module#handle
 */
export function getI18nNamespace(routes?: RouteModule[]): Namespace {
  const i18nNamespace = routes?.flatMap((route) => route.handle?.i18nNamespace ?? []);
  return Array.from(new Set(i18nNamespace));
}

/**
 * Returns the language from the given request, URL, or path.
 *
 * @param resource - The request, URL, or path to extract the language from.
 * @returns The language code (`en` or `fr`), or `undefined` if the language cannot be determined.
 */
export function getLanguage(resource: Request | URL | string): Language | undefined {
  switch (true) {
    case resource instanceof Request: {
      return getLanguageFromPath(new URL(resource.url).pathname) ?? getLanguageFromAcceptLanguageHeader(resource);
    }

    case resource instanceof URL: {
      return getLanguageFromPath(resource.pathname);
    }

    default: {
      return getLanguageFromPath(resource);
    }
  }
}

/**
 * Returns the alternate language for the given input language.
 * (ie: 'en' → 'fr'; 'fr' → 'en')
 */
export function getAltLanguage(language: Language): Language {
  return language === 'fr' ? 'en' : 'fr';
}

function getLanguageFromPath(pathname: string): Language | undefined {
  switch (true) {
    case pathname === '/en' || pathname.startsWith('/en/'): {
      return 'en';
    }

    case pathname === '/fr' || pathname.startsWith('/fr/'): {
      return 'fr';
    }

    default: {
      return undefined;
    }
  }
}

/**
 * Extracts the preferred supported language from the Accept-Language header.
 *
 * @param request - The incoming request containing the Accept-Language header
 * @returns The preferred language code ('en' or 'fr'), or undefined if no supported language is found
 */
export function getLanguageFromAcceptLanguageHeader(request: Request): Language | undefined {
  const acceptLanguage = request.headers.get('accept-language');

  // Parse the Accept-Language header and extract language codes with their quality values
  const languages = acceptLanguage
    ?.split(',')
    .map((lang) => lang.trim().split(';q='))
    .filter(([code]) => Boolean(code))
    .map(([code, qValue]) => ({
      language: code?.split('-')[0]?.toLowerCase() ?? '',
      quality: qValue ? parseFloat(qValue) : 1.0,
    }))
    .filter(({ language }) => language)
    .toSorted((a, b) => b.quality - a.quality);

  // Find the first supported language (en or fr)
  for (const { language } of languages ?? []) {
    if (language === 'en' || language === 'fr') {
      return language;
    }
  }
}
