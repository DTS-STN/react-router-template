import type { RouteModule } from 'react-router';

import { describe, expect, it } from 'vitest';

import { getAltLanguage, getI18nNamespace, getLanguage, getLanguageFromAcceptLanguageHeader } from '~/utils/i18n-utils';

describe('i18n-utils', () => {
  describe('getI18nNamespace', () => {
    it('should return an empty namespace if no routes are provided', () => {
      expect(getI18nNamespace()).toEqual([]);
    });

    it('should return a unique namespace', () => {
      const routes: RouteModule[] = [
        { handle: { i18nNamespace: ['common', 'home'] } },
        { handle: { i18nNamespace: ['common', 'about'] } },
      ] as unknown as RouteModule[];

      expect(getI18nNamespace(routes)).toEqual(['common', 'home', 'about']);
    });

    it('should handle undefined i18nNamespace', () => {
      const routes: RouteModule[] = [
        { handle: { i18nNamespace: undefined } },
        { handle: undefined },
      ] as unknown as RouteModule[];

      expect(getI18nNamespace(routes)).toEqual([]);
    });
  });

  describe('getLanguage', () => {
    it.each([
      { input: 'http://example.com/en', expected: 'en' },
      { input: 'http://example.com/en/some-route', expected: 'en' },
      { input: 'http://example.com/fr', expected: 'fr' },
      { input: 'http://example.com/fr/some-route', expected: 'fr' },
      { input: 'http://example.com/some-route', expected: undefined },
    ])('should return $expected for request $input', ({ input, expected }) => {
      expect(getLanguage(new Request(input))).toEqual(expected);
    });

    it.each([
      { input: 'http://example.com/en', expected: 'en' },
      { input: 'http://example.com/en/some-route', expected: 'en' },
      { input: 'http://example.com/fr', expected: 'fr' },
      { input: 'http://example.com/fr/some-route', expected: 'fr' },
      { input: 'http://example.com/some-route', expected: undefined },
    ])('should return $expected for URL $input', ({ input, expected }) => {
      expect(getLanguage(new URL(input))).toEqual(expected);
    });

    it.each([
      { input: '/en', expected: 'en' },
      { input: '/en/some-route', expected: 'en' },
      { input: '/fr', expected: 'fr' },
      { input: '/fr/some-route', expected: 'fr' },
      { input: '/some-route', expected: undefined },
    ])('should return $expected for string $input', ({ input, expected }) => {
      expect(getLanguage(input)).toEqual(expected);
    });
  });

  describe('getAltLanguage', () => {
    it('should return the correct alternate language', () => {
      expect(getAltLanguage('en')).toEqual('fr');
      expect(getAltLanguage('fr')).toEqual('en');
    });
  });

  describe('getLanguageFromAcceptLanguageHeader', () => {
    it('should return the preferred supported language from Accept-Language header', () => {
      const requestEn = new Request('http://example.com/', {
        headers: { 'accept-language': 'en-US,en;q=0.9' },
      });
      expect(getLanguageFromAcceptLanguageHeader(requestEn)).toEqual('en');

      const requestFr = new Request('http://example.com/', {
        headers: { 'accept-language': 'fr-CA,fr;q=0.9,en;q=0.8' },
      });
      expect(getLanguageFromAcceptLanguageHeader(requestFr)).toEqual('fr');
    });

    it('should return the highest quality supported language', () => {
      const request = new Request('http://example.com/', {
        headers: { 'accept-language': 'es;q=0.9,fr;q=0.8,en;q=0.7' },
      });
      expect(getLanguageFromAcceptLanguageHeader(request)).toEqual('fr');
    });

    it('should return undefined when no supported language is found', () => {
      const request = new Request('http://example.com/', {
        headers: { 'accept-language': 'es,de,it' },
      });
      expect(getLanguageFromAcceptLanguageHeader(request)).toBeUndefined();
    });

    it('should return undefined when no Accept-Language header is present', () => {
      const request = new Request('http://example.com/');
      expect(getLanguageFromAcceptLanguageHeader(request)).toBeUndefined();
    });

    it('should handle complex Accept-Language headers', () => {
      const request = new Request('http://example.com/', {
        headers: { 'accept-language': 'en-US,en;q=0.9,fr-CA;q=0.8,fr;q=0.7,de;q=0.6' },
      });
      expect(getLanguageFromAcceptLanguageHeader(request)).toEqual('en');
    });
  });
});
