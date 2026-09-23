'use client';

import {useState} from 'react';
import {ConfirmDialog} from '@/app/admin/components/ConfirmDialog';
import {formatDateTime} from '@/app/pec/format';
import type {SignatureRequest} from '@/lib/types';

type PendingSignaturesTableProps = {
  requests: SignatureRequest[];
};

export const PendingSignaturesTable = ({
  requests: initialRequests,
}: PendingSignaturesTableProps) => {
  const [requests, setRequests] = useState(initialRequests);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [resentIds, setResentIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingResend, setPendingResend] = useState<SignatureRequest | null>(
    null,
  );

  const handleResend = async (request: SignatureRequest) => {
    setPendingResend(null);
    setSendingId(request.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(
        `/api/admin/pec/requests/${request.id}/resend`,
        {method: 'POST'},
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Não foi possível reenviar o e-mail.');
        return;
      }
      setRequests(current =>
        current.map(item =>
          item.id === request.id ? {...item, expiresAt: data.expiresAt} : item,
        ),
      );
      setResentIds(current => [...current, request.id]);
      setNotice(`E-mail reenviado para ${request.email}.`);
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div>
      {pendingResend ? (
        <ConfirmDialog
          title="Reenviar e-mail"
          message={`Reenviar o e-mail de confirmação para ${pendingResend.email}? O link enviado antes deixa de funcionar e o novo vale por 48 horas.`}
          confirmLabel="Reenviar e-mail"
          tone="primary"
          onConfirm={() => handleResend(pendingResend)}
          onCancel={() => setPendingResend(null)}
        />
      ) : null}
      <div className="admin-header">
        <h2>
          Aguardando confirmação{' '}
          <span className="gold">({requests.length})</span>
        </h2>
      </div>
      <p className="muted">
        Pedidos que ainda não foram confirmados por e-mail. Eles não contam para
        as metas constitucionais: a assinatura só é registrada na cadeia quando
        a pessoa clica em Assinar PEC na mensagem. Reenviar o e-mail gera um
        link novo, válido por 48 horas, e invalida o anterior.
      </p>
      {error ? <div className="alert alert--error">{error}</div> : null}
      {notice ? <div className="alert alert--success">{notice}</div> : null}
      <div className="table-wrap">
        {requests.length === 0 ? (
          <p className="empty">Nenhum pedido aguardando confirmação.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Município</th>
                <th>Pedido em</th>
                <th>Expira em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id}>
                  <td>{request.name}</td>
                  <td>{request.email}</td>
                  <td>{request.city}</td>
                  <td className="mono">{formatDateTime(request.createdAt)}</td>
                  <td className="mono">{formatDateTime(request.expiresAt)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn--small btn--ghost"
                        disabled={sendingId !== null}
                        onClick={() => setPendingResend(request)}
                      >
                        {sendingId === request.id
                          ? 'Enviando...'
                          : resentIds.includes(request.id)
                            ? 'Reenviado'
                            : 'Reenviar e-mail'}
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
