import * as v from 'valibot';

import { Redacted } from '~/.server/utils/security-utils';
import { stringToBooleanSchema } from '~/.server/validation/string-to-boolean-schema';

export type Authentication = Readonly<v.InferOutput<typeof authentication>>;

/**
 * A DEV-ONLY JWT public key and private key pair for testing purposes.
 */
const AUTH_CLIENT_PUBLIC_KEY =
  '-----BEGIN PUBLIC KEY-----' +
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkZWV8KtZsGRXstH4/Lgj' +
  'JQP1dFt0AA4dI4zISEFAeA0MIKVLGpNECE3Ds1XjoKkvuYorNy/HYtecajKQf7ka' +
  'po15TX/pFp2mpXodrendI1rSklkPo2oNBfXAwm+2VabrzCJZu0k2VaWqDBWYuV9o' +
  'hmEt1p+21Bel/AP2D4XQq5wrj61N/sXzMPXSEFEyzpmbjE6mDwTncvSZCnYSK1PB' +
  '334RZcnIa5EF6rRL8+mZYMOR7YiXgt9FRvJh7k/XF3v2ncI8OARIsiCFXTDDhLyL' +
  'rTrvXXDLt0x/JaBNFVVpychdWltUrwLsgSbztX+zkwGhBGcEBLe6k+aWGP7hMLad' +
  'MQIDAQAB' +
  '-----END PUBLIC KEY-----';

/**
 * A DEV-ONLY JWT public key and private key pair for testing purposes.
 */
const AUTH_CLIENT_PRIVATE_KEY =
  '-----BEGIN PRIVATE KEY-----' +
  'MIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQCRlZXwq1mwZFey' +
  '0fj8uCMlA/V0W3QADh0jjMhIQUB4DQwgpUsak0QITcOzVeOgqS+5iis3L8di15xq' +
  'MpB/uRqmjXlNf+kWnaaleh2t6d0jWtKSWQ+jag0F9cDCb7ZVpuvMIlm7STZVpaoM' +
  'FZi5X2iGYS3Wn7bUF6X8A/YPhdCrnCuPrU3+xfMw9dIQUTLOmZuMTqYPBOdy9JkK' +
  'dhIrU8HffhFlychrkQXqtEvz6Zlgw5HtiJeC30VG8mHuT9cXe/adwjw4BEiyIIVd' +
  'MMOEvIutOu9dcMu3TH8loE0VVWnJyF1aW1SvAuyBJvO1f7OTAaEEZwQEt7qT5pYY' +
  '/uEwtp0xAgMBAAECggEAKm/HmrVf+f5t3+a75PLJ787FHEtSN3flv4iYkxNONxBa' +
  'kiOMjm0R/jeozZxCM4FNs5BWg4ouXR4LbptZqplq7tS7YL9h0uFWg9LiVuEeQGGH' +
  'kvhaCiDuNegKbcMBi9sRzdnPfTvclj+pn0cmUxbAEbe/FFpPAWj5Tcpbze+MQZFe' +
  'QU4lEvdOGXMPN+3/TJDJuTLlG2qbWc/PUoq+LDSll2cOQDO32DUTkjbLrF90ZbaN' +
  'n1x3I3DqwlJ9geFJqXLRvShz3VIBMDVO1ZWwx+ISHtOHNkR5Zi0liRLRaMZw6VIY' +
  'AEVnFno1BpMftEEPXgSTD77x6JeqJ8dgg7hK3EAqTwKBgQDE4MMIZfU7hSBhEQX9' +
  'OpRjMSb1bNIAxu4nISj7eUpDhK0kX9+oU3q6Ixpsdk7HGwNuBE1y79APjXja29I2' +
  'btDqJaOO5GwC7uinMuhVCxBC5iXyXBoUwfKsiOf2EZe9sfOZbdTuPlUBWWCZx0I9' +
  'x+kD5jM34adgUQKLRe9L8/fd3wKBgQC9TY973Iz54yZP8dEGhVa51yL4BYWX1jp9' +
  'znH9w6C+Pepily9i3S944DTd6e8nrDui8apjf6XUtQCTSDClkuD/Us2VHwoBBxDi' +
  'eZTG7O8se8Zb+NA62I8S/ipF07VJoMeDsj1xJ9YDbUuqDhHi3EiG3lkVLwC+gYFL' +
  'n0bJN8zG7wKBgF5nK/3d7d5Rcno40HdhXH/HtNegC36l5NJMeztCKJMBjohPlI5B' +
  'ISsZ4/S4MgQU9usNExoW1dxvSNEg8MZ7EqAD1k6RRx2M83Ag3/jPake51d5FvZfQ' +
  'fA2xRBDg1LL4Hkemu6BVsSsJcWGrgx7euePNwSd9g2WS0rZ3nUv9OxBfAn8ulee5' +
  'k40d8ch75AaMlEPDeC4i2zkFJLNAQo3K5Vmpd5M2r/35VnVYSdS4x9kS6k/CybYk' +
  'xkUJE4IQvLM8C+lS7A2rpPfRSOve0AzM54H0cIFgINsdoC2VfvboODFk7SwsPLDi' +
  'J+uC7GKydsPwEEXI6u8BR4/nUfd/pLLG0fSTAoGAb1SPgG0kJFK9SFmKuwoG1qzT' +
  'ooFmW/vsXH1KTPDBpu928SzU+n9NE1X0Z7KhXrxUKKHxifr7sgy0XdM3h/W0/QQw' +
  'IZtQXpc3D4qVQ+z3m9uap32E+MkRoGWwe1nF0s55wIAY9P9t91mfZDAswchlCvMX' +
  '3ZXN3gu2Ni7jGFwubBs=' +
  '-----END PRIVATE KEY-----';

