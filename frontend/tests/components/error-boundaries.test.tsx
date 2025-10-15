import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import {
  BilingualErrorBoundary,
  BilingualNotFound,
  UnilingualErrorBoundary,
  UnilingualNotFound,
} from '~/components/error-boundaries';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/utils/http-status-codes';

vi.mock('~/utils/adobe-analytics.client');

describe('error-boundaries', () => {
  globalThis.__appEnvironment = mock({
    MSCA_BASE_URL: 'https://msca.example.com/',
  });

  describe('BilingualErrorBoundary', () => {
    it('should correctly render the bilingual error boundary when it catches a generic error', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const RoutesStub = createRoutesStub([
        {
          path: '/',
          Component: () => <BilingualErrorBoundary params={{}} error={new Error('Something went wrong')} />,
        },
      ]);

      render(<RoutesStub />);

      expect(document.documentElement).toMatchSnapshot('expected html 1');
    });

    it('should correctly render the bilingual error boundary when it catches an AppError', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const RoutesStub = createRoutesStub([
        {
          path: '/',
          Component: () => (
            <BilingualErrorBoundary
              params={{}}
              error={new AppError('Something went wrong', ErrorCodes.UNCAUGHT_ERROR, { correlationId: 'XX-000000' })}
            />
          ),
        },
      ]);

      render(<RoutesStub />);

      expect(document.documentElement).toMatchSnapshot('expected html 1');
    });
  });

  describe('BilingualNotFound', () => {
    globalThis.__appEnvironment = mock({
      MSCA_BASE_URL: 'https://msca.example.com/',
    });

    it('should correctly render the bilingual 404 when it catches a 404 error', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const RoutesStub = createRoutesStub([
        {
          path: '/',
          Component: () => (
            <BilingualNotFound params={{}} error={new Response('Not found', { status: HttpStatusCodes.NOT_FOUND })} />
          ),
        },
      ]);

      render(<RoutesStub />);

      expect(document.documentElement).toMatchSnapshot('expected html 1');
    });
  });

  describe('UnilingualErrorBoundary', () => {
    globalThis.__appEnvironment = mock({
      MSCA_BASE_URL: 'https://msca.example.com/',
    });

    it('should correctly render the unilingual error boundary when it catches a generic error', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const RoutesStub = createRoutesStub([
        {
          path: '/en',
          Component: () => <UnilingualErrorBoundary params={{}} error={new Error('Something went wrong')} />,
        },
      ]);

      render(<RoutesStub initialEntries={['/en']} />);

      expect(document.documentElement).toMatchSnapshot('expected html 1');
    });

    it('should correctly render the unilingual error boundary when it catches an AppError', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const RoutesStub = createRoutesStub([
        {
          path: '/en',
          Component: () => (
            <UnilingualErrorBoundary
              params={{}}
              error={new AppError('Something went wrong', ErrorCodes.UNCAUGHT_ERROR, { correlationId: 'XX-000000' })}
            />
          ),
        },
      ]);

      render(<RoutesStub initialEntries={['/en']} />);

      expect(document.documentElement).toMatchSnapshot('expected html 1');
    });
  });

  describe('UnilingualNotFound', () => {
    globalThis.__appEnvironment = mock({
      MSCA_BASE_URL: 'https://msca.example.com/',
    });

    it('should correctly render the unilingual 404 when it catches a 404 error', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const RoutesStub = createRoutesStub([
        {
          path: '/',
          Component: () => (
            <UnilingualNotFound params={{}} error={new Response('Not found', { status: HttpStatusCodes.NOT_FOUND })} />
          ),
        },
      ]);

      render(<RoutesStub />);

      expect(document.documentElement).toMatchSnapshot('expected html 1');
    });
  });
});
