import {NextResponse} from 'next/server';
import {formatCpf} from '@/lib/cpf';
import {listSignatures} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';

const escapeCsvField = (value: string): string =>
  /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export async function GET(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  const signatures = listSignatures();
  const format = new URL(request.url).searchParams.get('format');

  if (format !== 'csv') {
    return NextResponse.json({signatures});
  }

  const rows = signatures.map(signature =>
    [
      escapeCsvField(signature.name),
      formatCpf(signature.cpf),
      escapeCsvField(signature.email),
      escapeCsvField(signature.city),
      signature.receipt,
      signature.proposalHash,
      signature.entryHash,
      signature.createdAt,
    ].join(';'),
  );
  const csv =
    '﻿' +
    `Nome;CPF;E-mail;Município;Protocolo;Hash da minuta;Hash do registro;Data (UTC)\n${rows.join('\n')}\n`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="assinaturas-pec.csv"',
    },
  });
}
