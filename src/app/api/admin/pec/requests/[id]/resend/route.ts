import {NextResponse} from 'next/server';
import {sendEmail} from '@/lib/mailer';
import {getProposal} from '@/lib/proposal';
import {
  getSignatureRequestById,
  getSignatureRequestTokenHash,
  listProposalVersions,
  renewSignatureRequestToken,
} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';
import {utcAfter} from '@/lib/signature';
import {buildSignatureReminderEmail} from '@/lib/signatureEmail';
import {SIGNATURE_REQUEST_TTL_MS} from '@/lib/signatureRequest';
import {createSignatureToken, hashSignatureToken} from '@/lib/signatureToken';

type RouteContext = {params: {id: string}};

const findProposalTitle = (proposalHash: string): string =>
  listProposalVersions().find(version => version.hash === proposalHash)
    ?.title ?? getProposal().title;

export async function POST(request: Request, context: RouteContext) {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  const id = Number(context.params.id);
  const signatureRequest = Number.isInteger(id)
    ? getSignatureRequestById(id)
    : null;
  if (!signatureRequest) {
    return NextResponse.json({error: 'Pedido não encontrado.'}, {status: 404});
  }
  if (signatureRequest.status !== 'pending') {
    return NextResponse.json(
      {error: 'Esta assinatura já foi confirmada.'},
      {status: 409},
    );
  }

  const previousTokenHash = getSignatureRequestTokenHash(id) ?? '';
  const token = createSignatureToken();
  const expiresAt = utcAfter(SIGNATURE_REQUEST_TTL_MS);
  if (!renewSignatureRequestToken(id, hashSignatureToken(token), expiresAt)) {
    return NextResponse.json(
      {error: 'Esta assinatura já foi confirmada.'},
      {status: 409},
    );
  }

  const delivery = await sendEmail(
    buildSignatureReminderEmail({
      name: signatureRequest.name,
      city: signatureRequest.city,
      email: signatureRequest.email,
      token,
      proposalTitle: findProposalTitle(signatureRequest.proposalHash),
    }),
  );
  if (delivery === 'failed') {
    renewSignatureRequestToken(
      id,
      previousTokenHash,
      signatureRequest.expiresAt,
    );
    return NextResponse.json(
      {error: 'Não foi possível reenviar o e-mail. Tente novamente.'},
      {status: 502},
    );
  }

  return NextResponse.json({ok: true, expiresAt});
}
