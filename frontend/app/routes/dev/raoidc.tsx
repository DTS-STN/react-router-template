/**
 * @file Mock RAOIDC OIDC Provider
 *
 * @description
 * This module implements a mock (development-only) RAOIDC provider.
 *
 * It is designed for local development and testing purposes, allowing applications
 * to integrate an RAOIDC flow without needing to connect to a live RAOIDC instance.
 *
 * Key features (and limitations):
 *
 *   - Supports a basic OIDC Authorization Code Flow.
 *   - Provides endpoints for OIDC discovery (`.well-known/openid-configuration`),
 *     JWKS (`.well-known/jwks`), authorization (`/authorize`), token exchange (`/token`),
 *     and user information (`/userinfo`).
 *   - Uses an in-memory cache for authorization codes, making it suitable only for
 *     single-instance deployments during development. This cache has a short ~30s expiry.
 *   - Token generation (signing and encryption) uses keys and client IDs configured via
 *     environment variables (see `serverEnvironment`).
 *   - All functionality is gated by the `AUTH_ENABLE_STUB_LOGIN` environment variable.
 *     If this variable is not true, all endpoints will return a 404 Not Found.
 *   - It does not perform real user authentication; it simulates a successful
 *     authentication and issues tokens with predefined user information.
 *   - Client authentication at the token endpoint is mocked via a `client_assertion`
 *     parameter but does not involve full JWT validation of the assertion itself.
 *
 * This mock is not intended for production use and lacks many security features
 * and the robustness of a real OIDC provider.
 */
import { redirect } from 'react-router';

import { CompactEncrypt, exportJWK, importPKCS8, importSPKI, SignJWT } from 'jose';
import { createHash } from 'node:crypto';
import { setTimeout } from 'node:timers';

import type { Route } from './+types/raoidc';

import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { HttpStatusCodes } from '~/utils/http-status-codes';
import { randomString } from '~/utils/string-utils';

const log = LogFactory.getLogger(import.meta.url);

/**
 * A list of predefined, allowed relative paths for OIDC callback URIs (redirect URIs).
 *
 * During the OIDC authorization flow, the client specifies a `redirect_uri` where the
 * authorization server should send the user back after authentication. To prevent
 * open redirector vulnerabilities, this mock OIDC provider validates the requested
 * `redirect_uri` against a list of allowed URIs.
 *
 * These paths are relative to the application's origin. The `getAllowedCallbacks()`
 * function dynamically combines these relative paths with the origin of the incoming
 * request to create fully qualified URIs for comparison.
 *
 * Add more relative paths to this array if the application should support multiple
 * callback endpoints for this mock OIDC provider.
 */
const ALLOWED_CALLBACKS = ['/auth/callback'];

/**
 * An in-memory cache mapping authorization codes to their
 * corresponding encrypted access and ID tokens (JWTs).
 *
 * This cache is a crucial part of the OIDC authorization code flow implemented
 * by this mock provider. After a user is authenticated via the `/authorize`
 * endpoint, an authcode (a random string) is generated and stored as a key
 * in this map. The associated value is an object containing the `accessToken`
 * and `idToken` (which are encrypted JWTs) intended for the client.
 *
 * When the client subsequently calls the `/token` endpoint with this authcode,
 * this cache is queried to retrieve the tokens.
 *
 * Entries in this cache are intentionally short-lived: they are automatically
 * removed 30 seconds after being added (if not already consumed by a token exchange).
 * This simulates the single-use nature of authorization codes and helps manage memory
 * in this development utility.
 *
 * ⚠️ Note: This simple in-memory cache will only work correctly for single-instance
 *          deployments. When deploying to a multi-instance environment (e.g., using
 *          load balancing or kubernetes pods), a more robust, distributed token
 *          caching mechanism (like Redis or Valkey) would be required.
 */
const tokenCache = new Map<string, { accessToken: string; idToken: string }>();

