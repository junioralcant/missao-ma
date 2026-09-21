'use client';

import Link from 'next/link';
import {useState} from 'react';
import {SignatureReceipt} from '@/app/pec/components/SignatureReceipt';
import type {SignatureRequest} from '@/lib/types';

type ConfirmSignatureCardProps = {
  signatureRequest: SignatureRequest | null;
  isExpired: boolean;
  token: string;
};

type ConfirmationResult = {
  receipt: string;
  city: string;
  alreadyConfirmed: boolean;
};

const INVALID_TOKEN_MESSAGE =
  'Link de confirmação inválido. Ele pode ter sido substituído por um pedido mais recente.';

const EXPIRED_TOKEN_MESSAGE =
  'Este link expirou. Preencha o formulário de novo para receber um novo e-mail de confirmação.';

const CONFIRMED_MESSAGE =
  'Esta assinatura já estava confirmada. Ela continua valendo.';

const SUCCESS_MESSAGE =
  'Assinatura confirmada. Obrigado por apoiar a proposta!';

const SignatureLinkError = ({message}: {message: string}) => (
  <div>
    <div className="alert alert--error">{message}</div>
    <Link className="btn" href="/pec">
      Assinar a proposta
    </Link>
  </div>
);

export const ConfirmSignatureCard = ({
  signatureRequest,
  isExpired,
  token,
}: ConfirmSignatureCardProps) => {
  const [error, setError] = useState('');
  const [result, setResult] = useState<ConfirmationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/pec/confirm', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({token}),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Não foi possível confirmar a sua assinatura.');
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
      <SignatureReceipt
        message={result.alreadyConfirmed ? CONFIRMED_MESSAGE : SUCCESS_MESSAGE}
        receipt={result.receipt}
        city={result.city}
      />
    );
  }

  if (!signatureRequest) {
    return <SignatureLinkError message={INVALID_TOKEN_MESSAGE} />;
  }

  if (signatureRequest.status === 'confirmed' && signatureRequest.receipt) {
    return (
      <SignatureReceipt
        message={CONFIRMED_MESSAGE}
        receipt={signatureRequest.receipt}
        city={signatureRequest.city}
      />
    );
  }

  if (isExpired) {
    return <SignatureLinkError message={EXPIRED_TOKEN_MESSAGE} />;
  }

  return (
    <div>
      <p className="confirm-intro">
        Confira os seus dados e conclua a assinatura. Ela só passa a valer
        depois desta confirmação.
      </p>
      <div className="success-city-label">Nome</div>
      <div className="success-city-name">{signatureRequest.name}</div>
      <div className="success-city-label">Município de votação</div>
      <div className="success-city-name">{signatureRequest.city}</div>
      <div className="success-city-label">E-mail</div>
      <div className="success-city-name">{signatureRequest.email}</div>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <button
        className="btn"
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Confirmando…' : 'Assinar PEC'}
      </button>
    </div>
  );
};
