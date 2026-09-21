'use client';

import {useState} from 'react';
import {ConfirmDialog} from '@/app/admin/components/ConfirmDialog';
import {formatDateTime} from '@/app/pec/format';
import {formatCpf} from '@/lib/cpf';
import type {Signature} from '@/lib/types';

type SignaturesTableProps = {
  signatures: Signature[];
};

export const SignaturesTable = ({
  signatures: initialSignatures,
}: SignaturesTableProps) => {
  const [signatures, setSignatures] = useState(initialSignatures);
  const [error, setError] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<Signature | null>(null);

  const handleDelete = async (signature: Signature) => {
    setPendingRemoval(null);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/pec/signatures/${signature.id}`,
        {method: 'DELETE'},
      );
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Não foi possível remover a assinatura.');
        return;
      }
      setSignatures(current =>
        current.filter(item => item.id !== signature.id),
      );
    } catch {
      setError('Falha de conexão. Tente novamente.');
    }
  };

  return (
    <div>
      {pendingRemoval ? (
        <ConfirmDialog
          title="Remover assinatura"
          message={`Remover a assinatura de ${pendingRemoval.name}? Esta ação não pode ser desfeita e quebra a cadeia de integridade da coleta.`}
          confirmLabel="Remover assinatura"
          onConfirm={() => handleDelete(pendingRemoval)}
          onCancel={() => setPendingRemoval(null)}
        />
      ) : null}
      <div className="admin-header">
        <h2>
          Assinaturas <span className="gold">({signatures.length})</span>
        </h2>
        {signatures.length > 0 ? (
          <a
            className="btn btn--small btn--ghost"
            href="/api/admin/pec/signatures?format=csv"
          >
            Exportar CSV
          </a>
        ) : null}
      </div>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <div className="table-wrap">
        {signatures.length === 0 ? (
          <p className="empty">Nenhuma assinatura registrada ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>E-mail</th>
                <th>Município</th>
                <th>Protocolo</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {signatures.map(signature => (
                <tr key={signature.id}>
                  <td>{signature.name}</td>
                  <td className="mono">{formatCpf(signature.cpf)}</td>
                  <td>{signature.email}</td>
                  <td>{signature.city}</td>
                  <td className="mono">{signature.receipt}</td>
                  <td className="mono">
                    {formatDateTime(signature.createdAt)}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn--small btn--danger"
                        onClick={() => setPendingRemoval(signature)}
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