/**
 * Handles incoming POST requests to OIDC action endpoints.
 * This function serves as the entry point for operations like token exchange.
 *
 * It routes requests based on the dynamic `endpoint` parameter extracted from the URL.
 * Currently, it primarily supports the `/token` endpoint, but can be extended to support more.
 *
 * Access to these endpoints is contingent upon the `AUTH_ENABLE_STUB_LOGIN`
 * environment variable being set to `true`.
 *
 * @param args The route action arguments including context, params, and request.
 * @returns A Promise resolving to a `Response` object, typically JSON or a redirect.
 */
export async function action(actionArgs: Route.ActionArgs): Promise<Response> {
  if (!serverEnvironment.AUTH_ENABLE_STUB_LOGIN) {
    log.warn('Attempted POST to mock RAOIDC provider when AUTH_ENABLE_STUB_LOGIN=false; returning 404');
    throw Response.json(null, { status: HttpStatusCodes.NOT_FOUND });
  }

  const endpoint = actionArgs.params['*'];

  switch (endpoint) {
    case 'token': {
      return await handleTokenRequest(actionArgs);
    }

    default: {
      throw Response.json(`OIDC endpoint ${endpoint} not found`, { status: HttpStatusCodes.NOT_FOUND });
    }
  }
}

/**
 * Handles incoming GET requests to OIDC loader endpoints.
 * This function serves as the entry point for OIDC discovery, authorization,
 * JWKS, and userinfo requests.
 *
 * It routes requests based on the dynamic `endpoint` parameter extracted from the URL.
 * Supported endpoints include:
 *
 *   - `/.well-known/openid-configuration` (OIDC discovery)
 *   - `/.well-known/jwks` (JSON Web Key Set)
 *   - `/authorize` (Authorization endpoint)
 *   - `/userinfo` (Userinfo endpoint)
 *
 * Access to these endpoints is contingent upon the `AUTH_ENABLE_STUB_LOGIN`
 * environment variable being set to `true`.
 *
 * @param args The route loader arguments including context, params, and request.
 * @returns A Promise resolving to a `Response` object, typically JSON or a redirect.
 */
export async function loader(loaderArgs: Route.LoaderArgs): Promise<Response> {
  if (!serverEnvironment.AUTH_ENABLE_STUB_LOGIN) {
    log.warn('Attempted GET to mock RAOIDC provider when AUTH_ENABLE_STUB_LOGIN=false; returning 404');
    throw Response.json(null, { status: HttpStatusCodes.NOT_FOUND });
  }

  const endpoint = loaderArgs.params['*'];

  switch (endpoint) {
    case '.well-known/openid-configuration': {
      return handleMetadataRequest(loaderArgs);
    }

    case '.well-known/jwks': {
      return await handleJwksRequest(loaderArgs);
    }

    case 'authorize': {
      return await handleAuthorizeRequest(loaderArgs);
    }

    case 'userinfo': {
      return handleUserinfoRequest(loaderArgs);
    }

    case 'validatesession': {
      return handleValidateSession(loaderArgs);
    }

    default: {
      throw Response.json(`OIDC endpoint ${endpoint} not found`, { status: HttpStatusCodes.NOT_FOUND });
    }
  }
}

/**
 * Handles the OIDC authorization request (Authorization Endpoint).
 * See: https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint
 *
 * This function validates essential OIDC parameters from the query string:
 * `client_id`, `nonce`, `redirect_uri`, `scope`, and `state`.
 *
 * If validation passes, it generates an authorization code, an encrypted access token,
 * and an encrypted ID token. The tokens are cached temporarily, associated with the
 * authorization code.
 *
 * Finally, it redirects the user-agent back to the client's `redirect_uri` with the
 * authorization code and the original `state`.
 *
 * @param locale The preferred locale of the user.
 * @param args The route loader arguments, containing the `request` object.
 * @returns A Promise resolving to a `Response` object, typically a redirect.
 *          Returns a JSON error response with status 400 for invalid requests.
 */
