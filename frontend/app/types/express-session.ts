import 'express-session';

import type { RaoidcAccessToken, RaoidcIdTokenClaims, RaoidcUserinfoTokenClaims } from '~/.server/auth/response-validators';

declare module 'express-session' {
  interface SessionData {
    authState: {
      accessToken: RaoidcAccessToken;
      idTokenClaims: RaoidcIdTokenClaims;
      userinfoTokenClaims: RaoidcUserinfoTokenClaims;
    };
    letterState: readonly Readonly<{
      id: string;
      date: string;
      letterTypeId: string;
    }>[];
    loginState: {
      codeVerifier: string;
      nonce: string;
      returnUrl?: URL;
      state: string;
    };
    stubloginState: {
      birthdate?: string;
      locale?: string;
      sin?: string;
    };
  }
}

export {};
