'use client';

import {FormEvent, useState} from 'react';
import {
  MAX_INSTAGRAM_INPUT_LENGTH,
  formatInstagram,
  isValidInstagram,
  sanitizeInstagram,
} from '@/lib/instagram';
import {formatPhone, isValidPhone} from '@/lib/phone';

export const CompleteRegistrationForm = () => {
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [savedInstagram, setSavedInstagram] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!isValidPhone(whatsapp)) {
      setError('Número de WhatsApp inválido. Informe o DDD e os 9 dígitos.');
      return;
    }

    if (!isValidInstagram(instagram)) {
      setError(
        'Usuário do Instagram inválido. Use apenas letras, números, ponto e sublinhado.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/register/instagram', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({whatsapp, instagram}),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Não foi possível atualizar o cadastro.');
        return;
      }
      setSavedInstagram(formatInstagram(instagram));
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (savedInstagram) {
    return (
      <div>
        <div className="alert alert--success">
          Pronto! Seu Instagram foi adicionado ao cadastro.
        </div>
        <div className="success-city-label">Instagram</div>
        <div className="success-city-name">{savedInstagram}</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <div className="field">
        <label htmlFor="whatsapp">Número do WhatsApp cadastrado</label>
        <input
          id="whatsapp"
          className="input-mono"
          value={formatPhone(whatsapp)}
          onChange={event => setWhatsapp(event.target.value)}
          placeholder="(98) 99999-9999"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={15}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="instagram">Usuário do Instagram pessoal</label>
        <input
          id="instagram"
          value={instagram}
          onChange={event =>
            setInstagram(sanitizeInstagram(event.target.value))
          }
          placeholder="@seuusuario"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={MAX_INSTAGRAM_INPUT_LENGTH}
          required
        />
      </div>
      <label className="consent">
        <input
          type="checkbox"
          className="checkbox-input"
          checked={consent}
          onChange={event => setConsent(event.target.checked)}
          required
        />
        <span className="checkbox-box" aria-hidden="true">
          ✓
        </span>
        <span>
          Autorizo o armazenamento do meu usuário do Instagram junto ao meu
          cadastro para controle de participação nos grupos de WhatsApp.
        </span>
      </label>
      <button className="btn" type="submit" disabled={isSubmitting || !consent}>
        {isSubmitting ? 'Enviando…' : 'Adicionar Instagram'}
      </button>
    </form>
  );
};
