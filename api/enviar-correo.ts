import type { IncomingMessage, ServerResponse } from 'http';
import nodemailer from 'nodemailer';

/**
 * Relay de correo — función serverless de Vercel (runtime Node.js, NO
 * edge: nodemailer necesita sockets TCP crudos para SMTP, que el
 * runtime edge no soporta — por eso la firma clásica (req, res) de
 * Node en vez del `Request`/`Response` estilo Web).
 *
 * Por qué existe: la API (mediruta-api) vive en Render, y desde
 * septiembre 2025 Render bloquea el tráfico saliente a los puertos SMTP
 * (25, 465, 587) en sus servicios web del plan gratis
 * (https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports).
 * Confirmado en producción: un envío por Gmail SMTP directo desde la
 * API se quedaba colgado sin responder.
 *
 * Vercel sí permite salida por los puertos 465/587 (solo bloquea el 25,
 * que Gmail no usa) — así que este endpoint recibe por HTTPS (nunca
 * bloqueado) el correo ya armado (asunto/HTML/texto) y lo manda por
 * Gmail SMTP desde acá. La API sigue siendo dueña de toda la lógica de
 * negocio (generar el OTP, armar la plantilla, decidir a quién
 * escribirle) — esta función es "tonta" a propósito, solo transporta.
 *
 * Protegido con un secreto compartido (`CORREO_RELAY_SECRET`, configurado
 * acá en Vercel Y en la API en Render) — sin esto, cualquiera que
 * encuentre la URL podría mandar correos desde nuestra cuenta de Gmail.
 * Nunca lo pongas en el código ni en un .env que se commitee.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    jsonResponse(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  const secretoEsperado = process.env.CORREO_RELAY_SECRET;
  const secretoRecibido = req.headers['x-relay-secret'];
  if (!secretoEsperado || secretoRecibido !== secretoEsperado) {
    jsonResponse(res, 401, { ok: false, error: 'No autorizado' });
    return;
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await leerJson(req);
  } catch {
    jsonResponse(res, 400, { ok: false, error: 'Body inválido — se esperaba JSON.' });
    return;
  }

  const { to, subject, html, text } = cuerpo;
  if (
    typeof to !== 'string' ||
    typeof subject !== 'string' ||
    typeof html !== 'string' ||
    typeof text !== 'string'
  ) {
    jsonResponse(res, 400, {
      ok: false,
      error: 'Faltan campos: to, subject, html, text (todos string).',
    });
    return;
  }

  const usuario = process.env.GMAIL_SMTP_USER;
  const appPassword = process.env.GMAIL_SMTP_APP_PASSWORD;
  if (!usuario || !appPassword) {
    jsonResponse(res, 500, {
      ok: false,
      error: 'Falta GMAIL_SMTP_USER/GMAIL_SMTP_APP_PASSWORD en las variables de entorno de Vercel.',
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: usuario, pass: appPassword },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });

  try {
    await transporter.sendMail({ from: `MediRuta <${usuario}>`, to, subject, html, text });
    jsonResponse(res, 200, { ok: true });
  } catch (error) {
    const causa = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    jsonResponse(res, 502, { ok: false, error: causa });
  }
}

function leerJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let datos = '';
    req.on('data', (chunk: Buffer) => {
      datos += chunk.toString('utf-8');
    });
    req.on('end', () => {
      try {
        resolve(datos ? (JSON.parse(datos) as Record<string, unknown>) : {});
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
    req.on('error', reject);
  });
}

function jsonResponse(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}