async function handleAuthorizeRequest(loaderArgs: Route.LoaderArgs): Promise<Response> {
  const allowedRedirectUris = getAllowedCallbacks(loaderArgs.request);

  const searchParams = new URL(loaderArgs.request.url).searchParams;
  const clientId = searchParams.get('client_id');
  const nonce = searchParams.get('nonce');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope');
  const state = searchParams.get('state');

  //
  // run some basic validation checks
  //

  if (clientId !== serverEnvironment.AUTH_RAOIDC_CLIENT_ID) {
    return Response.json({ error: 'invalid_client_id' }, { status: HttpStatusCodes.BAD_REQUEST });
  }

  if (!nonce) {
    return Response.json({ error: 'invalid_nonce' }, { status: HttpStatusCodes.BAD_REQUEST });
  }

  if (redirectUri && !allowedRedirectUris.includes(redirectUri)) {
    return Response.json({ error: 'invalid_redirect_uri' }, { status: HttpStatusCodes.BAD_REQUEST });
  }

  if (!scope) {
    return Response.json({ error: 'invalid_scope' }, { status: HttpStatusCodes.BAD_REQUEST });
  }

  if (!state) {
    return Response.json({ error: 'invalid_state' }, { status: HttpStatusCodes.BAD_REQUEST });
  }

  //
  // validation passed; generate tokens and return authcode
  //

  const authCode = randomString(32);
  const accessToken = await generateAccessToken(nonce);
  const idToken = await generateIdToken('en-CA', nonce);

  // store in the token cache for 30 seconds (for retrieval during token exchange step)
  tokenCache.set(authCode, { accessToken, idToken });
  setTimeout(() => tokenCache.delete(authCode), 30_000);

  // redirect back to the client to perform the authcode ↔ token exchange
  return redirect(`${redirectUri}?code=${authCode}&state=${state}`);
}

/**
 * Handles requests for the OIDC provider's metadata (Discovery Endpoint).
 * See: https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig
 *
 * This function constructs and returns the OIDC discovery document. This document
 * provides clients with essential information about the OIDC provider, such as
 * the URLs for authorization, token, userinfo, and JWKS endpoints, supported
 * scopes, response types, signing algorithms, and the issuer identifier.
 *
 * @param args The route loader arguments, containing the `request` object to derive base URL.
 * @returns A `Response` object containing the JSON OIDC provider metadata.
 */
function handleMetadataRequest(loaderArgs: Route.LoaderArgs): Response {
  const baseUrl = new URL('/auth/raoidc', new URL(loaderArgs.request.url).origin).toString();

  return Response.json({
    authorization_endpoint: `${baseUrl}/authorize`,
    claims_supported: ['aud', 'email', 'exp', 'iat', 'iss', 'name', 'sub'],
    id_token_signing_alg_values_supported: ['RS256'],
    issuer: serverEnvironment.AUTH_RAOIDC_ISSUER,
    jwks_uri: `${baseUrl}/.well-known/jwks`,
    response_types_supported: ['code id_token', 'id_token token'],
    scopes_supported: ['openid', 'profile', 'email'],
    subject_types_supported: ['public'],
    token_endpoint_auth_methods_supported: ['client_secret_post'],
    token_endpoint: `${baseUrl}/token`,
    userinfo_endpoint: `${baseUrl}/userinfo`,
  });
}

/**
 * Handles requests for the JSON Web Key Set (JWKS Endpoint).
 * See: https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig
 *
 * This function retrieves the server's public signing key, converts it to
 * JWK format, and returns it within a JWK Set. Clients use this endpoint
 * to fetch the public keys needed to verify the signatures of ID tokens and
 * other JWTs issued by this OIDC provider.
 *
 * @returns A Promise resolving to a `Response` object containing the JSON JWK Set.
 */
async function handleJwksRequest(loaderArgs: Route.LoaderArgs): Promise<Response> {
  const key = await importSPKI(serverEnvironment.AUTH_SERVER_PUBLIC_KEY, 'RS256');
  const jwk = await exportJWK(key);

  return Response.json({
    keys: [
      {
        alg: 'RS256',
        kid: generatePublicKeyId(),
        use: 'sig',
        ...jwk,
      },
    ],
  });
}

