import {redirect} from 'next/navigation';
import {Pagination} from '@/app/admin/components/Pagination';
import {TableFilters} from '@/app/admin/components/TableFilters';
import {
  ENTRY_SORT_OPTIONS,
  parseSignatureFilters,
  querySignatures,
} from '@/lib/adminTable';
import {listSignatures} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';
import type {SearchParams} from '@/lib/types';
import {SignaturesTable} from '../components/SignaturesTable';

export const dynamic = 'force-dynamic';

const BASE_PATH = '/admin/pec/assinaturas';

export default function AdminPecSignaturesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isAdminRequest()) {
    redirect(`/admin/login?next=${BASE_PATH}`);
  }

  const filters = parseSignatureFilters(searchParams);
  const signatures = listSignatures();
  const result = querySignatures(signatures, filters);

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
            options: ENTRY_SORT_OPTIONS,
          },
        ]}
      />
      <SignaturesTable
        signatures={result.items}
        totalCount={signatures.length}
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
