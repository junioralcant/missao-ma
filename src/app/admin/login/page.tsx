import {SiteHeader} from '@/app/components/SiteHeader';
import {LoginForm} from '@/app/admin/components/LoginForm';
import {sanitizeAdminRedirect} from '@/lib/session';

export const dynamic = 'force-dynamic';

type AdminLoginPageProps = {
  searchParams: {next?: string};
};

export default function AdminLoginPage({searchParams}: AdminLoginPageProps) {
  return (
    <>
      <SiteHeader />
      <main className="auth">
        <div>
          <div className="auth-eyebrow">Área administrativa</div>
          <h1 className="auth-title">Entrar</h1>
        </div>
        <section className="card">
          <LoginForm next={sanitizeAdminRedirect(searchParams.next)} />
        </section>
      </main>
    </>
  );
}
