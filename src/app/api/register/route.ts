import {NextResponse} from 'next/server';
import {isValidCpf, normalizeCpf} from '@/lib/cpf';
import {
  getDefaultGroupLink,
  getGroupByCity,
  getRegistrationByCpf,
  upsertRegistration,
} from '@/lib/repository';
import {MIN_NAME_LENGTH, isMaranhaoMunicipality} from '@/lib/validation';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const cpf = normalizeCpf(typeof body?.cpf === 'string' ? body.cpf : '');
  const city = typeof body?.city === 'string' ? body.city.trim() : '';

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
      {error: 'Selecione uma cidade válida do Maranhão.'},
      {status: 400},
    );
  }

  const existingRegistration = getRegistrationByCpf(cpf);
  if (existingRegistration && existingRegistration.city !== city) {
    return NextResponse.json(
      {error: 'Este CPF já está cadastrado.'},
      {status: 409},
    );
  }

  const whatsappLink =
    getGroupByCity(city)?.whatsappLink ?? getDefaultGroupLink();
  if (!whatsappLink) {
    return NextResponse.json(
      {error: 'Esta cidade ainda não possui grupo cadastrado.'},
      {status: 404},
    );
  }

  upsertRegistration({name, cpf, city});
  return NextResponse.json({whatsappLink});
}
