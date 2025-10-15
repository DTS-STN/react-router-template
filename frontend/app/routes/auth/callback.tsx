import { redirect } from 'react-router';

import type { Route } from './+types/callback';

import { getRaoidcClient } from '~/.server/auth/raoidc-client';
import { serverEnvironment } from '~/.server/environment';
import { withSpan } from '~/.server/utils/telemetry-utils';
import { HttpStatusCodes } from '~/utils/http-status-codes';

/**
 * Allows errors to be handled by root.tsx
 */
export default function Callback() {
  return <></>;
}

/**
 * Handles the authentication callback for a given provider.
 */
export async function loader({ context, params, request }: Route.LoaderArgs) {
  return handleCallback({ context, params, request });
}

function handleCallback({ context, params, request }: Route.LoaderArgs): Promise<Response> {
  return withSpan('routes.auth.callback.handle_callback', async (span) => {
    const { session } = context;
    const currentUrl = new URL(request.url);

    span.setAttribute('request_url', currentUrl.toString());

    if (session.loginState === undefined) {
      span.addEvent('login_state.invalid');
      return Response.json({ message: 'Invalid login state' }, { status: HttpStatusCodes.BAD_REQUEST });
    }

    const { codeVerifier, nonce, state } = session.loginState;
    const returnUrl = session.loginState.returnUrl ?? new URL('/en', currentUrl.origin);

    span.setAttribute('return_url', returnUrl.toString());

    span.addEvent('token_exchange.start');

    const raoidcClient = await getRaoidcClient();

    const opts = serverEnvironment.AUTH_ENABLE_STUB_LOGIN
      ? {
          birthdate: session.stubloginState?.birthdate,
          locale: session.stubloginState?.locale,
          sin: session.stubloginState?.sin,
        }
      : {};

    const tokenSet = await raoidcClient.handleCallbackRequest(
      request,
      codeVerifier,
      nonce,
      state,
      new URL('/auth/callback', currentUrl.origin),
      opts,
    );

    span.addEvent('token_exchange.end');

    session.authState = {
      accessToken: tokenSet.accessToken,
      idTokenClaims: tokenSet.idToken,
      userinfoTokenClaims: tokenSet.userinfoToken,
    };

    delete session.loginState;
    delete session.stubloginState;

    return redirect(returnUrl.toString());
  });
}
