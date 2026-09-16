import {NextResponse} from 'next/server';
import {deleteSignature} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';

type RouteContext = {params: {id: string}};

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || !deleteSignature(id)) {
    return NextResponse.json(
      {error: 'Assinatura não encontrada.'},
      {status: 404},
    );
  }

  return NextResponse.json({ok: true});
}
