import {NextResponse} from 'next/server';
import {
  appendSignature,
  confirmSignatureRequest,
  getSignatureByCpf,
  getSignatureByEmail,
  getSignatureRequestByToken,
} from '@/lib/repository';
import {buildEntryHash, buildReceipt, nowUtc} from '@/lib/signature';
import {isSignatureRequestExpired} from '@/lib/signatureRequest';
import {hashSignatureToken} from '@/lib/signatureToken';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  const signatureRequest = getSignatureRequestByToken(
    hashSignatureToken(token),
  );

  if (!signatureRequest) {
    return NextResponse.json(
      {error: 'Link de confirmação inválido.'},
      {status: 404},
    );
  }

  if (signatureRequest.status === 'confirmed' && signatureRequest.receipt) {
    return NextResponse.json({
      receipt: signatureRequest.receipt,
      city: signatureRequest.city,
      alreadyConfirmed: true,
    });
  }

  const confirmedAt = nowUtc();
  if (isSignatureRequestExpired(signatureRequest.expiresAt, confirmedAt)) {
    return NextResponse.json(
      {error: 'Link de confirmação expirado. Assine novamente.'},
      {status: 410},
    );
  }

  const signatureWithCpf = getSignatureByCpf(signatureRequest.cpf);
  if (signatureWithCpf) {
    confirmSignatureRequest(
      signatureRequest.id,
      signatureWithCpf.receipt,
      confirmedAt,
    );
    return NextResponse.json({
      receipt: signatureWithCpf.receipt,
      city: signatureWithCpf.city,
      alreadyConfirmed: true,
    });
  }

  if (getSignatureByEmail(signatureRequest.email)) {
    return NextResponse.json(
      {error: 'Este e-mail já foi usado para assinar a proposta.'},
      {status: 409},
    );
  }

  const receipt = buildReceipt(signatureRequest.cpf);
  appendSignature(
    {
      name: signatureRequest.name,
      cpf: signatureRequest.cpf,
      email: signatureRequest.email,
      city: signatureRequest.city,
      receipt,
      ipHash: signatureRequest.ipHash,
      userAgent: signatureRequest.userAgent,
      proposalHash: signatureRequest.proposalHash,
      documentHash: signatureRequest.documentHash,
      consentText: signatureRequest.consentText,
      readingText: signatureRequest.readingText,
      createdAt: confirmedAt,
    },
    prevHash =>
      buildEntryHash({
        prevHash,
        name: signatureRequest.name,
        cpf: signatureRequest.cpf,
        city: signatureRequest.city,
        proposalHash: signatureRequest.proposalHash,
        documentHash: signatureRequest.documentHash,
        consentText: signatureRequest.consentText,
        readingText: signatureRequest.readingText,
        createdAt: confirmedAt,
      }),
  );
  confirmSignatureRequest(signatureRequest.id, receipt, confirmedAt);

  return NextResponse.json({
    receipt,
    city: signatureRequest.city,
    proposalHash: signatureRequest.proposalHash,
    alreadyConfirmed: false,
  });
}
