import { Form } from 'react-router';

import type { Route } from './+types/stub-login';

import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { AppBar } from '~/components/app-bar';
import { Button } from '~/components/button';
import { InputField } from '~/components/input-field';
import { AppLink } from '~/components/links';
import { PageDetails } from '~/components/page-details';
import { PageTitle } from '~/components/page-title';
import { SkipNavigationLinks } from '~/components/skip-navigation-links';
import { loader as loginLoader } from '~/routes/auth/login';
import { HttpStatusCodes } from '~/utils/http-status-codes';

const log = LogFactory.getLogger(import.meta.url);

export function meta() {
  return [{ title: 'Stub login' }];
}

export function loader({ context, params, request }: Route.LoaderArgs): Promise<Response> | undefined {
  if (!serverEnvironment.AUTH_ENABLE_STUB_LOGIN) {
    log.warn('Attempted GET to stub-login when AUTH_ENABLE_STUB_LOGIN=false; returning 404');
    throw Response.json(null, { status: HttpStatusCodes.NOT_FOUND });
  }

  const searchParams = new URL(request.url).searchParams;
  if (searchParams.get('sin')) return loginLoader({ context, params, request });
}

export default function StubLogin() {
  const { BUILD_DATE, BUILD_VERSION } = globalThis.__appEnvironment;

  return (
    <>
      <header>
        <SkipNavigationLinks />
        <div id="wb-bnr">
          <div className="container flex items-center justify-between gap-6 py-2.5 sm:py-3.5">
            <AppLink to="https://canada.ca/">
              <img
                className="h-8 w-auto"
                src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/sig-blk-en.svg"
                alt="Government of Canada"
                width="300"
                height="28"
                decoding="async"
              />
            </AppLink>
          </div>
        </div>
        <AppBar />
      </header>
      <main className="container print:w-full print:max-w-none">
        <PageTitle>Stub login</PageTitle>
        <div className="max-w-prose">
          <Form className="space-y-8 space-x-3" method="GET">
            <InputField id="sin" name="sin" label="SIN" required inputMode="numeric" />
            <Button variant="primary" id="login-button">
              Login
            </Button>
          </Form>
        </div>
        <PageDetails buildDate={BUILD_DATE} buildVersion={BUILD_VERSION} pageId="STUB-LOGIN" />
      </main>
      <footer id="wb-info" tabIndex={-1} className="bg-stone-50 print:hidden">
        <div className="container flex items-center justify-end gap-6 py-2.5 sm:py-3.5">
          <div>
            <h2 className="sr-only">About this site</h2>
            <div>
              <img
                src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/wmms-blk.svg"
                alt="Symbol of the Government of Canada"
                width={300}
                height={71}
                className="h-10 w-auto"
              />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
