export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorCodes = {
  UNCAUGHT_ERROR: 'UNC-0000',

  // auth error codes
  AUTH_TOKEN_ENDPOINT_NOT_DEFINED: 'AUTH-0001',
  AUTH_USERINFO_ENDPOINT_NOT_DEFINED: 'AUTH-0002',
  AUTH_CALLBACK_ERROR: 'AUTH-0003',
  AUTH_SESSION_VALIDATION_ERROR: 'AUTH-0004',
  AUTH_TOKEN_FETCH_ERROR: 'AUTH-0005',
  AUTH_USERINFO_FETCH_ERROR: 'AUTH-0006',
  AUTH_JWKS_FETCH_ERROR: 'AUTH-0007',
  AUTH_METADATA_FETCH_ERROR: 'AUTH-0008',

  // token error codes
  MISSING_SIN: 'TOK-0001',

  // component error codes
  MISSING_LANG_PARAM: 'CMP-0001',

  // i18n error codes
  NO_LANGUAGE_FOUND: 'I18N-0001',
  MISSING_TRANSLATION_KEY: 'I18N-0002',

  // instance error codes
  NO_FACTORY_PROVIDED: 'INST-0001',

  // route error codes
  ROUTE_NOT_FOUND: 'RTE-0001',

  // service error codes
  GENERIC_SERVICE_ERROR: 'SVC-0001',

  // CCT API error codes
  CCT_API_ERROR: 'API-0001',

  // dev-only error codes
  TEST_ERROR_CODE: 'DEV-0001',

  // external API error codes
  XAPI_RETRY_NO_CONDITIONS: 'XAPI-0002',
  XAPI_RETRY_CONDITION_MATCHED: 'XAPI-0003',
} as const;
