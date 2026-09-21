import {NextResponse} from 'next/server';
import {SIGNATURE_CONSENT_TEXT, SIGNATURE_READING_TEXT} from '@/lib/consent';
import {isValidCpf, normalizeCpf} from '@/lib/cpf';
import {isValidEmail, normalizeEmail} from '@/lib/email';
import {sendEmail} from '@/lib/mailer';
import {getProposal} from '@/lib/proposal';
import {
  deleteSignatureRequestByCpf,
  getElectorate,
  getSignatureByCpf,
  getSignatureByEmail,
  getSignatureRequestByEmail,
  saveProposalVersion,
  upsertSignatureRequest,
} from '@/lib/repository';
import {hashIp, nowUtc, readClientIp, utcAfter} from '@/lib/signature';
import {buildSignatureConfirmationEmail} from '@/lib/signatureEmail';
import {
  SIGNATURE_REQUEST_TTL_MS,
  shouldResendConfirmation,
} from '@/lib/signatureRequest';
import {createSignatureToken, hashSignatureToken} from '@/lib/signatureToken';
import {MIN_NAME_LENGTH, isMaranhaoMunicipality} from '@/lib/validation';

const UNKNOWN_USER_AGENT = 'desconhecido';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const cpf = normalizeCpf(typeof body?.cpf === 'string' ? body.cpf : '');
  const email = normalizeEmail(
    typeof body?.email === 'string' ? body.email : '',
  );
  const city = typeof body?.city === 'string' ? body.city.trim() : '';
  const consent = body?.consent === true;
  const hasReadDocument = body?.hasReadDocument === true;

  if (name.length < MIN_NAME_LENGTH) {
    return NextResponse.json(
      {error: 'Informe seu nome completo.'},
      {status: 400},
    );
  }
  if (!isValidCpf(cpf)) {
    return NextResponse.json({error: 'CPF inválido.'}, {status: 400});
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({error: 'E-mail inválido.'}, {status: 400});
  }
  if (!isMaranhaoMunicipality(city)) {
    return NextResponse.json(
      {error: 'Selecione um município válido do Maranhão.'},
      {status: 400},
    );
  }
  if (!(city in getElectorate())) {
    return NextResponse.json(
      {error: 'Município sem eleitorado cadastrado.'},
      {status: 400},
    );
  }
  if (!hasReadDocument) {
    return NextResponse.json(
      {error: 'É necessário confirmar a leitura da íntegra da proposta.'},
      {status: 400},
    );
  }
  if (!consent) {
    return NextResponse.json(
      {error: 'É necessário autorizar o uso dos dados para assinar.'},
      {status: 400},
    );
  }

  const existingSignature = getSignatureByCpf(cpf);
  if (existingSignature) {
    return NextResponse.json({
      receipt: existingSignature.receipt,
      city: existingSignature.city,
      alreadySigned: true,
    });
  }

  if (getSignatureByEmail(email)) {
    return NextResponse.json(
      {error: 'Este e-mail já foi usado para assinar a proposta.'},
      {status: 409},
    );
  }

  const createdAt = nowUtc();
  const pendingRequest = getSignatureRequestByEmail(email);
  if (!shouldResendConfirmation(pendingRequest, {name, cpf, city}, createdAt)) {
    return NextResponse.json({email, alreadySigned: false, resent: false});
  }

  const token = createSignatureToken();
  const proposal = getProposal();

  saveProposalVersion({...proposal, createdAt});
  upsertSignatureRequest({
    name,
    cpf,
    email,
    city,
    tokenHash: hashSignatureToken(token),
    ipHash: hashIp(readClientIp(request.headers)),
    userAgent: request.headers.get('user-agent') ?? UNKNOWN_USER_AGENT,
    proposalHash: proposal.hash,
    documentHash: proposal.documentHash,
    consentText: SIGNATURE_CONSENT_TEXT,
    readingText: SIGNATURE_READING_TEXT,
    createdAt,
    expiresAt: utcAfter(SIGNATURE_REQUEST_TTL_MS),
  });

  const delivery = await sendEmail(
    buildSignatureConfirmationEmail({
      name,
      city,
      email,
      token,
      proposalTitle: proposal.title,
    }),
  );
  if (delivery === 'failed') {
    deleteSignatureRequestByCpf(cpf);
    return NextResponse.json(
      {
        error:
          'Não foi possível enviar o e-mail de confirmação. Tente novamente.',
      },
      {status: 502},
    );
  }

  return NextResponse.json({email, alreadySigned: false, resent: true});
}
