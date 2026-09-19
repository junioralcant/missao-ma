import {NextResponse} from 'next/server';
import {isValidEmail, normalizeEmail} from '@/lib/email';
import {isValidPhone, normalizePhone} from '@/lib/phone';
import {
  getDefaultGroupLink,
  getGroupByCity,
  getRegistrationByEmail,
  getRegistrationByWhatsapp,
  upsertRegistration,
} from '@/lib/repository';
import {MIN_NAME_LENGTH, isMaranhaoMunicipality} from '@/lib/validation';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const whatsapp = normalizePhone(
    typeof body?.whatsapp === 'string' ? body.whatsapp : '',
  );
  const email = normalizeEmail(
    typeof body?.email === 'string' ? body.email : '',
  );
  const city = typeof body?.city === 'string' ? body.city.trim() : '';

  if (name.length < MIN_NAME_LENGTH) {
    return NextResponse.json(
      {error: 'Informe seu nome completo.'},
      {status: 400},
    );
  }
  if (!isValidPhone(whatsapp)) {
    return NextResponse.json(
      {error: 'Informe um número de WhatsApp válido com DDD.'},
      {status: 400},
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({error: 'E-mail inválido.'}, {status: 400});
  }
  if (!isMaranhaoMunicipality(city)) {
    return NextResponse.json(
      {error: 'Selecione uma cidade válida do Maranhão.'},
      {status: 400},
    );
  }

  const existingRegistration = getRegistrationByWhatsapp(whatsapp);
  if (existingRegistration && existingRegistration.city !== city) {
    return NextResponse.json(
      {error: 'Este número de WhatsApp já está cadastrado.'},
      {status: 409},
    );
  }

  const registrationWithEmail = getRegistrationByEmail(email);
  if (registrationWithEmail && registrationWithEmail.whatsapp !== whatsapp) {
    return NextResponse.json(
      {error: 'Este e-mail já está cadastrado.'},
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

  upsertRegistration({name, whatsapp, email, city});
  return NextResponse.json({whatsappLink});
}
