import { redirect } from 'react-router';

import type { Route } from './+types/logout';

import { getRaoidcClient } from '~/.server/auth/raoidc-client';
import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { withSpan } from '~/.server/utils/telemetry-utils';

const log = LogFactory.getLogger(import.meta.url);

/**
 * Allows errors to be handled by root.tsx
 */
export default function Logout() {
  return <></>;
}

export function loader({ context, params, request }: Route.LoaderArgs) {
  return handleLogout({ context, params, request });
}

function handleLogout({ context, params, request }: Route.LoaderArgs): Promise<Response> {
  return withSpan('routes.auth.logout.handle_logout', async (span) => {
    const { session } = context;
    const currentUrl = new URL(request.url);

    span.setAttribute('request_url', currentUrl.toString());

    if (!session.authState?.idTokenClaims) {
      log.debug(`User has not authenticated; bypassing RAOIDC logout and redirecting to RASCL logout`);
      span.addEvent('invalid_auth_state');
      return redirect(serverEnvironment.AUTH_RAOIDC_RASCL_LOGOUT_URL);
    }

    const raoidcClient = await getRaoidcClient();

    const signoutRequest = raoidcClient.generateSignoutRequest(
      session.authState.idTokenClaims.sub,
      currentUrl.searchParams.get('lang') ?? 'en',
    );

    delete session.authState;
    delete session.loginState;
    delete session.stubloginState;

    return redirect(signoutRequest.toString());
  });
}
