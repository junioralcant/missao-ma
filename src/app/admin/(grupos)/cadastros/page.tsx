import {redirect} from 'next/navigation';
import {Pagination} from '@/app/admin/components/Pagination';
import {RegistrationsTable} from '@/app/admin/components/RegistrationsTable';
import {TableFilters} from '@/app/admin/components/TableFilters';
import {
  REGISTRATION_SORT_OPTIONS,
  parseRegistrationFilters,
  queryRegistrations,
} from '@/lib/adminTable';
import {listRegistrations} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';
import type {SearchParams} from '@/lib/types';

export const dynamic = 'force-dynamic';

const BASE_PATH = '/admin/cadastros';

export default function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isAdminRequest()) {
    redirect(`/admin/login?next=${BASE_PATH}`);
  }

  const filters = parseRegistrationFilters(searchParams);
  const registrations = listRegistrations();
  const result = queryRegistrations(registrations, filters);

  return (
    <section className="card">
      <TableFilters
        basePath={BASE_PATH}
        textFilters={[
          {
            name: 'name',
            label: 'Nome',
            value: filters.name,
            placeholder: 'Buscar por nome',
          },
          {
            name: 'city',
            label: 'Cidade',
            value: filters.city,
            placeholder: 'Buscar por cidade',
          },
        ]}
        selectFilters={[
          {
            name: 'sort',
            label: 'Ordenar por',
            value: filters.sort,
            options: REGISTRATION_SORT_OPTIONS,
          },
        ]}
      />
      <RegistrationsTable
        registrations={result.items}
        totalCount={registrations.length}
      />
      {result.totalItems > 0 ? (
        <Pagination
          basePath={BASE_PATH}
          params={{name: filters.name, city: filters.city, sort: filters.sort}}
          {...result}
        />
      ) : null}
    </section>
  );
}
