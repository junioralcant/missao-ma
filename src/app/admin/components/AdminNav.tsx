'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {LogoutButton} from './LogoutButton';

const ADMIN_NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Grupos de WhatsApp',
    paths: ['/admin', '/admin/cidades', '/admin/cadastros'],
  },
  {
    href: '/admin/pec',
    label: 'Assinaturas da PEC',
    paths: [
      '/admin/pec',
      '/admin/pec/assinaturas',
      '/admin/pec/pendentes',
      '/admin/pec/municipios',
      '/admin/pec/proposta',
    ],
  },
];

export const AdminNav = () => {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Painéis administrativos">
      <div className="admin-nav-links">
        {ADMIN_NAV_ITEMS.map(item => {
          const isActive = item.paths.includes(pathname);
          return (
            <Link
              key={item.href}
              className={
                isActive
                  ? 'admin-nav-link admin-nav-link--active'
                  : 'admin-nav-link'
              }
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <LogoutButton />
    </nav>
  );
};
