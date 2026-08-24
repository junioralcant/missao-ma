import {NextResponse} from 'next/server';
import {createGroup, getGroupByCity, listGroups} from '@/lib/repository';
import {isAdminRequest} from '@/lib/session';
import {isMaranhaoMunicipality, normalizeWhatsappLink} from '@/lib/validation';

export async function GET() {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }
  return NextResponse.json({groups: listGroups()});
}

export async function POST(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  const body = await request.json().catch(() => null);
  const city = typeof body?.city === 'string' ? body.city.trim() : '';
  const whatsappLink =
    typeof body?.whatsappLink === 'string' ? body.whatsappLink.trim() : '';

  if (!isMaranhaoMunicipality(city)) {
    return NextResponse.json(
      {error: 'Selecione um município válido do Maranhão.'},
      {status: 400},
    );
  }
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
  if (getGroupByCity(city)) {
    return NextResponse.json(
      {
        error:
          'Esta cidade já possui grupo cadastrado. Edite o link existente.',
      },
      {status: 409},
    );
  }

  return NextResponse.json({group: createGroup(city, normalizedLink)});
}
