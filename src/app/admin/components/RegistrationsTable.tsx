'use client';

import {formatCpf} from '@/lib/cpf';
import type {Registration} from '@/lib/types';

type RegistrationsTableProps = {
  registrations: Registration[];
};

const formatDateTime = (utcDateTime: string): string =>
  new Date(`${utcDateTime.replace(' ', 'T')}Z`).toLocaleString('pt-BR');

export const RegistrationsTable = ({
  registrations,
}: RegistrationsTableProps) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);
