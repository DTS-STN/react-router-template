import type { Route } from './+types/jwks';

import { getRaoidcClient } from '~/.server/auth/raoidc-client';

/**
 * A JSON endpoint that contains a list of the application's public keys that
 * can be used by an auth provider to verify private key JWTs.
 */
export async function loader(loaderArgs: Route.LoaderArgs) {
  const raoidcClient = await getRaoidcClient();

  const jwk = raoidcClient.getPublicEncryptionJsonWebKey();
  const keyId = raoidcClient.generateJwkId(jwk);

  return Response.json({ keys: [{ ...jwk, kid: keyId }] }, { headers: { 'Content-Type': 'application/json' } });
}
