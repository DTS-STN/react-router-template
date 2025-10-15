import { useTranslation } from 'react-i18next';

import { AppLink } from './links';

export interface FooterProps {
  bilingual: boolean;
}

export function Footer({ bilingual }: FooterProps) {
  const { i18n, t } = useTranslation(['gcweb']);
  const en = i18n.getFixedT('en');
  const fr = i18n.getFixedT('fr');
  const { MSCA_BASE_URL, ECAS_BASE_URL } = globalThis.__appEnvironment;

  return (
    <footer id="wb-info" tabIndex={-1} className="mt-8 bg-stone-50 print:hidden">
      <div>
        {!bilingual && (
          <div className="bg-gray-700 text-white">
            <section className="container py-6">
              <h2 className="mb-4">{t('gcweb:footer.service-canada')}</h2>
              <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                <AppLink
                  to={t('gcweb:app.contact-us.href', { baseUri: MSCA_BASE_URL })}
                  property="item"
                  typeof="WebPage"
                  className="hover:underline"
                >
                  <span property="name">{t('gcweb:app.contact-us')}</span>
                </AppLink>
              </div>
            </section>
          </div>
        )}
      </div>
      <div className="container flex items-center justify-between gap-6 py-2.5 sm:py-3.5">
        {bilingual ? (
          <h2 className="sr-only">
            <span lang="en">{en('gcweb:footer.about-site')}</span> / <span lang="fr">{fr('gcweb:footer.about-site')}</span>
          </h2>
        ) : (
          <h2 className="sr-only">{t('gcweb:footer.about-site')}</h2>
        )}
        <div className="flex flex-col items-start gap-2 text-sm leading-6 sm:flex-row sm:items-center sm:gap-4">
          <AppLink
            className="text-slate-700 hover:underline"
            to={t('gcweb:footer.terms-conditions.href', { baseUri: ECAS_BASE_URL })}
            data-gc-analytics-navigation={`Footer:Footer:${t('gcweb:footer.terms-conditions.text')}`}
          >
            {t('gcweb:footer.terms-conditions.text')}
          </AppLink>
          <div className="hidden size-0 rounded-full border-[3px] border-slate-700 sm:block"></div>
          <AppLink
            className="text-slate-700 hover:underline"
            to={t('gcweb:footer.privacy.href', { baseUri: ECAS_BASE_URL })}
            data-gc-analytics-navigation={`Footer:Footer:${t('gcweb:footer.privacy.text')}`}
          >
            {t('gcweb:footer.privacy.text')}
          </AppLink>
        </div>
        <div>
          <img
            src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/wmms-blk.svg"
            alt={bilingual ? `${en('gcweb:footer.gc-symbol')} / ${fr('gcweb:footer.gc-symbol')}` : t('gcweb:footer.gc-symbol')}
            width={300}
            height={71}
            className="h-10 w-auto"
          />
        </div>
      </div>
    </footer>
  );
}
