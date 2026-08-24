'use client';

import {useState} from 'react';
import {formatCpf} from '@/lib/cpf';
import type {Registration} from '@/lib/types';

type RegistrationsTableProps = {
  registrations: Registration[];
};

const formatDateTime = (utcDateTime: string): string =>
  new Date(`${utcDateTime.replace(' ', 'T')}Z`).toLocaleString('pt-BR');

export const RegistrationsTable = ({
  registrations: initialRegistrations,
}: RegistrationsTableProps) => {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [error, setError] = useState('');

  const handleDelete = async (registration: Registration) => {
    if (
      !window.confirm(
        `Remover o cadastro de ${registration.name}? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    setError('');
    try {
      const response = await fetch(
        `/api/admin/registrations/${registration.id}`,
        {method: 'DELETE'},
      );
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Não foi possível remover o cadastro.');
        return;
      }
      setRegistrations(current =>
        current.filter(item => item.id !== registration.id),
      );
    } catch {
      setError('Falha de conexão. Tente novamente.');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h2>
          Cadastros <span className="gold">({registrations.length})</span>
        </h2>
        {registrations.length > 0 ? (
          <a
            className="btn btn--small btn--ghost"
            href="/api/admin/registrations?format=csv"
          >
            Exportar CSV
          </a>
        ) : null}
      </div>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <div className="table-wrap">
        {registrations.length === 0 ? (
          <p className="empty">Nenhum cadastro recebido ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Cidade</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(registration => (
                <tr key={registration.id}>
                  <td>{registration.name}</td>
                  <td className="mono">{formatCpf(registration.cpf)}</td>
                  <td>{registration.city}</td>
                  <td className="mono">
                    {formatDateTime(registration.createdAt)}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn--small btn--danger"
                        onClick={() => handleDelete(registration)}
                      >
                        Remover
                      </button>
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
