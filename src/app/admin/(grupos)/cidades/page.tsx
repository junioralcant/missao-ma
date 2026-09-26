import {redirect} from 'next/navigation';
import {GroupCoverageMeter} from '@/app/admin/components/GroupCoverageMeter';
import {GroupsManager} from '@/app/admin/components/GroupsManager';
import {Pagination} from '@/app/admin/components/Pagination';
import {TableFilters} from '@/app/admin/components/TableFilters';
import municipalities from '@/data/municipios-ma.json';
import {
  GROUP_CITY_SORT_OPTIONS,
  GROUP_CITY_STATUS_OPTIONS,
  parseGroupCityFilters,
  queryGroupCities,
} from '@/lib/adminTable';
import {buildGroupCoverage, withRegistrationCounts} from '@/lib/coverage';
import {listGroups, listRegistrations} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';
import type {SearchParams} from '@/lib/types';

export const dynamic = 'force-dynamic';

const BASE_PATH = '/admin/cidades';

export default function AdminGroupCitiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isAdminRequest()) {
    redirect(`/admin/login?next=${BASE_PATH}`);
  }

  const filters = parseGroupCityFilters(searchParams);
  const coverage = buildGroupCoverage(municipalities as string[], listGroups());
  const result = queryGroupCities(
    withRegistrationCounts(coverage.cities, listRegistrations()),
    filters,
  );

  return (
    <section className="card">
      <h2>Grupos por cidade</h2>
      <GroupCoverageMeter coverage={coverage} />
      <GroupsManager
        cities={result.items}
        filters={
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
                label: 'Grupo',
                value: filters.status,
                options: GROUP_CITY_STATUS_OPTIONS,
              },
              {
                name: 'sort',
                label: 'Ordenar por',
                value: filters.sort,
                options: GROUP_CITY_SORT_OPTIONS,
              },
            ]}
          />
        }
      />
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
