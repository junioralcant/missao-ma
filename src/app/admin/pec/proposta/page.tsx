import {redirect} from 'next/navigation';
import {verifySignatureChain} from '@/lib/integrity';
import {getProposal} from '@/lib/proposal';
import {
  countSignaturesByProposalHash,
  listProposalVersions,
  listSignatureEntries,
} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';
import {IntegrityCard} from '../components/IntegrityCard';
import {ProposalCard} from '../components/ProposalCard';

export const dynamic = 'force-dynamic';

export default function AdminPecProposalPage() {
  if (!isAdminRequest()) {
    redirect('/admin/login?next=/admin/pec/proposta');
  }

  const proposal = getProposal();

  return (
    <>
      <section className="card">
        <h2>Proposta</h2>
        <ProposalCard initialProposal={proposal} />
      </section>

      <section className="card">
        <h2>Integridade da coleta</h2>
        <IntegrityCard
          verification={verifySignatureChain(listSignatureEntries())}
          versions={listProposalVersions()}
          signaturesByVersion={countSignaturesByProposalHash()}
          currentHash={proposal.hash}
        />
      </section>
    </>
  );
}
