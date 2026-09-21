'use client';

import {formatDateTime} from '@/app/pec/format';
import type {SignatureRequest} from '@/lib/types';

type PendingSignaturesTableProps = {
  requests: SignatureRequest[];
};

export const PendingSignaturesTable = ({
  requests,
}: PendingSignaturesTableProps) => (
  <div>
    <div className="admin-header">
      <h2>
        Aguardando confirmação <span className="gold">({requests.length})</span>
      </h2>
    </div>
    <p className="muted">
      Pedidos que ainda não foram confirmados por e-mail. Eles não contam para
      as metas constitucionais: a assinatura só é registrada na cadeia quando a
      pessoa clica em Assinar PEC na mensagem.
    </p>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);
