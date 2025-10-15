import type { JSX } from 'react';

import { faChevronDown, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from '~/components/dropdown-menu';
import { AppLink } from '~/components/links';
import { MenuItem } from '~/components/menu';
import { useLanguage } from '~/hooks/use-language';
import { cn } from '~/utils/tailwind-utils';

type AppBarProps = {
  name?: string;
};

export function AppBar({ name }: AppBarProps): JSX.Element {
  const { t } = useTranslation(['gcweb']);
  const { MSCA_BASE_URL } = globalThis.__appEnvironment;

  return (
    <div className="bg-slate-700">
      <div className="align-center container mx-auto flex flex-wrap justify-between">
        <div className="align-center flex">
          <span id="menu-label" className="my-auto py-2 text-white sm:text-2xl">
            <AppLink to={t('gcweb:app.menu-dashboard.href', { baseUri: MSCA_BASE_URL })} className="hover:underline">
              {t('gcweb:app.title')}
            </AppLink>
          </span>
        </div>
        <div className="flex items-center space-x-4 text-right">{name && <UserButton name={name} />}</div>
      </div>
    </div>
  );
}

type UserButtonProps = {
  className?: string;
  name?: string;
};

function UserButton({ className, name }: UserButtonProps): JSX.Element {
  const { t } = useTranslation(['gcweb']);
  const { currentLanguage } = useLanguage();
  const { MSCA_BASE_URL } = globalThis.__appEnvironment;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex h-full flex-nowrap space-x-2 bg-slate-200 px-2 text-sm text-slate-700 hover:bg-neutral-300 hover:underline focus:bg-neutral-300 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-hidden aria-expanded:bg-neutral-300 aria-expanded:text-slate-700 sm:space-x-4 sm:px-4',
          className,
        )}
      >
        <div className="text-md my-auto flex flex-nowrap items-center space-x-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700">
            <FontAwesomeIcon icon={faUser} className="size-5 text-slate-200" />
          </div>
          <span id="menu-label" className="text-md hidden py-2 font-bold sm:block">
            {name}
          </span>
        </div>
        <FontAwesomeIcon icon={faChevronDown} className="my-auto size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <UserName name={name} />
        <MenuItem
          to={t('gcweb:app.menu-dashboard.href', { baseUri: MSCA_BASE_URL })}
          className="text-md flex justify-between text-black hover:bg-zinc-100 hover:text-black focus:bg-zinc-100 active:bg-zinc-100"
        >
          {t('gcweb:app.menu-dashboard')}
        </MenuItem>
        <MenuItem
          to={t('gcweb:app.profile.href', { baseUri: MSCA_BASE_URL })}
          className="text-md flex justify-between text-black hover:bg-zinc-100 hover:text-black focus:bg-zinc-100 active:bg-zinc-100"
        >
          {t('gcweb:app.profile')}
        </MenuItem>
        <MenuItem
          to={t('gcweb:app.security-settings.href', { baseUri: MSCA_BASE_URL })}
          className="text-md flex justify-between text-black hover:bg-zinc-100 hover:text-black focus:bg-zinc-100 active:bg-zinc-100"
        >
          {t('gcweb:app.security-settings')}
        </MenuItem>
        <MenuItem
          to={t('gcweb:app.contact-us.href', { baseUri: MSCA_BASE_URL })}
          className="text-md flex justify-between text-black hover:bg-zinc-100 hover:text-black focus:bg-zinc-100 active:bg-zinc-100"
        >
          {t('gcweb:app.contact-us')}
        </MenuItem>
        <div role="separator" aria-orientation="horizontal" className="-mx-1 my-1 h-px bg-slate-100"></div>
        <MenuItem
          to={`/auth/logout?lang=${currentLanguage}`}
          className="text-md flex justify-between text-black hover:bg-zinc-100 hover:text-black focus:bg-zinc-100 active:bg-zinc-100"
        >
          {t('gcweb:app.logout')}
          <FontAwesomeIcon icon={faRightFromBracket} className="my-auto size-8" />
        </MenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type UserNameProps = {
  name?: string;
};

function UserName({ name }: UserNameProps): JSX.Element {
  return (
    <>
      {name !== undefined && (
        <DropdownMenuLabel className="text-md flex items-center border-b-2 border-slate-600 px-3 py-2 text-gray-300 sm:hidden">
          <FontAwesomeIcon icon={faUser} className="mr-2 size-4" />
          {name}
        </DropdownMenuLabel>
      )}
    </>
  );
}
