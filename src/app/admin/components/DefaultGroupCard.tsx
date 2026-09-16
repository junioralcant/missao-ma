'use client';

import {FormEvent, useState} from 'react';
import {ConfirmDialog} from './ConfirmDialog';

type DefaultGroupCardProps = {
  initialLink: string | null;
};

export const DefaultGroupCard = ({initialLink}: DefaultGroupCardProps) => {
  const [savedLink, setSavedLink] = useState(initialLink);
  const [link, setLink] = useState(initialLink ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/default-group', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({whatsappLink: link}),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Não foi possível salvar o grupo padrão.');
        return;
      }
      setSavedLink(data.whatsappLink);
      setLink(data.whatsappLink);
      setSuccess('Grupo padrão salvo.');
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    setIsConfirmingRemoval(false);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/default-group', {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Não foi possível remover o grupo padrão.');
        return;
      }
      setSavedLink(null);
      setLink('');
      setSuccess('Grupo padrão removido.');
    } catch {
      setError('Falha de conexão. Tente novamente.');
    }
  };

  return (
    <div>
      {isConfirmingRemoval ? (
        <ConfirmDialog
          title="Remover grupo padrão"
          message="Remover o grupo padrão? Cidades sem grupo próprio deixam de conseguir concluir o cadastro."
          confirmLabel="Remover grupo padrão"
          onConfirm={handleRemove}
          onCancel={() => setIsConfirmingRemoval(false)}
        />
      ) : null}
      <p className="muted" style={{marginBottom: 16}}>
        Usado quando a cidade escolhida ainda não tem grupo próprio.
      </p>
      {error ? <div className="alert alert--error">{error}</div> : null}
      {success ? <div className="alert alert--success">{success}</div> : null}
      <form className="inline-form" onSubmit={handleSave}>
        <div className="field">
          <label htmlFor="default-group-link">Link do grupo padrão</label>
          <input
            id="default-group-link"
            className="input-mono"
            value={link}
            onChange={event => setLink(event.target.value)}
            placeholder="https://chat.whatsapp.com/…"
            required
          />
        </div>
        <button
          className="btn btn--small"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </button>
        {savedLink ? (
          <button
            className="btn btn--small btn--danger"
            type="button"
            onClick={() => setIsConfirmingRemoval(true)}
          >
            Remover
          </button>
        ) : null}
      </form>
      {!savedLink ? (
        <p className="muted" style={{marginTop: 12}}>
          Nenhum grupo padrão configurado — cadastros só concluem em cidades com
          grupo próprio.
        </p>
      ) : null}
    </div>
  );
};
