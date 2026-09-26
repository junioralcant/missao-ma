'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {buildWhatsappChatLink, formatPhone} from '@/lib/phone';
import type {Registration} from '@/lib/types';
import {ConfirmDialog} from './ConfirmDialog';

type RegistrationsTableProps = {
  registrations: Registration[];
  totalCount: number;
};

const formatDateTime = (utcDateTime: string): string =>
  new Date(`${utcDateTime.replace(' ', 'T')}Z`).toLocaleString('pt-BR');

export const RegistrationsTable = ({
  registrations,
  totalCount,
}: RegistrationsTableProps) => {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<Registration | null>(
    null,
  );

  const handleDelete = async (registration: Registration) => {
    setPendingRemoval(null);
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
      router.refresh();
    } catch {
      setError('Falha de conexão. Tente novamente.');
    }
  };

  return (
    <div>
      {pendingRemoval ? (
        <ConfirmDialog
          title="Remover cadastro"
          message={`Remover o cadastro de ${pendingRemoval.name}? Esta ação não pode ser desfeita.`}
          confirmLabel="Remover cadastro"
          onConfirm={() => handleDelete(pendingRemoval)}
          onCancel={() => setPendingRemoval(null)}
        />
      ) : null}
      <div className="admin-header">
        <h2>
          Cadastros <span className="gold">({totalCount})</span>
        </h2>
        {totalCount > 0 ? (
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
          <p className="empty">
            {totalCount === 0
              ? 'Nenhum cadastro recebido ainda.'
              : 'Nenhum cadastro encontrado com esses filtros.'}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp</th>
                <th>E-mail</th>
                <th>Cidade</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(registration => (
                <tr key={registration.id}>
                  <td>{registration.name}</td>
                  <td className="mono">{formatPhone(registration.whatsapp)}</td>
                  <td>{registration.email}</td>
                  <td>{registration.city}</td>
                  <td className="mono">
                    {formatDateTime(registration.createdAt)}
                  </td>
                  <td>
                    <div className="row-actions">
                      <a
                        className="btn btn--small btn--whatsapp"
                        href={buildWhatsappChatLink(registration.whatsapp)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Conversar com ${registration.name} no WhatsApp`}
                      >
                        WhatsApp
                      </a>
                      <button
                        className="btn btn--small btn--danger"
                        onClick={() => setPendingRemoval(registration)}
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