/**
 * Handles OIDC token exchange requests (Token Endpoint).
 * See: https://openid.net/specs/openid-connect-core-1_0.html#TokenEndpoint
 *
 * This function processes requests to exchange an authorization code (and client
 * assertion) for an access token and an ID token. It validates parameters like
 * `grant_type`, `code`, `redirect_uri`, `client_id`, `client_assertion`, and
 * `client_assertion_type`.
 *
 * If validation succeeds and the authorization code is valid and found in the cache,
 * it returns the (still encrypted) access and ID tokens.
 *
 * @param args The route loader arguments, containing the `request` object.
 * @returns A Promise resolving to a `Response` object. Returns JSON with tokens on success,
 *          or a JSON error response with status 400/401 for invalid requests.
 */
async function handleTokenRequest(actionArgs: Route.ActionArgs): Promise<Response> {
  const allowedRedirectUris = getAllowedCallbacks(actionArgs.request);

  const formData = await actionArgs.request.formData();
  const clientAssertion = formData.get('client_assertion')?.toString();
  const clientAssertionType = formData.get('client_assertion_type')?.toString();
  const clientId = formData.get('client_id')?.toString();
  const authCode = formData.get('code')?.toString();
  const grantType = formData.get('grant_type')?.toString();
  const redirectUri = formData.get('redirect_uri')?.toString();

  //
  // run some basic validation checks
  //

  if (clientAssertionType !== 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer') {
    return Response.json({ error: 'invalid_client_assertion_type' }, { status: HttpStatusCodes.BAD_REQUEST });
  }

  if (clientId !== serverEnvironment.AUTH_RAOIDC_CLIENT_ID) {
    return Response.json({ error: 'invalid_client' }, { status: HttpStatusCodes.BAD_REQUEST });
  }

  if (!clientAssertion) {
    return Response.json({ error: 'invalid_client_assertion' }, { status: HttpStatusCodes.BAD_REQUEST });
  }

  if (!authCode) {
    return Response.json({ error: 'invalid_code' }, { status: HttpStatusCodes.BAD_REQUEST });
  }

  if (grantType !== 'authorization_code') {
    return Response.json({ error: 'invalid_grant_type' }, { status: HttpStatusCodes.BAD_REQUEST });
  }

  if (redirectUri && !allowedRedirectUris.includes(redirectUri)) {
    return Response.json({ error: 'invalid_redirect_uri' }, { status: HttpStatusCodes.BAD_REQUEST });
  }

  //
  // validation passed; fetch tokens from cache (and delete)
  //

  const tokenSet = tokenCache.get(authCode);
  setTimeout(() => tokenCache.delete(authCode), 30_000);

  if (!tokenSet) {
    return Response.json({ error: 'invalid_auth_code' }, { status: HttpStatusCodes.BAD_REQUEST });
  }

  return Response.json({
    token_type: 'Bearer',
    access_token: tokenSet.accessToken,
    id_token: tokenSet.idToken,
    expires_in: 5 * 60, // 5 mins (matches RAOIDC)
  });
}

/**
 * Handles RAOIDC session validation. Always returns `true`.
 * @returns A `Response` object that always contains `true`.
 */
function handleValidateSession(loaderArgs: Route.LoaderArgs): Response {
  return Response.json(true);
}

/**
 * Handles requests for user information (Userinfo Endpoint).
 * See: https://openid.net/specs/openid-connect-core-1_0.html#UserInfo
 *
 * This function generates a signed and then encrypted JWT containing user-specific
 * claims. In a real OIDC provider, access to this endpoint would require a valid
 * access token presented by the client. This mock version currently uses hardcoded
 * user details and does not validate an access token.
 *
 * @param birthdate The user's birthdate, in 'YYYY-MM-DD' format.
 * @param locale The user's preferred locale, e.g., 'en-CA'.
 * @param sin The user's Social Insurance Number (example sensitive claim).
 * @returns A Promise resolving to a `Response` object containing the
 *          JWE-encrypted userinfo token.
 */
async function handleUserinfoRequest(loaderArgs: Route.LoaderArgs): Promise<Response> {
  const searchParams = new URL(loaderArgs.request.url).searchParams;

  const birthdate = searchParams.get('birthdate') ?? '2000-01-01';
  const locale = searchParams.get('locale') ?? 'en-CA';
  const sin = searchParams.get('sin') ?? '00000000';

  return Response.json({
    userinfo_token: await generateUserinfoToken(birthdate, locale, sin),
  });
}

