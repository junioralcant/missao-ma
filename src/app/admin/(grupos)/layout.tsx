import type {ReactNode} from 'react';
import {SiteHeader} from '@/app/components/SiteHeader';
import {AdminNav} from '@/app/admin/components/AdminNav';
import {SectionTabs} from '@/app/admin/components/SectionTabs';

const GROUP_TABS = [
  {href: '/admin', label: 'Resumo'},
  {href: '/admin/cidades', label: 'Grupos por cidade'},
  {href: '/admin/cadastros', label: 'Cadastros'},
];

export default function AdminGroupsLayout({children}: {children: ReactNode}) {
  return (
    <>
      <SiteHeader label="Área administrativa" />
      <AdminNav />
      <main className="page page--wide">
        <header className="admin-header">
          <h1>Grupos de WhatsApp</h1>
        </header>
        <SectionTabs label="Seções dos grupos" tabs={GROUP_TABS} />
        {children}
      </main>
    </>
  );
}
