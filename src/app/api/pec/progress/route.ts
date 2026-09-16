import {NextResponse} from 'next/server';
import {buildProgress} from '@/lib/pec';
import {getProposal} from '@/lib/proposal';
import {
  countSignaturesByCity,
  getElectorate,
  getElectorateSource,
} from '@/lib/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  const proposal = getProposal();
  const progress = buildProgress({
    electorate: getElectorate(),
    signaturesByCity: countSignaturesByCity(),
  });

  return NextResponse.json({
    progress,
    proposalHash: proposal.hash,
    source: getElectorateSource(),
  });
}