/**
 * Constructs a list of fully qualified allowed callback URLs based on the
 * current request's origin and predefined relative callback paths.
 *
 * @param request The incoming Request object, used to determine the origin.
 * @returns An array of strings, where each string is a fully qualified allowed callback URL.
 */
function getAllowedCallbacks(request: Request): string[] {
  const origin = new URL(request.url).origin;
  return ALLOWED_CALLBACKS.map((allowedCallback) => new URL(allowedCallback, origin).toString());
}

/**
 * Generates a signed and then encrypted JWT representing an access token.
 *
 * The access token includes standard claims like issuer, subject, audience,
 * expiration time, issued at time, JTI, as well as a nonce and user-specific
 * details like roles and scopes.
 *
 * It is signed using an RS256 algorithm with the server's private key.
 *
 * Crucially, the signed access token is then encrypted using RSA-OAEP-256
 * with the server's public key. This ensures that the contents of the
 * access token are opaque to the client and can only be decrypted and verified
 * by the resource server (or in this mock case, the OIDC provider itself if it
 * were to introspect it, though this mock doesn't implement introspection).
 *
 * @param nonce A unique string value provided by the client in the authorization request,
 *              used to mitigate replay attacks.
 * @returns A Promise that resolves to a string representing the JWE (JSON Web Encryption)
 *          of the signed access token.
 */
async function generateAccessToken(nonce: string): Promise<string> {
  const signedAccessToken = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: generatePublicKeyId() })
    .setAudience(serverEnvironment.AUTH_RAOIDC_CLIENT_ID)
    .setExpirationTime('20m')
    .setIssuedAt()
    .setIssuer(serverEnvironment.AUTH_RAOIDC_ISSUER)
    .setJti('00000000-0000-0000-0000-000000000000')
    .setNotBefore('30s ago')
    .setSubject('00000000-0000-0000-0000-000000000000')
    .sign(await importPKCS8(serverEnvironment.AUTH_SERVER_PRIVATE_KEY.value(), 'RS256'));

  // The access token is encrypted with the server's public key, so that only the RAOIDC
  // provider can decrypt it. This makes the access token's contents inaccessible to the client.
  return await new CompactEncrypt(new TextEncoder().encode(signedAccessToken))
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
    .encrypt(await importSPKI(serverEnvironment.AUTH_SERVER_PUBLIC_KEY, 'RSA-OAEP-256'));
}

/**
 * Generates a signed and then encrypted JWT representing an ID token.
 *
 * The ID token is a security token that contains claims about the authentication
 * of an end-user by an authorization server. It includes claims like issuer,
 * subject (user ID), audience (client ID), expiration time, issued at time,
 * nonce, and user profile information (name, email, roles, scopes).
 *
 * It is signed using an RS256 algorithm with the server's private key.
 *
 * The signed ID token is then encrypted using RSA-OAEP-256 with the client's
 * public key. This ensures that the ID token's contents are protected in transit
 * and can only be decrypted and verified by the client to whom it is intended.
 *
 * @param locale The preferred locale of the user.
 * @param nonce A unique string value provided by the client in the authorization request,
 *              used to mitigate replay attacks and to associate the ID token with the
 *              initial authentication request.
 * @returns A Promise that resolves to a string representing the JWE (JSON Web Encryption)
 *          of the signed ID token.
 */
