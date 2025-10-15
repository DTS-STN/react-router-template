import { trace } from '@opentelemetry/api';
import type { RequestHandler } from 'express';
import sessionMiddleware from 'express-session';
import { minimatch } from 'minimatch';
import morganMiddleware from 'morgan';
import { randomUUID } from 'node:crypto';

import type { ServerEnvironment } from '~/.server/environment';
import { serverEnvironment } from '~/.server/environment';
import { createMemoryStore, createRedisStore } from '~/.server/express/session';
import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);

/**
 * Checks if a given path should be ignored based on a list of ignore patterns.
 *
 * @param ignorePatterns - An array of glob patterns to match against the path.
 * @param path - The path to check.
 * @returns - True if the path should be ignored, false otherwise.
 */
function shouldIgnore(ignorePatterns: string[], path: string): boolean {
  return ignorePatterns.some((entry) => minimatch(path, entry));
}

/**
 * Sets various caching headers to ensure sensitive user data is not cached by the browser.
 */
export function caching(environment: ServerEnvironment): RequestHandler {
  const ignorePatterns: string[] = [
    '/api/client-env', //
    '/api/translations',
  ];

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping adding cache-busting headers to response: [%s]', request.path);
      return next();
    }

    log.trace('Adding cache-busting headers to response');
    response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.setHeader('Expires', '0');
    response.setHeader('Pragma', 'no-cache');
    next();
  };
}

/**
 * Configures a logging middleware with appropriate format and filtering.
 */
export function logging(environment: ServerEnvironment): RequestHandler {
  const ignorePatterns = [
    '/__manifest', //
    '/api/readyz',
    '/assets/**',
    '/favicon.ico',
  ];

  const logFormat = environment.isProduction ? 'tiny' : 'dev';

  const middleware = morganMiddleware(logFormat, {
    stream: {
      write: (str) => {
        if (serverEnvironment.LOG_AUDITING_ENABLED) log.audit(str.trim());
      },
    },
  });

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      // we're intentionally NOT logging the "skipping logging"
      // message like the other middlewares do here 🥸🧠
      return next();
    }

    return middleware(request, response, next);
  };
}

/**
 * Sets various security headers to protect the application.
 */
export function security(environment: ServerEnvironment): RequestHandler {
  const ignorePatterns: string[] = [
    /* intentionally left blank */
  ];

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping adding security headers to response: [%s]', request.path);
      return next();
    }

    const permissionsPolicy = [
      'camera=()',
      'display-capture=()',
      'fullscreen=()',
      'geolocation=()',
      'interest-cohort=()',
      'microphone=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
    ].join(', ');

    log.trace('Adding security headers to response');
    response.setHeader('Permissions-Policy', permissionsPolicy);
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Server', 'webserver');
    response.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'deny');
    next();
  };
}

/**
 * Configures session middleware, optionally skipping it for bots and specific paths.
 */
export function session(environment: ServerEnvironment): RequestHandler {
  const ignorePatterns = ['/__manifest', '/api/**'];

  const {
    isProduction,
    SESSION_TYPE,
    SESSION_COOKIE_DOMAIN,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_PATH,
    SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECRET,
    SESSION_COOKIE_SECURE,
  } = environment;

  const sessionStore =
    SESSION_TYPE === 'redis' //
      ? createRedisStore(environment)
      : createMemoryStore();

  const middleware = sessionMiddleware({
    store: sessionStore,
    name: SESSION_COOKIE_NAME,
    secret: [SESSION_COOKIE_SECRET.value()],
    genid: () => randomUUID(),
    proxy: true,
    resave: false,
    rolling: true,
    saveUninitialized: false,
    cookie: {
      domain: SESSION_COOKIE_DOMAIN,
      path: SESSION_COOKIE_PATH,
      secure: SESSION_COOKIE_SECURE ? isProduction : false,
      httpOnly: true,
      sameSite: SESSION_COOKIE_SAMESITE,
    },
  });

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping session: [%s]', request.path);
      return next();
    }

    return middleware(request, response, next);
  };
}

/**
 * Confitures the tracing middleware that adds information to the active span for each request.
 */
export function tracing(): RequestHandler {
  const ignorePatterns: string[] = [
    /* intentionally left blank */
  ];

  return (request, response, next) => {
    if (shouldIgnore(ignorePatterns, request.path)) {
      log.trace('Skipping tracing: [%s]', request.path);
      return next();
    }

    const span = trace.getActiveSpan();

    const { pathname } = new URL(request.url, 'http://localhost:3000/');
    const spanName = `${request.method} ${pathname}`;
    log.trace('Updating span name to match request: [%s]', spanName);
    span?.updateName(spanName);

    return next();
  };
}
