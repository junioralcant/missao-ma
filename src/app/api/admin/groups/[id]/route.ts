import {NextResponse} from 'next/server';
import {deleteGroup, getGroupById, updateGroupLink} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';
import {normalizeWhatsappLink} from '@/lib/validation';

type RouteContext = {params: {id: string}};

export async function PUT(request: Request, context: RouteContext) {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || !getGroupById(id)) {
    return NextResponse.json({error: 'Grupo não encontrado.'}, {status: 404});
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

  return NextResponse.json({group: updateGroupLink(id, normalizedLink)});
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || !deleteGroup(id)) {
    return NextResponse.json({error: 'Grupo não encontrado.'}, {status: 404});
  }

  return NextResponse.json({ok: true});
}
