import {NextResponse} from 'next/server';
import {
  deleteSignature,
  deleteSignatureRequestByCpf,
  getSignatureById,
} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';

type RouteContext = {params: {id: string}};

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  const id = Number(context.params.id);
  const signature = Number.isInteger(id) ? getSignatureById(id) : null;
  if (!signature || !deleteSignature(id)) {
    return NextResponse.json(
      {error: 'Assinatura não encontrada.'},
      {status: 404},
    );
  }
  deleteSignatureRequestByCpf(signature.cpf);

  return NextResponse.json({ok: true});
}
