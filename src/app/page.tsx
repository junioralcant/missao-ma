import municipalities from '@/data/municipios-ma.json';
import {RegistrationForm} from './components/RegistrationForm';
import {SiteHeader} from './components/SiteHeader';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const cities = [...(municipalities as string[])].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );

  return (
    <>
      <SiteHeader />
      <main className="page">
        <header className="hero">
          <span className="badge">Grupos de WhatsApp</span>
          <h1>Grupo de WhatsApp da sua cidade</h1>
          <p>
            Informe seus dados, escolha a sua cidade e entre no grupo de
            WhatsApp da sua região.
          </p>
        </header>
        <section className="card">
          <RegistrationForm cities={cities} />
        </section>
        <p className="footer-note">
          Seus dados (nome, CPF e cidade) são armazenados apenas para controle
          de participação nos grupos.
        </p>
      </main>
    </>
  );
}
