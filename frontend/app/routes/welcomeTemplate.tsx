import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/letters';
import { requireAuth } from '~/.server/utils/auth-utils';

import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/layout';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace],
} as const satisfies RouteHandle;



export async function loader({ context, params, request }: Route.LoaderArgs) {
  const { userinfoTokenClaims } = await requireAuth(context.session, request);
  const { t } = await getTranslation(request, handle.i18nNamespace);

  const { MSCA_BASE_URL } = globalThis.__appEnvironment;


  if (!userinfoTokenClaims.sin) {
    throw new AppError('No SIN found in userinfo token', ErrorCodes.MISSING_SIN);
  }

  return { documentTitle: t('app:template.page-title'),  MSCA_BASE_URL };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data?.documentTitle }];
}

export default function WelcomeTemplate() {
 
  const { t } = useTranslation(handle.i18nNamespace);

 
  

  return (
    <>
      <div className="mb-8">
        <PageTitle className="after:w-14">{t('app:template.page-title')}</PageTitle>
      </div>
      

    </>
  );
}
