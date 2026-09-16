import Link from 'next/link';
import {SiteHeader} from '@/app/components/SiteHeader';
import municipalities from '@/data/municipios-ma.json';
import {getProposalDocument} from '@/lib/document';
import {buildProgress} from '@/lib/pec';
import {getProposal} from '@/lib/proposal';
import {countSignaturesByCity, getElectorate} from '@/lib/repository';
import {SignatureForm} from './components/SignatureForm';
import {formatNumber, formatPercent} from './format';

export const dynamic = 'force-dynamic';

export default function PecPage() {
  const cities = [...(municipalities as string[])].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
  const proposal = getProposal();
  const document = getProposalDocument();
  const progress = buildProgress({
    electorate: getElectorate(),
    signaturesByCity: countSignaturesByCity(),
  });

  return (
    <>
      <SiteHeader label="Assinatura popular" />
      <main className="page">
        <header className="hero">
          <span className="badge">Iniciativa popular</span>
          <h1>{proposal.title}</h1>
          <p>{proposal.summary}</p>
        </header>

        <section className="card">
          <div className="pec-meter">
            <div className="pec-meter-head">
              <span className="pec-meter-value">
                {formatNumber(progress.totalSignatures)}
              </span>
              <span className="pec-meter-goal">
                de {formatNumber(progress.stateGoal)} assinaturas
              </span>
            </div>
            <div
              className="pec-bar"
              role="progressbar"
              aria-valuenow={progress.totalSignatures}
              aria-valuemin={0}
              aria-valuemax={progress.stateGoal}
              aria-label="Assinaturas coletadas"
            >
              <span
                className="pec-bar-fill"
                style={{
                  width: formatPercent(
                    progress.totalSignatures / progress.stateGoal,
                  ),
                }}
              />
            </div>
            <p className="muted">
              {formatNumber(progress.qualifiedCount)} de{' '}
              {formatNumber(progress.coverageGoal)} municípios já atingiram a
              própria meta.{' '}
              <Link href="/pec/painel">Ver o painel completo</Link>
            </p>
          </div>
        </section>

        <section className="card">
          <SignatureForm
            cities={cities}
            documentPath={document.downloadPath}
            documentFileName={document.fileName}
          />
        </section>

        <section className="card">
          <h2>O que a lei exige</h2>
          <p className="muted">
            A Assembleia Legislativa do Maranhão só recebe uma proposta de
            emenda de iniciativa popular que cumpra, ao mesmo tempo, os
            requisitos do art. 41, inciso IV, da Constituição Estadual:
          </p>
          <ul className="rule-list">
            <li>
              <strong>2% do eleitorado estadual</strong> — ao menos{' '}
              {formatNumber(progress.stateGoal)} assinaturas, de um eleitorado
              de {formatNumber(progress.stateElectorate)}.
            </li>
            <li>
              <strong>18% dos municípios</strong> — as assinaturas precisam
              estar distribuídas em pelo menos{' '}
              {formatNumber(progress.coverageGoal)} dos{' '}
              {formatNumber(progress.municipalityCount)} municípios maranhenses.
            </li>
            <li>
              <strong>0,3% dos eleitores locais</strong> — em cada município
              abrangido é preciso reunir, no mínimo, essa fração do eleitorado
              da cidade.
            </li>
            <li>
              <strong>Coleta eletrônica</strong> — as assinaturas devem ser
              firmadas, preferencialmente, por meio eletrônico, como nesta
              plataforma.
            </li>
          </ul>
          <p className="muted">
            <Link href="/pec/minuta">Ler a íntegra da proposta</Link>
            {proposal.documentUrl ? (
              <>
                {' · '}
                <a
                  href={proposal.documentUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Documento oficial
                </a>
              </>
            ) : null}
          </p>
        </section>

        <p className="footer-note">
          Seu nome, CPF e município são armazenados exclusivamente para instruir
          o protocolo da proposta na Assembleia Legislativa do Maranhão.
        </p>
      </main>
    </>
  );
}
