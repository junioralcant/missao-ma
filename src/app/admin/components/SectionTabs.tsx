'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import type {SectionTab} from '@/lib/types';

type SectionTabsProps = {
  label: string;
  tabs: SectionTab[];
};

export const SectionTabs = ({label, tabs}: SectionTabsProps) => {
  const pathname = usePathname();

  return (
    <nav className="pec-tabs" aria-label={label}>
      {tabs.map(tab => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            className={isActive ? 'pec-tab pec-tab--active' : 'pec-tab'}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
