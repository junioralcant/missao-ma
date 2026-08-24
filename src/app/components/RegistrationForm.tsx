'use client';

import {FormEvent, useState} from 'react';
import {findCityByName} from '@/lib/cities';
import {formatCpf, isValidCpf} from '@/lib/cpf';
import {CityPicker} from './CityPicker';

type RegistrationFormProps = {
  cities: string[];
};

export const RegistrationForm = ({cities}: RegistrationFormProps) => {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [city, setCity] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [confirmedCity, setConfirmedCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!isValidCpf(cpf)) {
      setError('CPF inválido. Confira os números digitados.');
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
        body: JSON.stringify({name, cpf, city: selectedCity}),
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
        <label htmlFor="cpf">CPF</label>
        <input
          id="cpf"
          className="input-mono"
          value={formatCpf(cpf)}
          onChange={event => setCpf(event.target.value)}
          placeholder="000.000.000-00"
          inputMode="numeric"
          maxLength={14}
          required
        />
      </div>
      <CityPicker
        id="city"
        label="Cidade"
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
          Autorizo o armazenamento do meu nome, CPF e cidade para controle de
          participação nos grupos de WhatsApp.
        </span>
      </label>
      <button className="btn" type="submit" disabled={isSubmitting || !consent}>
        {isSubmitting ? 'Enviando…' : 'Entrar no grupo da minha cidade'}
      </button>
    </form>
  );
};
