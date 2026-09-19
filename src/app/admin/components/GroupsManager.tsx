'use client';

import {FormEvent, useMemo, useRef, useState} from 'react';
import {CityPicker} from '@/app/components/CityPicker';
import municipalities from '@/data/municipios-ma.json';
import {findCityByName} from '@/lib/cities';
import {buildGroupCoverage} from '@/lib/coverage';
import {normalizeSearchText} from '@/lib/text';
import type {Group, GroupCoverageCity} from '@/lib/types';
import {ConfirmDialog} from './ConfirmDialog';
import {GroupCoverageMeter} from './GroupCoverageMeter';

type GroupsManagerProps = {
  initialGroups: Group[];
};

type CoverageFilter = 'todos' | 'com-grupo' | 'sem-grupo';

const FILTER_LABELS: Record<CoverageFilter, string> = {
  todos: 'Todos',
  'com-grupo': 'Com grupo',
  'sem-grupo': 'Sem grupo',
};

const FILTER_ORDER: CoverageFilter[] = ['todos', 'com-grupo', 'sem-grupo'];

const matchesFilter = (
  item: GroupCoverageCity,
  filter: CoverageFilter,
): boolean => {
  if (filter === 'com-grupo') {
    return Boolean(item.group);
  }
  if (filter === 'sem-grupo') {
    return !item.group;
  }
  return true;
};

export const GroupsManager = ({initialGroups}: GroupsManagerProps) => {
  const [groups, setGroups] = useState(initialGroups);
  const [city, setCity] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLink, setEditingLink] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<Group | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CoverageFilter>('todos');
  const linkInputRef = useRef<HTMLInputElement>(null);

  const coverage = useMemo(
    () => buildGroupCoverage(municipalities as string[], groups),
    [groups],
  );

  const visibleCities = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim());
    return coverage.cities.filter(
      item =>
        matchesFilter(item, filter) &&
        (!normalizedQuery ||
          normalizeSearchText(item.city).includes(normalizedQuery)),
    );
  }, [coverage, filter, query]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const selectedCity = findCityByName(municipalities as string[], city);
    if (!selectedCity) {
      setError('Selecione um município válido do Maranhão.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({city: selectedCity, whatsappLink}),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Não foi possível cadastrar o grupo.');
        return;
      }
      setGroups(current => [...current, data.group]);
      setCity('');
      setWhatsappLink('');
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartCreate = (selectedCity: string) => {
    setError('');
    setEditingId(null);
    setCity(selectedCity);
    setWhatsappLink('');
    linkInputRef.current?.focus();
  };

  const handleStartEdit = (group: Group) => {
    setError('');
    setEditingId(group.id);
    setEditingLink(group.whatsappLink);
  };

  const handleSaveEdit = async (id: number) => {
    setError('');
    try {
      const response = await fetch(`/api/admin/groups/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({whatsappLink: editingLink}),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Não foi possível atualizar o link.');
        return;
      }
      setGroups(current =>
        current.map(group => (group.id === id ? data.group : group)),
      );
      setEditingId(null);
    } catch {
      setError('Falha de conexão. Tente novamente.');
    }
  };

  const handleDelete = async (group: Group) => {
    setPendingRemoval(null);
    setError('');
    try {
      const response = await fetch(`/api/admin/groups/${group.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Não foi possível remover o grupo.');
        return;
      }
      setGroups(current => current.filter(item => item.id !== group.id));
    } catch {
      setError('Falha de conexão. Tente novamente.');
    }
  };

  return (
    <div>
      {pendingRemoval ? (
        <ConfirmDialog
          title="Remover grupo"
          message={`Remover o grupo de ${pendingRemoval.city}? Quem escolher esta cidade passa a ser direcionado ao grupo padrão.`}
          confirmLabel="Remover grupo"
          onConfirm={() => handleDelete(pendingRemoval)}
          onCancel={() => setPendingRemoval(null)}
        />
      ) : null}
      <GroupCoverageMeter coverage={coverage} />
      {error ? <div className="alert alert--error">{error}</div> : null}
      <form className="inline-form" onSubmit={handleCreate}>
        <CityPicker
          id="group-city"
          label="Cidade (MA)"
          cities={municipalities as string[]}
          value={city}
          onChange={setCity}
          placeholder="Digite para buscar…"
        />
        <div className="field">
          <label htmlFor="group-link">Link do grupo</label>
          <input
            id="group-link"
            ref={linkInputRef}
            className="input-mono"
            value={whatsappLink}
            onChange={event => setWhatsappLink(event.target.value)}
            placeholder="https://chat.whatsapp.com/…"
            required
          />
        </div>
        <button
          className="btn btn--small"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando…' : 'Cadastrar'}
        </button>
      </form>

      <div className="filter-bar" style={{marginTop: 20}}>
        <input
          className="filter-input"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Buscar município"
          aria-label="Buscar município"
        />
        <div className="filter-chips" role="group" aria-label="Filtrar cidades">
          {FILTER_ORDER.map(option => (
            <button
              key={option}
              type="button"
              className={option === filter ? 'chip chip--active' : 'chip'}
              onClick={() => setFilter(option)}
              aria-pressed={option === filter}
            >
              {FILTER_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <p className="muted">
        {visibleCities.length} de {coverage.total} municípios
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cidade</th>
              <th>Link</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {visibleCities.length === 0 ? (
              <tr>
                <td colSpan={3} className="muted">
                  Nenhum município encontrado.
                </td>
              </tr>
            ) : (
              visibleCities.map(({city: cityName, group}) => (
                <tr key={cityName}>
                  <td>
                    <span
                      className={group ? 'dot dot--done' : 'dot'}
                      aria-hidden="true"
                    />
                    {cityName}
                  </td>
                  <td className="link-cell">
                    {!group ? (
                      <span className="muted">Sem grupo</span>
                    ) : editingId === group.id ? (
                      <input
                        value={editingLink}
                        onChange={event => setEditingLink(event.target.value)}
                        style={{width: '100%'}}
                      />
                    ) : (
                      <a
                        href={group.whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {group.whatsappLink}
                      </a>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      {!group ? (
                        <button
                          className="btn btn--small btn--ghost"
                          onClick={() => handleStartCreate(cityName)}
                        >
                          Cadastrar
                        </button>
                      ) : editingId === group.id ? (
                        <>
                          <button
                            className="btn btn--small"
                            onClick={() => handleSaveEdit(group.id)}
                          >
                            Salvar
                          </button>
                          <button
                            className="btn btn--small btn--ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn--small btn--ghost"
                            onClick={() => handleStartEdit(group)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn--small btn--danger"
                            onClick={() => setPendingRemoval(group)}
                          >
                            Remover
                          </button>
                        </>
                      )}
                    </div>
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
