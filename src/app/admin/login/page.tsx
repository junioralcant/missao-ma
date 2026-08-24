'use client';

import {FormEvent, useState} from 'react';
import {useRouter} from 'next/navigation';
import {SiteHeader} from '@/app/components/SiteHeader';

export default function AdminLoginPage() {
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
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="auth">
        <div>
          <div className="auth-eyebrow">Área administrativa</div>
          <h1 className="auth-title">Entrar</h1>
        </div>
        <section className="card">
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
        </section>
      </main>
    </>
  );
}
