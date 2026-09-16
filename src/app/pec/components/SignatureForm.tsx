'use client';

import Link from 'next/link';
import {FormEvent, useState} from 'react';
import {CityPicker} from '@/app/components/CityPicker';
import {findCityByName} from '@/lib/cities';
import {SIGNATURE_CONSENT_TEXT, SIGNATURE_READING_TEXT} from '@/lib/consent';
import {formatCpf, isValidCpf} from '@/lib/cpf';

type SignatureFormProps = {
  cities: string[];
  documentPath: string;
  documentFileName: string;
};

type SignatureResult = {
  receipt: string;
  city: string;
  alreadySigned: boolean;
};

export const SignatureForm = ({
  cities,
  documentPath,
  documentFileName,
}: SignatureFormProps) => {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [city, setCity] = useState('');
  const [hasReadDocument, setHasReadDocument] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SignatureResult | null>(null);
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
      setError('Selecione o seu município de votação na lista.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/pec/sign', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name,
          cpf,
          city: selectedCity,
          consent,
          hasReadDocument,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Não foi possível registrar a sua assinatura.');
        return;
      }
      setResult(data);
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div>
        <div className="alert alert--success">
          {result.alreadySigned
            ? 'Você já havia assinado esta proposta. Sua assinatura continua valendo.'
            : 'Assinatura registrada. Obrigado por apoiar a proposta!'}
        </div>
        <div className="success-city-label">Protocolo da assinatura</div>
        <div className="receipt-code">{result.receipt}</div>
        <div className="success-city-label">Município de votação</div>
        <div className="success-city-name">{result.city}</div>
        <Link className="btn" href="/pec/painel">
          Ver o andamento da coleta
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <div className="field">
        <label htmlFor="signature-name">Nome completo</label>
        <input
          id="signature-name"
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Seu nome completo, como no título de eleitor"
          minLength={3}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="signature-cpf">CPF</label>
        <input
          id="signature-cpf"
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
        id="signature-city"
        label="Município onde você vota"
        cities={cities}
        value={city}
        onChange={setCity}
        placeholder="Digite o nome do município"
      />
      <div className="document-callout">
        <p>
          Antes de assinar, leia a íntegra da proposta. Você pode lê-la nesta
          plataforma ou baixar o documento original.
        </p>
        <div className="row-actions">
          <Link className="btn btn--small" href="/pec/minuta">
            Ler a proposta
          </Link>
          <a
            className="btn btn--small btn--ghost"
            href={documentPath}
            download={documentFileName}
          >
            Baixar o documento
          </a>
        </div>
      </div>
      <label className="consent">
        <input
          type="checkbox"
          className="checkbox-input"
          checked={hasReadDocument}
          onChange={event => setHasReadDocument(event.target.checked)}
          required
        />
        <span className="checkbox-box" aria-hidden="true">
          ✓
        </span>
        <span>{SIGNATURE_READING_TEXT}</span>
      </label>
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
        <span>{SIGNATURE_CONSENT_TEXT}</span>
      </label>
      <button
        className="btn"
        type="submit"
        disabled={isSubmitting || !consent || !hasReadDocument}
      >
        {isSubmitting ? 'Registrando…' : 'Assinar a proposta'}
      </button>
    </form>
  );
};
