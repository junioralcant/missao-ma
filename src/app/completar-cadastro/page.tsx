import Link from 'next/link';
import {SiteHeader} from '@/app/components/SiteHeader';
import {CompleteRegistrationForm} from './components/CompleteRegistrationForm';

export default function CompleteRegistrationPage() {
  return (
    <>
      <SiteHeader label="Completar cadastro" />
      <main className="page">
        <header className="hero">
          <span className="badge">Grupos de WhatsApp</span>
          <h1>Adicione seu Instagram ao cadastro</h1>
          <p>
            Já faz parte do grupo da sua cidade? Informe o número de WhatsApp
            que você cadastrou e o usuário do seu Instagram pessoal.
          </p>
        </header>
        <section className="card">
          <CompleteRegistrationForm />
        </section>
        <p className="footer-note">
          Ainda não tem cadastro?{' '}
          <Link href="/">Entre no grupo da sua cidade</Link>
        </p>
      </main>
    </>
  );
}
