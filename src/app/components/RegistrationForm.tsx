'use client';

import {FormEvent, useState} from 'react';
import {findCityByName} from '@/lib/cities';
import {MAX_EMAIL_LENGTH, isValidEmail, sanitizeEmail} from '@/lib/email';
import {formatPhone, isValidPhone} from '@/lib/phone';
import {CityPicker} from './CityPicker';

type RegistrationFormProps = {
  cities: string[];
};

export const RegistrationForm = ({cities}: RegistrationFormProps) => {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [confirmedCity, setConfirmedCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!isValidPhone(whatsapp)) {
      setError('Número de WhatsApp inválido. Informe o DDD e os 9 dígitos.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('E-mail inválido. Confira o endereço digitado.');
      return;
    }

    const selectedCity = findCityByName(cities, city);
    if (!selectedCity) {
      setError('Selecione uma cidade da lista.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, whatsapp, email, city: selectedCity}),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Não foi possível concluir o cadastro.');
        return;
      }
      setWhatsappLink(data.whatsappLink);
      setConfirmedCity(selectedCity);
      window.location.href = data.whatsappLink;
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cities.length === 0) {
    return (
      <p className="empty">Ainda não há grupos cadastrados. Volte em breve!</p>
    );
  }

  if (whatsappLink) {
    return (
      <div>
        <div className="alert alert--success">
          Cadastro realizado! Estamos te redirecionando para o grupo…
        </div>
        <div className="success-city-label">Cidade</div>
        <div className="success-city-name">{confirmedCity}</div>
        <a className="btn" href={whatsappLink}>
          Entrar no grupo do WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <div className="field">
        <label htmlFor="name">Nome completo</label>
        <input
          id="name"
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Seu nome completo"
          minLength={3}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="whatsapp">Número do WhatsApp</label>
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
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={event => setEmail(sanitizeEmail(event.target.value))}
          placeholder="voce@exemplo.com"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={MAX_EMAIL_LENGTH}
          required
        />
      </div>
      <CityPicker
        id="city"
        label="Cidade de atuação"
        cities={cities}
        value={city}
        onChange={setCity}
        placeholder="Digite o nome da sua cidade"
      />
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
          Autorizo o armazenamento do meu nome, número de WhatsApp, e-mail e
          cidade de atuação para controle de participação nos grupos de
          WhatsApp.
        </span>
      </label>
      <button className="btn" type="submit" disabled={isSubmitting || !consent}>
        {isSubmitting ? 'Enviando…' : 'Entrar no grupo da minha cidade'}
      </button>
    </form>
  );
};