const AUTH_SERVER_PUBLIC_KEY =
  '-----BEGIN PUBLIC KEY-----' +
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAufoP/1gduSxsJtDHoSEU' +
  '5HxO5q1pgYXlD9psKTJ9gUXu6SrU6lwWJGCJq8oYjq0HOOgdItRV0diY6CtPGedA' +
  'cZ8CB1TIPAqMW5yl7nxnrPNMlSOg9NZrv5LLmDYcitGVobqaWnVd+R4yahQ9bMj/' +
  'pkcvu8AcEwOlE75Om5cOQypr5Pe9HjjilPV9MW0WA56gnrwG0L3EG2onTRZBNhX9' +
  'WSaDw4HebRLG9HB3hUyhJqfW9HYd17087Ca9iZBj7bRvWbk0QFmu0e2geUwSaHnR' +
  'QsFKNZyyUlPYwqDPqXZSIwNU/F7Xp+6pEIopPc+BuRFJmeS5LcB+NYDhgyRPGLcG' +
  '2QIDAQAB' +
  '-----END PUBLIC KEY-----';

const AUTH_SERVER_PRIVATE_KEY =
  '-----BEGIN PRIVATE KEY-----' +
  'MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC5+g//WB25LGwm' +
  '0MehIRTkfE7mrWmBheUP2mwpMn2BRe7pKtTqXBYkYImryhiOrQc46B0i1FXR2Jjo' +
  'K08Z50BxnwIHVMg8CoxbnKXufGes80yVI6D01mu/ksuYNhyK0ZWhuppadV35HjJq' +
  'FD1syP+mRy+7wBwTA6UTvk6blw5DKmvk970eOOKU9X0xbRYDnqCevAbQvcQbaidN' +
  'FkE2Ff1ZJoPDgd5tEsb0cHeFTKEmp9b0dh3XvTzsJr2JkGPttG9ZuTRAWa7R7aB5' +
  'TBJoedFCwUo1nLJSU9jCoM+pdlIjA1T8Xten7qkQiik9z4G5EUmZ5LktwH41gOGD' +
  'JE8YtwbZAgMBAAECggEAOT/71bh76el9X5OMqJLk+hM0PLmsTWV45qDwA9yZmwZ6' +
  'rcd0JLL1U/xt1PbRCXbFTuTRN0wTIRait3HBl3FDOtbeioA0ZZs/quH1iI0+YxTA' +
  'gfamUUiCgcZAK1qY/bjX7aHiay9PHuWHUnVplUfovviR/qN8YPQRyJqgWzAsgUsS' +
  'I3OpHCeArTeAQ2CCR9DNV7v5I9odKzXq4EWeT+lQsaHf6uiyUnWzsQxUKZOv+CKC' +
  'Lxtcdw8dy3fRlh1n9o0HJettISQ2wAJibHKFsFHCkvR+Kf0dY0ISVWpXEZofLzY/' +
  'QVGNz33nv6uxKEBBE0vcApZxU75+Vp1Rs73g4Yo48wKBgQDztdUmNGhpmiq+0NLv' +
  'dln4ffk2tGACKlFS8pJzAfYjIMvncUOdIZBxqfjZTBWZ7hLPIRc1hNoqYO/meuhq' +
  'zcsc6mmA1DMsmywUeaDJG4m9CZ8tc1wJ8eGVeAk90G3SBu6kYPmMWls2/YTUtFl1' +
  '/2pAvS6UUIVXxtfOh/d1J2Ey1wKBgQDDWuwLOCZ1Ey2ziTEU0H627ffWMpG7jhGW' +
  '08E1NwDWphVr8jPvjHCcVCSAJQ23t/N97gLlhtx9Ebz9kfCJLImQ7iIqLJ3+ChnJ' +
  '/O3LpZrXDt7oiuk66Gs8+OcP3AaEa3jiiDy+cE3Fo301RXKaVUZTX9L7Qo6p4rO0' +
  'KOGIU4YNzwKBgQDTDJpjlWr+WIW/7TNeME3FxcH1v8qM1XzLqkls0zwGO7aY3RtC' +
  'jfh6lklsVFk4jlU3jl58+Gm93WijXbi8FS9aAR4QdLNEY7SOnq3AutpTHGv+fjIs' +
  'Yo2KVQMbxs3z3hD3xQsWooDvZCiN0wjOCLxJCAu4YOq4kvf8YP7JM6sWzQKBgQCg' +
  'c9lUDbZoimwK/i+17Nlm3mWlJLvV1IZV327dimPB6X/GvZQyuKL1g5bHOafesdPo' +
  'JslyRCZtA1i63Fc4E8CZrT2abjMGKL2tzXRyw34+DRTA4vdVTvhlh/ogaJNhx/Pt' +
  '/AAIWq1GG1YHnxbV9Bxi9l2PycbreiwnWTyEgDWmuQKBgQDULwwU3qKaqWkmnOz+' +
  'I5a6p7Cz2W590XBGMDiua3cVt/hFVPCvEtOCmodz9u5ovW/VLR5Xusn+d+jVYFsb' +
  'qPBiwRvpExe8Ory1eXWum6phpMDS99XXmZL+z6lNlXd99Cx5iSRZRCxTSAenj69Z' +
  'pGRIElx2LpscoD+GnZeLdWp+wQ==' +
  '-----END PRIVATE KEY-----';

