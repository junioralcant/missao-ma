'use client';

import {FormEvent, useState} from 'react';
import type {Proposal} from '@/lib/types';

type ProposalCardProps = {
  initialProposal: Proposal;
};

export const ProposalCard = ({initialProposal}: ProposalCardProps) => {
  const [title, setTitle] = useState(initialProposal.title);
  const [summary, setSummary] = useState(initialProposal.summary);
  const [documentUrl, setDocumentUrl] = useState(initialProposal.documentUrl);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/pec/proposal', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title, summary, documentUrl}),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Não foi possível salvar a proposta.');
        return;
      }
      setSuccess('Proposta salva.');
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <p className="muted" style={{marginBottom: 16}}>
        Título e ementa exibidos na página pública de assinatura. Alterá-los
        registra uma nova versão; as assinaturas já coletadas continuam
        contando.
      </p>
      {error ? <div className="alert alert--error">{error}</div> : null}
      {success ? <div className="alert alert--success">{success}</div> : null}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="proposal-title">Título da proposta</label>
          <input
            id="proposal-title"
            value={title}
            onChange={event => setTitle(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="proposal-summary">Ementa</label>
          <textarea
            id="proposal-summary"
            value={summary}
            onChange={event => setSummary(event.target.value)}
            rows={4}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="proposal-document">
            Link da íntegra da minuta (opcional)
          </label>
          <input
            id="proposal-document"
            className="input-mono"
            value={documentUrl}
            onChange={event => setDocumentUrl(event.target.value)}
            placeholder="https://…"
          />
        </div>
        <button
          className="btn btn--small"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
    </div>
  );
};
