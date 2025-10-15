/**
 * @file This module defines Valibot validation schemas and corresponding TypeScript types
 * for various data structures used by the RAOIDC authentication provider.
 *
 * It includes schemas for:
 *
 *   - Access tokens
 *   - ID tokens (including standard OIDC claims and potential custom claims)
 *   - Server metadata (based on OIDC Discovery and RFC 8414, noting specific RAOIDC deviations)
 *   - Userinfo tokens (claims returned by the Userinfo endpoint)
 *   - JSON Web Keys (JWK) and JWK Sets, specifically for RSA keys used in signing.
 *
 * These schemas are used to parse and validate data received from or used with
 * an RAOIDC provider, ensuring type safety and data integrity.
 */
import * as v from 'valibot';

/**
 * A validation schema for non-empty strings.
 */
const nonEmptyString = () => v.pipe(v.string(), v.nonEmpty());

/**
 * A validation schema for positive integers.
 */
const positiveInteger = () => v.pipe(v.number(), v.integer(), v.minValue(0));

/**
 * A validation schema for URLs.
 */
const url = () => v.pipe(v.string(), v.url());

/**
 * Transforms a string into a URL.
 */
const toUrl = v.transform((str: string) => new URL(str));

/**
 * An RAOIDC access token.
 *
 * See {@link RaoidcAccessTokenSchema}
 */
export type RaoidcAccessToken = v.InferOutput<typeof RaoidcAccessTokenSchema>;

/**
 * A validation schema for an RAOIDC acces token.
 */
export const RaoidcAccessTokenSchema = nonEmptyString();

/**
 * An RAOIDC ID token.
 *
 * Represents the decoded claims found within an ID token issued by RAOIDC. It
 * includes standard OIDC claims, but may also contain other custom claims.
 *
 * See {@link RaoidcIdTokenSchema}
 */
export type RaoidcIdTokenClaims = v.InferOutput<typeof RaoidcIdTokenSchema>;

/**
 * A validation schema for an RAOIDC ID token.
 *
 * Represents the decoded claims found within an ID token issued by RAOIDC. It
 * includes standard OIDC claims, but may also contain other custom claims.
 */
export const RaoidcIdTokenSchema = v.looseObject({
  aud: nonEmptyString(),
  exp: positiveInteger(),
  iat: positiveInteger(),
  iss: nonEmptyString(),
  jti: nonEmptyString(),
  nbf: positiveInteger(),
  nonce: nonEmptyString(),
  sid: nonEmptyString(),
  sub: nonEmptyString(),
  //
  // optional properties
  //
  locale: v.optional(nonEmptyString()),
});

/**
 * RAOIDC server metadata.
 *
 * See {@link RaoidcUserinfoTokenSchema}
 */
export type RaoidcServerMetadataSchema = v.InferOutput<typeof RaoidcServerMetadataSchema>;

/**
 * A validation schema for RAOIDC authentication server metadata.
 * Used to validate the response from the OIDC discovery endpoint.
 *
 * This schema defines the expected structure and types for standard OIDC
 * metadata properties as specified in RFC 8414 (OAuth 2.0 Authorization Server
 * Metadata) and OpenID Connect Discovery 1.0.
 *
 * It uses `v.intersect` to combine a strict definition of known, standard OIDC
 * properties with `v.record(v.string(), v.unknown())` to explicitly allow for
 * additional, arbitrary key-value pairs that the RAOIDC server might include
 * beyond the standard.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc8414#section-2 RFC 8414 - OAuth 2.0 Authorization Server Metadata
 */
