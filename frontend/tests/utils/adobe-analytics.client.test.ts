import { afterEach, describe, expect, it, vi } from 'vitest';

import { pushErrorEvent, pushPageviewEvent } from '~/utils/adobe-analytics.client';

/*
 * @vitest-environment jsdom
 */

describe('adobe-analytics', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('pushErrorEvent', () => {
    const originalAdobeDataLayer = window.adobeDataLayer;

    afterEach(() => {
      window.adobeDataLayer = originalAdobeDataLayer;
      vi.restoreAllMocks();
    });

    it('does not send an event if window.adobeDataLayer is not defined', () => {
      const spyConsoleWarnSpy = vi.spyOn(console, 'warn').mockImplementationOnce(() => {});

      pushErrorEvent(404);

      expect(spyConsoleWarnSpy).toHaveBeenCalledWith(
        'window.adobeDataLayer is not defined. This could mean your adobe analytics script has not loaded on the page yet.',
      );
    });

    it('sends a pushErrorEvent event with the correct pushErrorEvent status code', () => {
      window.adobeDataLayer = { push: vi.fn() };

      pushErrorEvent(404);

      expect(window.adobeDataLayer.push).toHaveBeenCalledWith({
        event: 'error',
        error: { name: '404' },
      });
    });
  });

  describe('pushPageviewEvent', () => {
    const originalAdobeDataLayer = window.adobeDataLayer;

    afterEach(() => {
      window.adobeDataLayer = originalAdobeDataLayer;
      vi.restoreAllMocks();
    });

    it('does not send an event if window.adobeDataLayer is not defined', () => {
      const spyConsoleWarnSpy = vi.spyOn(console, 'warn').mockImplementationOnce(() => {});

      pushPageviewEvent('https://www.example.com');

      expect(spyConsoleWarnSpy).toHaveBeenCalledWith(
        'window.adobeDataLayer is not defined. This could mean your adobe analytics script has not loaded on the page yet.',
      );
    });

    it('sends a pageLoad event with the correct URL', () => {
      window.adobeDataLayer = { push: vi.fn() };

      pushPageviewEvent('https://www.example.com/about-us');

      expect(window.adobeDataLayer.push).toHaveBeenCalledWith({
        event: 'pageLoad',
        page: { url: 'www.example.com/about-us' },
      });
    });
  });
});
