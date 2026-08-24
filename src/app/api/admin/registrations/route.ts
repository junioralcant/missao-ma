import {NextResponse} from 'next/server';
import {formatCpf} from '@/lib/cpf';
import {listRegistrations} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';

const escapeCsvField = (value: string): string =>
  /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export async function GET(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  const registrations = listRegistrations();
  const format = new URL(request.url).searchParams.get('format');

  if (format !== 'csv') {
    return NextResponse.json({registrations});
  }

  const rows = registrations.map(registration =>
    [
      escapeCsvField(registration.name),
      formatCpf(registration.cpf),
      escapeCsvField(registration.city),
      registration.createdAt,
    ].join(';'),
  );
  const csv = '\ufeff' + `Nome;CPF;Cidade;Data (UTC)\n${rows.join('\n')}\n`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="cadastros.csv"',
    },
  });
}
