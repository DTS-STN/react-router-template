import { redirect } from 'react-router';

import type { Route } from './+types/login';

import { getRaoidcClient } from '~/.server/auth/raoidc-client';
import { serverEnvironment } from '~/.server/environment';
import { withSpan } from '~/.server/utils/telemetry-utils';
import { HttpStatusCodes } from '~/utils/http-status-codes';

/**
 * Allows errors to be handled by root.tsx
 */
export default function Login() {
  return <></>;
}

/**
 * Handles RAOIDC authentication login.
 */
export async function loader({ context, params, request }: Route.LoaderArgs): Promise<Response> {
  return handleLogin({ context, params, request });
}

function handleLogin({ context, params, request }: Route.LoaderArgs): Promise<Response> {
  return withSpan('routes.auth.callback.handle_login', async (span) => {
    const { session } = context;
    const currentUrl = new URL(request.url);
    const returnTo = currentUrl.searchParams.get('returnto');

    span.setAttribute('request_url', currentUrl.toString());
    span.setAttribute('returnto', returnTo ?? 'not_provided');

    if (returnTo && !returnTo.startsWith('/')) {
      span.addEvent('returnto.invalid');
      return Response.json('Invalid returnto path', { status: HttpStatusCodes.BAD_REQUEST });
    }

    span.addEvent('generate_signin_request.start');

    const raoidcClient = await getRaoidcClient();
    const returnUrl = returnTo ? new URL(returnTo, currentUrl.origin) : undefined;

    const { authUrl, codeVerifier, nonce, state } = raoidcClient.generateSigninRequest(
      new URL('/auth/callback', currentUrl.origin),
    );

    if (serverEnvironment.AUTH_ENABLE_STUB_LOGIN) {
      const requestedSin = currentUrl.searchParams.get('sin');
      if (requestedSin) authUrl.searchParams.set('sin', requestedSin);
    }

    span.addEvent('generate_signin_request.end');

    session.loginState = {
      codeVerifier,
      nonce,
      returnUrl,
      state,
    };

    session.stubloginState = {
      birthdate: currentUrl.searchParams.get('birthdate') ?? undefined,
      locale: currentUrl.searchParams.get('locale') ?? undefined,
      sin: currentUrl.searchParams.get('sin') ?? undefined,
    };

    return redirect(authUrl.toString());
  });
}
