import Link from 'next/link';
import {formatNumber} from '@/app/pec/format';
import {buildPageHref, getPageWindow} from '@/lib/adminTable';

type PaginationProps = {
  basePath: string;
  params: Record<string, string>;
  page: number;
  totalPages: number;
  totalItems: number;
  firstItem: number;
  lastItem: number;
};

export const Pagination = ({
  basePath,
  params,
  page,
  totalPages,
  totalItems,
  firstItem,
  lastItem,
}: PaginationProps) => (
  <nav className="pagination" aria-label="Paginação">
    <p className="muted">
      Mostrando {formatNumber(firstItem)}–{formatNumber(lastItem)} de{' '}
      {formatNumber(totalItems)}
    </p>
    {totalPages > 1 ? (
      <div className="pagination-links">
        {page > 1 ? (
          <Link
            className="chip"
            href={buildPageHref(basePath, params, page - 1)}
          >
            Anterior
          </Link>
        ) : null}
        {getPageWindow(page, totalPages).map(number => (
          <Link
            key={number}
            className={number === page ? 'chip chip--active' : 'chip'}
            href={buildPageHref(basePath, params, number)}
            aria-current={number === page ? 'page' : undefined}
          >
            {number}
          </Link>
        ))}
        {page < totalPages ? (
          <Link
            className="chip"
            href={buildPageHref(basePath, params, page + 1)}
          >
            Próxima
          </Link>
        ) : null}
      </div>
    ) : null}
  </nav>
);
