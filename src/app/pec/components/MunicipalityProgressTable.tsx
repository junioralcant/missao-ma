'use client';

import {useMemo, useState} from 'react';
import {normalizeSearchText} from '@/lib/text';
import type {MunicipalityProgress} from '@/lib/types';
import {formatNumber, formatPercent, formatRatio} from '../format';

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

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Município</th>
              <th>Eleitores</th>
              <th>Meta (0,3%)</th>
              <th>Assinaturas</th>
              <th>Progresso</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  Nenhum município encontrado.
                </td>
              </tr>
            ) : (
              visible.map(municipality => (
                <tr key={municipality.city}>
                  <td>
                    {municipality.isQualified ? (
                      <span className="dot dot--done" aria-hidden="true" />
                    ) : (
                      <span className="dot" aria-hidden="true" />
                    )}
                    {municipality.city}
                  </td>
                  <td className="mono">
                    {formatNumber(municipality.electorate)}
                  </td>
                  <td className="mono">{formatNumber(municipality.goal)}</td>
                  <td
                    className={municipality.isQualified ? 'mono gold' : 'mono'}
                  >
                    {formatNumber(municipality.signatures)}
                  </td>
                  <td className="progress-cell">
                    <span className="pec-bar pec-bar--thin">
                      <span
                        className="pec-bar-fill"
                        style={{
                          width: formatPercent(
                            municipality.signatures / municipality.goal,
                          ),
                        }}
                      />
                    </span>
                    <span className="mono">
                      {formatRatio(municipality.ratio)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
