import {redirect} from 'next/navigation';
import municipalities from '@/data/municipios-ma.json';
import {buildGroupCoverage} from '@/lib/coverage';
import {getDefaultGroupLink, listGroups} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';
import {DefaultGroupCard} from '../components/DefaultGroupCard';
import {GroupCoverageMeter} from '../components/GroupCoverageMeter';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  if (!isAdminRequest()) {
    redirect('/admin/login');
  }

  const coverage = buildGroupCoverage(municipalities as string[], listGroups());

  return (
    <>
      <section className="card">
        <h2>Cobertura</h2>
        <GroupCoverageMeter coverage={coverage} />
      </section>
      <section className="card">
        <h2>Grupo padrão</h2>
        <DefaultGroupCard initialLink={getDefaultGroupLink()} />
      </section>
    </>
  );
}
