import Link from 'next/link';
import {SiteHeader} from '@/app/components/SiteHeader';
import {
  MUNICIPALITY_COVERAGE_RATE,
  MUNICIPALITY_SIGNATURE_RATE,
  STATE_SIGNATURE_RATE,
  buildProgress,
} from '@/lib/pec';
import {getProposal} from '@/lib/proposal';
import {
  countSignaturesByCity,
  getElectorate,
  getElectorateSource,
} from '@/lib/repository';
import {MunicipalityProgressTable} from '../components/MunicipalityProgressTable';
import {formatNumber, formatPercent, formatRatio} from '../format';

export const dynamic = 'force-dynamic';

const ESTIMATE_ORIGIN = 'estimativa';

export default function PecPanelPage() {
  const proposal = getProposal();
  const source = getElectorateSource();
  const progress = buildProgress({
    electorate: getElectorate(),
    signaturesByCity: countSignaturesByCity(),
  });

  return (
    <>
      <SiteHeader label="Painel da coleta" />
      <main className="page page--wide">
        <header className="admin-header">
          <h1>Andamento da coleta</h1>
          <Link className="btn btn--small btn--ghost" href="/pec">
            Assinar a proposta
          </Link>
        </header>

        <p className="muted">{proposal.title}</p>

        {source?.origin === ESTIMATE_ORIGIN ? (
          <div className="alert alert--error">
            Eleitorado provisório: os totais por município são estimativas até a
            importação da tabela oficial do TSE. As metas mudam quando o dado
            oficial for carregado.
          </div>
        ) : null}

        <section className="card">
          <h2>Requisitos do art. 41, IV, da Constituição do Maranhão</h2>
          <div className="stat-grid">
            <article
              className={progress.isStateGoalMet ? 'stat stat--done' : 'stat'}
            >
              <span className="stat-label">
                Assinaturas ({formatRatio(STATE_SIGNATURE_RATE)} do eleitorado)
              </span>
              <span className="stat-value">
                {formatNumber(progress.totalSignatures)}
              </span>
              <span className="stat-goal">
                meta {formatNumber(progress.stateGoal)}
              </span>
              <span className="pec-bar">
                <span
                  className="pec-bar-fill"
                  style={{
                    width: formatPercent(
                      progress.totalSignatures / progress.stateGoal,
                    ),
                  }}
                />
              </span>
            </article>

            <article
              className={
                progress.isCoverageGoalMet ? 'stat stat--done' : 'stat'
              }
            >
              <span className="stat-label">
                Municípios abrangidos ({formatRatio(MUNICIPALITY_COVERAGE_RATE)}{' '}
                do estado)
              </span>
              <span className="stat-value">
                {formatNumber(progress.qualifiedCount)}
              </span>
              <span className="stat-goal">
                meta {formatNumber(progress.coverageGoal)} de{' '}
                {formatNumber(progress.municipalityCount)}
              </span>
              <span className="pec-bar">
                <span
                  className="pec-bar-fill"
                  style={{
                    width: formatPercent(
                      progress.qualifiedCount / progress.coverageGoal,
                    ),
                  }}
                />
              </span>
            </article>

            <article
              className={progress.isReadyToFile ? 'stat stat--done' : 'stat'}
            >
              <span className="stat-label">Situação para protocolo</span>
              <span className="stat-value">
                {progress.isReadyToFile ? 'Apta' : 'Em coleta'}
              </span>
              <span className="stat-goal">
                {formatNumber(progress.signaturesInQualified)} assinaturas em
                municípios que já cumprem a fração de{' '}
                {formatRatio(MUNICIPALITY_SIGNATURE_RATE)}
              </span>
              <span className="pec-bar">
                <span
                  className="pec-bar-fill"
                  style={{
                    width: formatPercent(
                      progress.signaturesInQualified / progress.stateGoal,
                    ),
                  }}
                />
              </span>
            </article>
          </div>
          <p className="muted">
            A proposta fica apta quando as assinaturas reunidas em municípios
            que atingiram a fração de {formatRatio(MUNICIPALITY_SIGNATURE_RATE)}{' '}
            do eleitorado local alcançam {formatNumber(progress.stateGoal)} e
            esses municípios somam pelo menos{' '}
            {formatNumber(progress.coverageGoal)}. É a leitura mais rigorosa do
            ofício da Diretoria-Geral da Mesa e evita impugnação.
          </p>
        </section>

        <section className="card">
          <h2>Municípios</h2>
          <MunicipalityProgressTable municipalities={progress.municipalities} />
        </section>

        {source ? (
          <p className="footer-note">
            Eleitorado: {source.reference} — atualizado em {source.updatedAt}.
          </p>
        ) : null}
      </main>
    </>
  );
}
