import {NextResponse} from 'next/server';
import {
  clearDefaultGroupLink,
  getDefaultGroupLink,
  setDefaultGroupLink,
} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';
import {normalizeWhatsappLink} from '@/lib/validation';

export async function GET() {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }
  return NextResponse.json({whatsappLink: getDefaultGroupLink()});
}

export async function PUT(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  const body = await request.json().catch(() => null);
  const whatsappLink =
    typeof body?.whatsappLink === 'string' ? body.whatsappLink.trim() : '';

  const normalizedLink = normalizeWhatsappLink(whatsappLink);
  if (!normalizedLink) {
    return NextResponse.json(
      {
        error:
          'Link inválido. Use o link de convite no formato https://chat.whatsapp.com/...',
      },
      {status: 400},
    );
  }

  setDefaultGroupLink(normalizedLink);
  return NextResponse.json({whatsappLink: normalizedLink});
}

export async function DELETE() {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }
  clearDefaultGroupLink();
  return NextResponse.json({ok: true});
}
