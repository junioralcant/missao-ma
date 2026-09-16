import {NextResponse} from 'next/server';
import {getProposal, saveProposal} from '@/lib/proposal';
import {isAdminRequest} from '@/lib/session';

const MIN_TITLE_LENGTH = 3;

const isValidDocumentUrl = (value: string): boolean => {
  if (!value) {
    return true;
  }
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

export async function GET() {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }
  return NextResponse.json({proposal: getProposal()});
}

export async function PUT(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const summary = typeof body?.summary === 'string' ? body.summary.trim() : '';
  const documentUrl =
    typeof body?.documentUrl === 'string' ? body.documentUrl.trim() : '';

  if (title.length < MIN_TITLE_LENGTH) {
    return NextResponse.json(
      {error: 'Informe o título da proposta.'},
      {status: 400},
    );
  }
  if (!summary) {
    return NextResponse.json({error: 'Informe a ementa.'}, {status: 400});
  }
  if (!isValidDocumentUrl(documentUrl)) {
    return NextResponse.json(
      {error: 'O link da minuta precisa começar com https://'},
      {status: 400},
    );
  }

  return NextResponse.json({
    proposal: saveProposal(title, summary, documentUrl),
  });
}
