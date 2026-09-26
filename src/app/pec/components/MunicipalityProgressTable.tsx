'use client';

import {useMemo, useState} from 'react';
import {normalizeSearchText} from '@/lib/text';
import type {MunicipalityProgress} from '@/lib/types';
import {formatNumber} from '../format';
import {MunicipalityProgressRows} from './MunicipalityProgressRows';

type MunicipalityProgressTableProps = {
  municipalities: MunicipalityProgress[];
};

type StatusFilter = 'todos' | 'atingidos' | 'pendentes';

const STATUS_LABELS: Record<StatusFilter, string> = {
  todos: 'Todos',
  atingidos: 'Meta atingida',
  pendentes: 'Em andamento',
};

const STATUS_ORDER: StatusFilter[] = ['todos', 'atingidos', 'pendentes'];

const matchesStatus = (
  municipality: MunicipalityProgress,
  status: StatusFilter,
): boolean => {
  if (status === 'atingidos') {
    return municipality.isQualified;
  }
  if (status === 'pendentes') {
    return !municipality.isQualified;
  }
  return true;
};

export const MunicipalityProgressTable = ({
  municipalities,
}: MunicipalityProgressTableProps) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('todos');

  const visible = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim());
    return municipalities.filter(
      municipality =>
        matchesStatus(municipality, status) &&
        (!normalizedQuery ||
          normalizeSearchText(municipality.city).includes(normalizedQuery)),
    );
  }, [municipalities, query, status]);

  return (
    <div>
      <div className="filter-bar">
        <input
          className="filter-input"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Buscar município"
          aria-label="Buscar município"
        />
        <div
          className="filter-chips"
          role="group"
          aria-label="Filtrar por meta"
        >
          {STATUS_ORDER.map(option => (
            <button
              key={option}
              type="button"
              className={option === status ? 'chip chip--active' : 'chip'}
              onClick={() => setStatus(option)}
              aria-pressed={option === status}
            >
              {STATUS_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <p className="muted">
        {formatNumber(visible.length)} de {formatNumber(municipalities.length)}{' '}
        municípios
      </p>

      <MunicipalityProgressRows municipalities={visible} />
    </div>
  );
};