export const RaoidcServerMetadataSchema = v.looseObject({
  jwks_uri: v.pipe(url(), toUrl),
  authorization_endpoint: v.pipe(url(), toUrl),
  id_token_signing_alg_values_supported: v.array(nonEmptyString()),
  issuer: nonEmptyString(), // XXX ::: GjB -- RAOIDC SPECIFIC ::: spec requires a URL, but RAOIDC provides a string 🤷
  response_types_supported: v.array(nonEmptyString()),
  subject_types_supported: v.array(nonEmptyString()),
  //
  // recommended (but optional) properties
  //
  claims_supported: v.optional(v.array(nonEmptyString())),
  registration_endpoint: v.optional(v.pipe(url(), toUrl)),
  scopes_supported: v.optional(v.array(nonEmptyString())),
  userinfo_endpoint: v.optional(v.pipe(url(), toUrl)),
  //
  // optional properties
  //
  acr_values_supported: v.optional(v.array(nonEmptyString())),
  claim_types_supported: v.optional(v.array(nonEmptyString())),
  claims_locales_supported: v.optional(v.array(nonEmptyString())),
  claims_parameter_supported: v.optional(v.boolean()),
  display_values_supported: v.optional(v.array(nonEmptyString())),
  grant_types_supported: v.optional(nonEmptyString()), // XXX ::: GjB -- RAOIDC SPECIFIC ::: spec requires an array, but RAOIDC provides a string 🤷
  id_token_encryption_alg_values_supported: v.optional(v.array(nonEmptyString())),
  id_token_encryption_enc_values_supported: v.optional(v.array(nonEmptyString())),
  op_policy_uri: v.optional(v.pipe(url(), toUrl)),
  op_tos_uri: v.optional(v.pipe(url(), toUrl)),
  request_object_encryption_alg_values_supported: v.optional(v.array(nonEmptyString())),
  request_object_encryption_enc_values_supported: v.optional(v.array(nonEmptyString())),
  request_object_signing_alg_values_supported: v.optional(v.array(nonEmptyString())),
  request_parameter_supported: v.optional(v.boolean()),
  request_uri_parameter_supported: v.optional(v.boolean()),
  require_request_uri_registration: v.optional(v.boolean()),
  response_modes_supported: v.optional(v.array(nonEmptyString())),
  service_documentation: v.optional(v.pipe(url(), toUrl)),
  token_endpoint_auth_methods_supported: v.optional(v.array(nonEmptyString())),
  token_endpoint_auth_signing_alg_values_supported: v.optional(v.array(nonEmptyString())),
  token_endpoint: v.optional(v.pipe(url(), toUrl)),
  ui_locales_supported: v.optional(v.array(nonEmptyString())),
  userinfo_encryption_alg_values_supported: v.optional(v.array(nonEmptyString())),
  userinfo_encryption_enc_values_supported: v.optional(v.array(nonEmptyString())),
  userinfo_signing_alg_values_supported: v.optional(v.array(nonEmptyString())),
});

/**
 * An RAOIDC userinfo token.
 *
 * Represents the claims returned by the RAOIDC Userinfo endpoint. It includes
 * standard OIDC claims, but may also contain other custom claims.
 *
 * See {@link RaoidcUserinfoTokenSchema}
 */
export type RaoidcUserinfoTokenClaims = v.InferOutput<typeof RaoidcUserinfoTokenSchema>;

/**
 * A validation schema for validating an RAOIDC userinfo token.
 *
 * Represents the claims returned by the RAOIDC Userinfo endpoint. It includes
 * standard OIDC claims, but may also contain other custom claims.
 */
export const RaoidcUserinfoTokenSchema = v.looseObject({
  aud: nonEmptyString(),
  exp: positiveInteger(),
  iat: positiveInteger(),
  iss: nonEmptyString(),
  jti: nonEmptyString(),
  nbf: positiveInteger(),
  sub: nonEmptyString(),
  //
  // optional properties
  //
  birthdate: v.optional(nonEmptyString()),
  locale: v.optional(nonEmptyString()),
  sin: v.optional(nonEmptyString()),
});

/**
 * An RSA JSON Web Key (JWK).
 *
 * See {@link RsaJsonWebKeySchema}
 */
export type RsaJsonWebKey = v.InferOutput<typeof RsaJsonWebKeySchema>;

/**
 * A validation schema for validating a single RSA JSON Web Key (JWK).
 * Note: allows for unknown properties as per the spec.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7517 RFC 7517 - JSON Web Key (JWK)
 */
export const RsaJsonWebKeySchema = v.looseObject({
  'e': nonEmptyString(),
  'kty': v.literal('RSA'),
  'n': nonEmptyString(),
  //
  // optional properties
  //
  'alg': v.optional(nonEmptyString()),
  'd': v.optional(nonEmptyString()),
  'dp': v.optional(nonEmptyString()),
  'dq': v.optional(nonEmptyString()),
  'key_ops': v.optional(v.array(nonEmptyString())),
  'kid': v.optional(nonEmptyString()),
  'p': v.optional(nonEmptyString()),
  'q': v.optional(nonEmptyString()),
  'qi': v.optional(nonEmptyString()),
  'use': v.optional(nonEmptyString()),
  'x5c': v.optional(v.array(nonEmptyString())),
  'x5t': v.optional(nonEmptyString()),
  'x5t#S256': v.optional(nonEmptyString()),
  'x5u': v.optional(v.pipe(url(), toUrl)),
});

/**
 * An RSA JSON Web Key (JWK) set.
 *
 * See {@link RsaJsonWebKeySetSchema}
 */
export type RsaJsonWebKeySet = v.InferOutput<typeof RsaJsonWebKeySetSchema>;

/**
 * A validation schema for validating an RSA JSON Web Key (JWK) set.
 * Note: allows for unknown properties as per the spec.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7517#section-5 RFC 7517 - JSON Web Key (JWK)
 */
export const RsaJsonWebKeySetSchema = v.looseObject({
  keys: v.array(RsaJsonWebKeySchema),
});
