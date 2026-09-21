import type {EmailDeliveryStatus, EmailMessage} from './types';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const DEFAULT_FROM = 'Missão Maranhão <pec@missaoma.com.br>';

const MISSING_KEY_MESSAGE =
  'RESEND_API_KEY não configurada: e-mail não enviado.';

const SEND_FAILURE_MESSAGE = 'Falha ao enviar e-mail pelo Resend';

export const sendEmail = async (
  message: EmailMessage,
): Promise<EmailDeliveryStatus> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(MISSING_KEY_MESSAGE, message.to, message.text);
    return 'skipped';
  }
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [message.to],
        reply_to: process.env.EMAIL_REPLY_TO || undefined,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!response.ok) {
      console.error(
        SEND_FAILURE_MESSAGE,
        response.status,
        await response.text(),
      );
      return 'failed';
    }
    return 'sent';
  } catch (error) {
    console.error(SEND_FAILURE_MESSAGE, error);
    return 'failed';
  }
};
