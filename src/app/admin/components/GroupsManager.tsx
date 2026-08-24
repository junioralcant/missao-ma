'use client';

import {FormEvent, useState} from 'react';
import {CityPicker} from '@/app/components/CityPicker';
import municipalities from '@/data/municipios-ma.json';
import {findCityByName} from '@/lib/cities';
import type {Group} from '@/lib/types';

type GroupsManagerProps = {
  initialGroups: Group[];
};

export const GroupsManager = ({initialGroups}: GroupsManagerProps) => {
  const [groups, setGroups] = useState(initialGroups);
  const [city, setCity] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLink, setEditingLink] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortByCity = (list: Group[]) =>
    [...list].sort((a, b) => a.city.localeCompare(b.city, 'pt-BR'));

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
      setGroups(current => sortByCity([...current, data.group]));
      setCity('');
      setWhatsappLink('');
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
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
    if (!window.confirm(`Remover o grupo de ${group.city}?`)) {
      return;
    }
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
      <div className="table-wrap" style={{marginTop: 20}}>
        {groups.length === 0 ? (
          <p className="empty">Nenhum grupo cadastrado ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cidade</th>
                <th>Link</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <tr key={group.id}>
                  <td>{group.city}</td>
                  <td className="link-cell">
                    {editingId === group.id ? (
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
                      {editingId === group.id ? (
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
                            onClick={() => handleDelete(group)}
                          >
                            Remover
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
