/**
 * This module provides utility functions for telemetry and metrics collection using OpenTelemetry.
 * It includes functions for creating counters, handling exceptions within spans, and wrapping
 * functions in spans for tracing. It also includes helper functions for extracting error
 * information and managing telemetry attributes.
 */
import { invariant } from '@dts-stn/invariant';
import type { Attributes, Context, Counter, Span } from '@opentelemetry/api';
import { metrics, SpanStatusCode, trace } from '@opentelemetry/api';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions/incubating';

import { serverEnvironment } from '~/.server/environment';
import { isAppError } from '~/errors/app-error';

/**
 * Returns an OpenTelemetry counter with the given name and some default attributes added.
 */
export function createCounter(name: string): Counter {
  const counter = metrics
    .getMeter(serverEnvironment.OTEL_SERVICE_NAME, serverEnvironment.OTEL_SERVICE_VERSION)
    .createCounter(name);

  const baseAttributes = {
    // add some base attributes to all metrics so we can split by them in the metrics dashboard
    // (for some reason, OpenTelemetry doesn't add these attributes automatically)
    [ATTR_SERVICE_NAME]: serverEnvironment.OTEL_SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: serverEnvironment.OTEL_SERVICE_VERSION,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: serverEnvironment.OTEL_ENVIRONMENT_NAME,
  };

  return {
    add: (value: number, attributes?: Attributes, context?: Context) => {
      return counter.add(value, { ...baseAttributes, ...attributes }, context);
    },
  };
}

/**
 * Records an exception in the given span.
 * If the error is a coded error, it will include the code in the exception.
 *
 * @returns The original error.
 */
export function handleSpanException(error: unknown, span?: Span) {
  if (!isResponse(error)) {
    span?.setAttribute('correlationId', getCorrelationId(error) ?? 'N/A');

    span?.recordException({
      name: getName(error),
      message: getMessage(error),
      code: getErrorCode(error),
      stack: getStack(error),
    });

    span?.setStatus({
      code: SpanStatusCode.ERROR,
      message: getMessage(error),
    });
  }

  return error;
}

/**
 * Wraps the given function in a span.
 * If an error occurs, it will be recorded in the span.
 * Route errors are excluded from span recording.
 */
export async function withSpan<T>(spanName: string, fn: (span: Span) => Promise<T> | T): Promise<T> {
  const tracer = trace.getTracer(serverEnvironment.OTEL_SERVICE_NAME, serverEnvironment.OTEL_SERVICE_VERSION);
  const span = tracer.startSpan(spanName);

  try {
    return await fn(span);
  } catch (error) {
    throw handleSpanException(error, span);
  } finally {
    span.end();
  }
}

/**
 * A helper function that will count the number of successful or
 * failed requests by examining the http status.
 */
export function countHttpStatus(prefix: string, httpStatus: number): void {
  invariant(httpStatus > 0, 'httpStatus must be a positive integer');

  const sanitizedPrefix = sanitizeMetricName(prefix);
  createCounter(`${sanitizedPrefix}.requests.status.${httpStatus}`).add(1);
  createCounter(`${sanitizedPrefix}.requests.status.${httpStatus >= 400 ? 'failed' : 'success'}`).add(1);
}

function getErrorCode(error: unknown): string | undefined {
  if (isAppError(error)) {
    return error.errorCode;
  }
}

function getCorrelationId(error: unknown): string | undefined {
  if (isAppError(error)) {
    return error.correlationId;
  }
}

function getMessage(error: unknown): string | undefined {
  if (isError(error)) {
    return error.message;
  }

  if (isAppError(error)) {
    return error.msg;
  }
}

function getName(error: unknown): string {
  if (isError(error) || isAppError(error)) {
    return error.name;
  }

  return String(error);
}

function getStack(error: unknown): string | undefined {
  if (isError(error) || isAppError(error)) {
    return error.stack;
  }
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function isResponse(error: unknown): error is Response {
  return error instanceof Response;
}

/**
 * Sanitizes a metric name to follow OpenTelemetry's naming rules:
 * See https://opentelemetry.io/docs/specs/otel/metrics/api/#instrument-name-syntax.
 *
 * Invalid characters are removed, leading non-letters are stripped,
 * and the name is trimmed to 255 characters. A warning is logged if sanitization occurs.
 *
 * @param metricName The raw metric name.
 * @returns A sanitized metric name.
 */
function sanitizeMetricName(metricName: string): string {
  const METRIC_NAME_REGEX = /^[a-z][a-z0-9_.\-/]{0,254}$/i;

  if (METRIC_NAME_REGEX.test(metricName)) {
    return metricName;
  }

  const sanitized = metricName
    .replaceAll(/[^a-zA-Z0-9_.\-/]/g, '_') // Replace all invalid characters with `_`
    .replace(/^[^a-zA-Z]+/, ''); // Strip leading non-[a-z] chars

  const trimmed = sanitized.slice(0, 255);
  //log.warn(`Invalid metric name "${metricName}". Sanitized to "${trimmed}"`);
  return trimmed;
}
