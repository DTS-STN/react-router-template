/**
 * This module provides utility functions for handling user authentication and authorization. It includes functions for
 * enforcing required authentication and redirecting unauthenticated users to the login page. It also defines types for
 * authenticated sessions and utilizes the logging module for logging authentication-related events.
 */
import { redirect } from 'react-router';

import { getRaoidcClient } from '~/.server/auth/raoidc-client';
import { LogFactory } from '~/.server/logging';

const log = LogFactory.getLogger(import.meta.url);

/**
 * Represents an authenticated session by extending the base `SessionData` type.
 * This type ensures that the `authState` property is non-nullable.
 */
export type AuthenticatedSession = AppSession & {
  authState: NonNullable<AppSession['authState']>;
};

/**
 * Requires that the user be authenticated.
 * Will redirect to the login page if the user is not authenticated.
 */
export async function requireAuth(session: AppSession, request: Request): Promise<NonNullable<AppSession['authState']>> {
  const { pathname, search } = new URL(request.url);

  if (!session.authState) {
    log.debug('User is not authenticated; redirecting to login page');
    throw redirect(`/auth/login?returnto=${pathname}${search}`);
  }

  const idTokenClaims = session.authState.idTokenClaims;

  const raoidcClient = await getRaoidcClient();
  const isValid = await raoidcClient.handleValidationRequest(idTokenClaims.sid);

  if (!isValid) {
    log.debug('RAOIDC session has expired; redirecting to login page');
    throw redirect(`/auth/login?returnto=${pathname}${search}`);
  }

  return session.authState;
}
