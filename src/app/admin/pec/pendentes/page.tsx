import {redirect} from 'next/navigation';
import {Pagination} from '@/app/admin/components/Pagination';
import {TableFilters} from '@/app/admin/components/TableFilters';
import {
  REQUEST_SORT_OPTIONS,
  parseSignatureRequestFilters,
  querySignatureRequests,
} from '@/lib/adminTable';
import {listPendingSignatureRequests} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';
import type {SearchParams} from '@/lib/types';
import {PendingSignaturesTable} from '../components/PendingSignaturesTable';

export const dynamic = 'force-dynamic';

const BASE_PATH = '/admin/pec/pendentes';

export default function AdminPecPendingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isAdminRequest()) {
    redirect(`/admin/login?next=${BASE_PATH}`);
  }

  const filters = parseSignatureRequestFilters(searchParams);
  const requests = listPendingSignatureRequests();
  const result = querySignatureRequests(requests, filters);

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
            name: 'email',
            label: 'E-mail',
            value: filters.email,
            placeholder: 'Buscar por e-mail',
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
            options: REQUEST_SORT_OPTIONS,
          },
        ]}
      />
      <PendingSignaturesTable
        requests={result.items}
        totalCount={requests.length}
      />
      {result.totalItems > 0 ? (
        <Pagination
          basePath={BASE_PATH}
          params={{
            name: filters.name,
            email: filters.email,
            city: filters.city,
            sort: filters.sort,
          }}
          {...result}
        />
      ) : null}
    </section>
  );
}