async function generateIdToken(locale: string, nonce: string): Promise<string> {
  const idTokenClaims = {
    locale: locale,
    nonce: nonce,
  } as const;

  const signedIdToken = await new SignJWT(idTokenClaims)
    .setProtectedHeader({ alg: 'RS256', kid: generatePublicKeyId() })
    .setAudience(serverEnvironment.AUTH_RAOIDC_CLIENT_ID)
    .setExpirationTime('20m')
    .setIssuedAt()
    .setIssuer(serverEnvironment.AUTH_RAOIDC_ISSUER)
    .setJti('00000000-0000-0000-0000-000000000000')
    .setNotBefore('30s ago')
    .setSubject('00000000-0000-0000-0000-000000000000')
    .sign(await importPKCS8(serverEnvironment.AUTH_SERVER_PRIVATE_KEY.value(), 'RS256'));

  // The id token is encrypted with the client's public key, so it can be decrypted by the client.
  return await new CompactEncrypt(new TextEncoder().encode(signedIdToken))
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
    .encrypt(await importSPKI(serverEnvironment.AUTH_CLIENT_PUBLIC_KEY, 'RSA-OAEP-256'));
}

/**
 * Generates a signed and then encrypted JWT containing user information claims.
 *
 * This token is intended to be returned by the userinfo endpoint. It includes
 * claims specific to the user, such as birthdate, locale, and SIN (Social
 * Insurance Number), along with an audience and issuer.
 *
 * The token is signed using an RS256 algorithm with the server's private key.
 *
 * Similar to the ID token, the signed userinfo token is then encrypted using
 * RSA-OAEP-256 with the client's public key. This ensures its confidentiality
 * and integrity, allowing only the intended client to decrypt and access the
 * user information.
 *
 * @param birthdate The user's birthdate, in 'YYYY-MM-DD' format.
 * @param locale The user's preferred locale, e.g., 'en-CA'.
 * @param sin The user's Social Insurance Number.
 * @returns A Promise that resolves to a string representing the JWE (JSON Web Encryption)
 *          of the signed userinfo token.
 */
async function generateUserinfoToken(birthdate: string, locale: string, sin: string) {
  const keyId = generatePublicKeyId();

  const userInfoTokenClaims = {
    birthdate: birthdate,
    locale: locale,
    sin: sin,
  } as const;

  const userinfoToken = await new SignJWT(userInfoTokenClaims)
    .setProtectedHeader({ alg: 'RS256', kid: keyId })
    .setAudience(serverEnvironment.AUTH_RAOIDC_CLIENT_ID)
    .setExpirationTime('20m')
    .setIssuedAt()
    .setIssuer(serverEnvironment.AUTH_RAOIDC_ISSUER)
    .setJti('00000000-0000-0000-0000-000000000000')
    .setNotBefore('30s ago')
    .setSubject('00000000-0000-0000-0000-000000000000')
    .sign(await importPKCS8(serverEnvironment.AUTH_SERVER_PRIVATE_KEY.value(), 'RS256'));

  // The userinfo token is encrypted with the client's public key, so it can be decrypted by the client.
  return await new CompactEncrypt(new TextEncoder().encode(userinfoToken))
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
    .encrypt(await importSPKI(serverEnvironment.AUTH_CLIENT_PUBLIC_KEY, 'RSA-OAEP-256'));
}

/**
 * Generates a consistent Key ID (kid) for the server's public signing key.
 *
 * This function creates an MD5 hash of the `AUTH_SERVER_PUBLIC_KEY` environment
 * variable and returns its hexadecimal representation. The resulting string can be
 * used as a `kid` (Key ID) in the JWK (JSON Web Key) exposed by the
 * `/.well-known/jwks` endpoint.
 *
 * Using a consistent Key ID allows clients to identify and select the correct
 * key for verifying token signatures, especially in scenarios involving key rotation
 * (though this mock provider currently uses a single static key).
 *
 * Note: MD5 is used here for generating a simple, consistent identifier from the
 * public key string. While MD5 is not considered cryptographically secure for
 * hashing sensitive data or for signature purposes due to collision vulnerabilities,
 * its use here is for creating a predictable ID from the public key material itself
 * within this development/mock context. For production systems, stronger hashing
 * algorithms or more robust `kid` generation strategies are typically recommended.
 *
 * @returns A string representing the MD5 hash (hex digest) of the server's public key,
 *          intended for use as a Key ID (`kid`).
 */
function generatePublicKeyId(): string {
  return createHash('md5') //
    .update(serverEnvironment.AUTH_SERVER_PUBLIC_KEY)
    .digest('hex');
}
