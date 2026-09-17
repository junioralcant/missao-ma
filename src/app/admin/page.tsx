import {redirect} from 'next/navigation';
import {SiteHeader} from '@/app/components/SiteHeader';
import {
  getDefaultGroupLink,
  listGroups,
  listRegistrations,
} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';
import {AdminNav} from './components/AdminNav';
import {DefaultGroupCard} from './components/DefaultGroupCard';
import {GroupsManager} from './components/GroupsManager';
import {RegistrationsTable} from './components/RegistrationsTable';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  if (!isAdminRequest()) {
    redirect('/admin/login');
  }

  const groups = listGroups();
  const registrations = listRegistrations();
  const defaultGroupLink = getDefaultGroupLink();

  return (
    <>
      <SiteHeader label="Área administrativa" />
      <AdminNav />
      <main className="page page--wide">
        <header className="admin-header">
          <h1>Área administrativa</h1>
        </header>
        <section className="card">
          <h2>Grupo padrão</h2>
          <DefaultGroupCard initialLink={defaultGroupLink} />
        </section>
        <section className="card">
          <h2>Grupos por cidade</h2>
          <GroupsManager initialGroups={groups} />
        </section>
        <section className="card">
          <RegistrationsTable registrations={registrations} />
        </section>
      </main>
    </>
  );
}
