import {SiteHeader} from '@/app/components/SiteHeader';
import {getProposal} from '@/lib/proposal';
import {getSignatureRequestByToken} from '@/lib/repository';
import {nowUtc} from '@/lib/signature';
import {isSignatureRequestExpired} from '@/lib/signatureRequest';
import {hashSignatureToken} from '@/lib/signatureToken';
import {ConfirmSignatureCard} from '../components/ConfirmSignatureCard';

type ConfirmSignaturePageProps = {
  params: {token: string};
};

export const dynamic = 'force-dynamic';

export default function ConfirmSignaturePage({
  params,
}: ConfirmSignaturePageProps) {
  const proposal = getProposal();
  const signatureRequest = getSignatureRequestByToken(
    hashSignatureToken(params.token),
  );

  return (
    <>
      <SiteHeader label="Confirmação de assinatura" />
      <main className="page">
        <header className="hero">
          <span className="badge">Iniciativa popular</span>
          <h1>{proposal.title}</h1>
        </header>

        <section className="card">
          <ConfirmSignatureCard
            signatureRequest={signatureRequest}
            isExpired={Boolean(
              signatureRequest &&
              isSignatureRequestExpired(signatureRequest.expiresAt, nowUtc()),
            )}
            token={params.token}
          />
        </section>

        <p className="footer-note">
          Se não foi você quem pediu esta assinatura, ignore esta página: nada é
          registrado sem a confirmação.
        </p>
      </main>
    </>
  );
}