//const isProduction = process.env.NODE_ENV === 'production';

export const defaults = {
  AUTH_ENABLE_STUB_LOGIN: 'true',//isProduction ? 'false' : 'true',

  AUTH_CLIENT_PRIVATE_KEY: AUTH_CLIENT_PRIVATE_KEY,
  AUTH_CLIENT_PUBLIC_KEY: AUTH_CLIENT_PUBLIC_KEY,
  AUTH_SERVER_PRIVATE_KEY: AUTH_SERVER_PRIVATE_KEY,
  AUTH_SERVER_PUBLIC_KEY: AUTH_SERVER_PUBLIC_KEY,

  AUTH_RAOIDC_BASE_URL: 'http://localhost:3000/auth/raoidc/',
  AUTH_RAOIDC_CLIENT_ID: '00000000-0000-0000-0000-000000000000',
  AUTH_RAOIDC_ISSUER: 'MOCK_RAOIDC',
  AUTH_RAOIDC_LOGOUT_URL: 'http://localhost:3000/stub-login',
  AUTH_RAOIDC_RASCL_LOGOUT_URL: 'http://localhost:3000/auth/raoidc/logout',
} as const;

export const authentication = v.object({
  AUTH_ENABLE_STUB_LOGIN: v.optional(stringToBooleanSchema(), defaults.AUTH_ENABLE_STUB_LOGIN),

  AUTH_CLIENT_PRIVATE_KEY: v.optional(v.pipe(v.string(), v.transform(Redacted.make)), defaults.AUTH_CLIENT_PRIVATE_KEY),
  AUTH_CLIENT_PUBLIC_KEY: v.optional(v.string(), defaults.AUTH_CLIENT_PUBLIC_KEY),
  AUTH_SERVER_PRIVATE_KEY: v.optional(v.pipe(v.string(), v.transform(Redacted.make)), defaults.AUTH_SERVER_PRIVATE_KEY),
  AUTH_SERVER_PUBLIC_KEY: v.optional(v.string(), defaults.AUTH_SERVER_PUBLIC_KEY),

  AUTH_RAOIDC_BASE_URL: v.optional(v.string(), defaults.AUTH_RAOIDC_BASE_URL),
  AUTH_RAOIDC_CLIENT_ID: v.optional(v.string(), defaults.AUTH_RAOIDC_CLIENT_ID),
  AUTH_RAOIDC_ISSUER: v.optional(v.string(), defaults.AUTH_RAOIDC_ISSUER),
  AUTH_RAOIDC_LOGOUT_URL: v.optional(v.string(), defaults.AUTH_RAOIDC_LOGOUT_URL),
  AUTH_RAOIDC_PROXY_URL: v.optional(v.string()),
  AUTH_RAOIDC_RASCL_LOGOUT_URL: v.optional(v.string(), defaults.AUTH_RAOIDC_RASCL_LOGOUT_URL),
});
