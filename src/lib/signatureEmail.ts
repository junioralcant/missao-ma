import type {EmailMessage, SignatureConfirmationEmail} from './types';

const DEFAULT_APP_URL = 'http://localhost:3000';

const CONFIRMATION_PATH = '/pec/confirmar';

const SUBJECT = 'Confirme a sua assinatura da PEC de iniciativa popular';

const REMINDER_SUBJECT = 'Lembrete: falta confirmar a sua assinatura da PEC';

const CONFIRMATION_FOOTER =
  'O link vale por 48 horas. Se não foi você quem pediu, ignore esta mensagem: nada será registrado.';

const REMINDER_FOOTER =
  'Este link substitui o enviado anteriormente e vale por 48 horas. Se não foi você quem pediu, ignore esta mensagem: nada será registrado.';

const BACKGROUND = '#070d0c';

const CARD = '#12181a';

const GOLD = '#eebb00';

const TEXT = '#e0e0e0';

const MUTED = '#8a8a8a';

export const buildConfirmationUrl = (token: string): string =>
  `${(process.env.APP_URL || DEFAULT_APP_URL).replace(/\/$/, '')}${CONFIRMATION_PATH}/${token}`;

type EmailCopy = {
  subject: string;
  textLines: string[];
  htmlIntro: string;
  htmlCall: string;
  footer: string;
};

const buildEmail = (
  params: SignatureConfirmationEmail,
  copy: EmailCopy,
): EmailMessage => {
  const url = buildConfirmationUrl(params.token);
  return {
    to: params.email,
    subject: copy.subject,
    text: [
      `Olá, ${params.name}.`,
      '',
      ...copy.textLines,
      '',
      url,
      '',
      copy.footer,
    ].join('\n'),
    html: `<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:${BACKGROUND};font-family:Helvetica,Arial,sans-serif;color:${TEXT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:${CARD};border-radius:16px;">
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;">Olá, ${params.name}.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
            ${copy.htmlIntro}
          </p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.5;">
            ${copy.htmlCall}
          </p>
          <a href="${url}" style="display:inline-block;padding:14px 28px;background:${GOLD};color:${BACKGROUND};font-size:16px;font-weight:bold;border-radius:50px;text-decoration:none;">Assinar PEC</a>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${MUTED};">
            ${copy.footer}
          </p>
          <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:${MUTED};word-break:break-all;">${url}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
};

export const buildSignatureConfirmationEmail = (
  params: SignatureConfirmationEmail,
): EmailMessage =>
  buildEmail(params, {
    subject: SUBJECT,
    textLines: [
      `Recebemos o seu pedido de assinatura da proposta "${params.proposalTitle}", com voto em ${params.city}.`,
      'Para que a assinatura seja registrada, confirme pelo link abaixo:',
    ],
    htmlIntro: `Recebemos o seu pedido de assinatura da proposta <strong>${params.proposalTitle}</strong>, com voto em <strong>${params.city}</strong>.`,
    htmlCall:
      'A assinatura só é registrada depois que você confirmar por este e-mail.',
    footer: CONFIRMATION_FOOTER,
  });

export const buildSignatureReminderEmail = (
  params: SignatureConfirmationEmail,
): EmailMessage =>
  buildEmail(params, {
    subject: REMINDER_SUBJECT,
    textLines: [
      `Você pediu para assinar a proposta "${params.proposalTitle}", com voto em ${params.city}, mas a assinatura ainda não foi confirmada.`,
      'Ela só é registrada depois que você confirma pelo link abaixo:',
    ],
    htmlIntro: `Você pediu para assinar a proposta <strong>${params.proposalTitle}</strong>, com voto em <strong>${params.city}</strong>, mas a assinatura <strong>ainda não foi confirmada</strong>.`,
    htmlCall: 'Ela só conta para a PEC depois que você clicar no botão abaixo.',
    footer: REMINDER_FOOTER,
  });
