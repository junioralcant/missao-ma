'use client';

import {useRouter} from 'next/navigation';
import {FormEvent, useState} from 'react';

type LoginFormProps = {
  next: string;
};

export const LoginForm = ({next}: LoginFormProps) => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({password}),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Senha inválida.');
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          className="input-mono"
          value={password}
          onChange={event => setPassword(event.target.value)}
          placeholder="Senha de administrador"
          required
        />
      </div>
      <button className="btn" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
};
