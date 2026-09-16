import {NextResponse} from 'next/server';
import {isValidCpf, normalizeCpf} from '@/lib/cpf';
import {SIGNATURE_CONSENT_TEXT, SIGNATURE_READING_TEXT} from '@/lib/consent';
import {getProposal} from '@/lib/proposal';
import {
  appendSignature,
  getElectorate,
  getSignatureByCpf,
  saveProposalVersion,
} from '@/lib/repository';
import {
  buildEntryHash,
  buildReceipt,
  hashIp,
  nowUtc,
  readClientIp,
} from '@/lib/signature';
import {MIN_NAME_LENGTH, isMaranhaoMunicipality} from '@/lib/validation';

const UNKNOWN_USER_AGENT = 'desconhecido';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const cpf = normalizeCpf(typeof body?.cpf === 'string' ? body.cpf : '');
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

  const receipt = buildReceipt(cpf);
  const proposal = getProposal();
  const proposalHash = proposal.hash;
  const createdAt = nowUtc();

  saveProposalVersion({...proposal, createdAt});

  appendSignature(
    {
      name,
      cpf,
      city,
      receipt,
      ipHash: hashIp(readClientIp(request.headers)),
      userAgent: request.headers.get('user-agent') ?? UNKNOWN_USER_AGENT,
      proposalHash,
      documentHash: proposal.documentHash,
      consentText: SIGNATURE_CONSENT_TEXT,
      readingText: SIGNATURE_READING_TEXT,
      createdAt,
    },
    prevHash =>
      buildEntryHash({
        prevHash,
        name,
        cpf,
        city,
        proposalHash,
        documentHash: proposal.documentHash,
        consentText: SIGNATURE_CONSENT_TEXT,
        readingText: SIGNATURE_READING_TEXT,
        createdAt,
      }),
  );

  return NextResponse.json({receipt, city, proposalHash, alreadySigned: false});
}
