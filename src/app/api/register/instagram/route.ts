import {NextResponse} from 'next/server';
import {isValidInstagram, normalizeInstagram} from '@/lib/instagram';
import {isValidPhone, normalizePhone} from '@/lib/phone';
import {
  getRegistrationByInstagram,
  getRegistrationByWhatsapp,
  updateRegistrationInstagram,
} from '@/lib/repository';

const INSTAGRAM_ALREADY_LINKED_ERROR =
  'Este WhatsApp já tem um Instagram cadastrado. Para alterar, fale com a organização.';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const whatsapp = normalizePhone(
    typeof body?.whatsapp === 'string' ? body.whatsapp : '',
  );
  const instagram = normalizeInstagram(
    typeof body?.instagram === 'string' ? body.instagram : '',
  );

  if (!isValidPhone(whatsapp)) {
    return NextResponse.json(
      {error: 'Informe um número de WhatsApp válido com DDD.'},
      {status: 400},
    );
  }
  if (!isValidInstagram(instagram)) {
    return NextResponse.json(
      {error: 'Informe um usuário do Instagram válido.'},
      {status: 400},
    );
  }

  const registration = getRegistrationByWhatsapp(whatsapp);
  if (!registration) {
    return NextResponse.json(
      {
        error:
          'Não encontramos cadastro com este WhatsApp. Confira o número ou faça seu cadastro.',
      },
      {status: 404},
    );
  }

  if (registration.instagram) {
    return NextResponse.json(
      {error: INSTAGRAM_ALREADY_LINKED_ERROR},
      {status: 409},
    );
  }

  const registrationWithInstagram = getRegistrationByInstagram(instagram);
  if (
    registrationWithInstagram &&
    registrationWithInstagram.whatsapp !== whatsapp
  ) {
    return NextResponse.json(
      {error: 'Este Instagram já está cadastrado.'},
      {status: 409},
    );
  }

  if (!updateRegistrationInstagram(whatsapp, instagram)) {
    return NextResponse.json(
      {error: INSTAGRAM_ALREADY_LINKED_ERROR},
      {status: 409},
    );
  }
  return NextResponse.json({ok: true});
}
