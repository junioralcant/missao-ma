import {redirect} from 'next/navigation';
import {formatNumber, formatRatio} from '@/app/pec/format';
import {
  MUNICIPALITY_COVERAGE_RATE,
  MUNICIPALITY_SIGNATURE_RATE,
  STATE_SIGNATURE_RATE,
  buildProgress,
} from '@/lib/pec';
import {countSignaturesByCity, getElectorate} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';

export const dynamic = 'force-dynamic';

export default function AdminPecPage() {
  if (!isAdminRequest()) {
    redirect('/admin/login?next=/admin/pec');
  }

  const progress = buildProgress({
    electorate: getElectorate(),
    signaturesByCity: countSignaturesByCity(),
  });

  return (
    <section className="card">
      <h2>Requisitos constitucionais</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Requisito</th>
              <th>Exigido</th>
              <th>Atual</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                Assinaturas ({formatRatio(STATE_SIGNATURE_RATE)} do eleitorado
                estadual)
              </td>
              <td className="mono">{formatNumber(progress.stateGoal)}</td>
              <td className="mono">{formatNumber(progress.totalSignatures)}</td>
              <td className={progress.isStateGoalMet ? 'gold' : 'muted'}>
                {progress.isStateGoalMet ? 'Atingido' : 'Em coleta'}
              </td>
            </tr>
            <tr>
              <td>
                Municípios abrangidos ({formatRatio(MUNICIPALITY_COVERAGE_RATE)}{' '}
                dos municípios)
              </td>
              <td className="mono">{formatNumber(progress.coverageGoal)}</td>
              <td className="mono">{formatNumber(progress.qualifiedCount)}</td>
              <td className={progress.isCoverageGoalMet ? 'gold' : 'muted'}>
                {progress.isCoverageGoalMet ? 'Atingido' : 'Em coleta'}
              </td>
            </tr>
            <tr>
              <td>
                Assinaturas em municípios que cumprem{' '}
                {formatRatio(MUNICIPALITY_SIGNATURE_RATE)} do eleitorado local
              </td>
              <td className="mono">{formatNumber(progress.stateGoal)}</td>
              <td className="mono">
                {formatNumber(progress.signaturesInQualified)}
              </td>
              <td className={progress.isStrictStateGoalMet ? 'gold' : 'muted'}>
                {progress.isStrictStateGoalMet ? 'Atingido' : 'Em coleta'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="muted">
        Apta a protocolo:{' '}
        <strong className={progress.isReadyToFile ? 'gold' : undefined}>
          {progress.isReadyToFile ? 'sim' : 'ainda não'}
        </strong>
        . Depois do protocolo, a Assembleia tem 60 dias para apreciar a
        proposta.
      </p>
    </section>
  );
}
