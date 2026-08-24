import {NextResponse} from 'next/server';
import {deleteRegistration} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';

type RouteContext = {params: {id: string}};

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || !deleteRegistration(id)) {
    return NextResponse.json(
      {error: 'Cadastro não encontrado.'},
      {status: 404},
    );
  }

  return NextResponse.json({ok: true});
}
