import type {ChainVerification, ProposalVersion} from '@/lib/types';

type IntegrityCardProps = {
  verification: ChainVerification;
  versions: ProposalVersion[];
  signaturesByVersion: Record<string, number>;
  currentHash: string;
};

const SHORT_HASH_LENGTH = 16;

const MIN_VERSIONS_TO_LIST = 2;

const describeVerification = (verification: ChainVerification): string => {
  if (!verification.isValid) {
    return `Cadeia quebrada a partir da assinatura #${verification.brokenAtId}.`;
  }
  return verification.total === 1
    ? 'Cadeia íntegra: 1 assinatura conferida.'
    : `Cadeia íntegra: ${verification.total} assinaturas conferidas.`;
};

export const IntegrityCard = ({
  verification,
  versions,
  signaturesByVersion,
  currentHash,
}: IntegrityCardProps) => (
  <div>
    <div
      className={
        verification.isValid ? 'alert alert--success' : 'alert alert--error'
      }
    >
      {describeVerification(verification)}
    </div>

    <div className="field">
      <label htmlFor="chain-head">Hash final da coleta</label>
      <input
        id="chain-head"
        className="input-mono"
        readOnly
        value={verification.headHash || '—'}
      />
    </div>
    <p className="muted">
      Registre este valor fora do sistema (ata, e-mail, protocolo). Feito isso,
      reescrever a coleta depois passa a ser detectável.
    </p>

    {versions.length >= MIN_VERSIONS_TO_LIST ? (
      <>
        <h3 className="subhead">Versões da minuta</h3>
        <p className="muted">
          O texto mudou durante a coleta. Todas as assinaturas contam para o
          total, e cada uma registra a versão que endossou — o que permite
          separá-las caso a Assembleia questione.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Hash</th>
                <th>Título</th>
                <th>Assinaturas</th>
                <th>Registrada em</th>
              </tr>
            </thead>
            <tbody>
              {versions.map(version => (
                <tr key={version.hash}>
                  <td
                    className={
                      version.hash === currentHash ? 'mono gold' : 'mono'
                    }
                  >
                    {version.hash.slice(0, SHORT_HASH_LENGTH)}
                    {version.hash === currentHash ? ' (atual)' : ''}
                  </td>
                  <td>{version.title}</td>
                  <td className="mono">
                    {signaturesByVersion[version.hash] ?? 0}
                  </td>
                  <td className="mono">{version.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ) : null}
  </div>
);
