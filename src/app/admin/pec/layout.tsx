import type {ReactNode} from 'react';
import {SiteHeader} from '@/app/components/SiteHeader';
import {AdminNav} from '@/app/admin/components/AdminNav';
import {SectionTabs} from '@/app/admin/components/SectionTabs';

const PEC_TABS = [
  {href: '/admin/pec', label: 'Resumo'},
  {href: '/admin/pec/assinaturas', label: 'Assinaturas'},
  {href: '/admin/pec/pendentes', label: 'Aguardando confirmação'},
  {href: '/admin/pec/municipios', label: 'Municípios'},
  {href: '/admin/pec/proposta', label: 'Proposta e integridade'},
];

export default function AdminPecLayout({children}: {children: ReactNode}) {
  return (
    <>
      <SiteHeader label="Área administrativa" />
      <AdminNav />
      <main className="page page--wide">
        <header className="admin-header">
          <h1>Assinaturas da PEC</h1>
        </header>
        <SectionTabs label="Seções da PEC" tabs={PEC_TABS} />
        {children}
      </main>
    </>
  );
}
