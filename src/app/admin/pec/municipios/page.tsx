import {redirect} from 'next/navigation';
import {Pagination} from '@/app/admin/components/Pagination';
import {TableFilters} from '@/app/admin/components/TableFilters';
import {MunicipalityProgressRows} from '@/app/pec/components/MunicipalityProgressRows';
import {
  MUNICIPALITY_SORT_OPTIONS,
  MUNICIPALITY_STATUS_OPTIONS,
  parseMunicipalityFilters,
  queryMunicipalities,
} from '@/lib/adminTable';
import {buildProgress} from '@/lib/pec';
import {countSignaturesByCity, getElectorate} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';
import type {SearchParams} from '@/lib/types';

export const dynamic = 'force-dynamic';

const BASE_PATH = '/admin/pec/municipios';

export default function AdminPecMunicipalitiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isAdminRequest()) {
    redirect(`/admin/login?next=${BASE_PATH}`);
  }

  const filters = parseMunicipalityFilters(searchParams);
  const {municipalities} = buildProgress({
    electorate: getElectorate(),
    signaturesByCity: countSignaturesByCity(),
  });
  const result = queryMunicipalities(municipalities, filters);

  return (
    <section className="card">
      <h2>Progresso por município</h2>
      <TableFilters
        basePath={BASE_PATH}
        textFilters={[
          {
            name: 'city',
            label: 'Cidade',
            value: filters.city,
            placeholder: 'Buscar por cidade',
          },
        ]}
        selectFilters={[
          {
            name: 'status',
            label: 'Meta',
            value: filters.status,
            options: MUNICIPALITY_STATUS_OPTIONS,
          },
          {
            name: 'sort',
            label: 'Ordenar por',
            value: filters.sort,
            options: MUNICIPALITY_SORT_OPTIONS,
          },
        ]}
      />
      <MunicipalityProgressRows municipalities={result.items} />
      {result.totalItems > 0 ? (
        <Pagination
          basePath={BASE_PATH}
          params={{
            city: filters.city,
            status: filters.status,
            sort: filters.sort,
          }}
          {...result}
        />
      ) : null}
    </section>
  );
}
