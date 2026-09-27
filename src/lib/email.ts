/**
 * Email sending via nodemailer.
 *
 * SMTP configuration through environment variables:
 *   SMTP_HOST      — SMTP server (e.g. smtp.gmail.com)
 *   SMTP_PORT      — port (465 for SSL, 587 for STARTTLS)
 *   SMTP_USER      — username
 *   SMTP_PASS      — password
 *   SMTP_FROM      — From address (e.g. "Maestro7IT Bot <noreply@maestro7it.ru>")
 *   SMTP_FROM_NAME — Display name (optional, default "Maestro7IT Bot")
 *
 * If SMTP_HOST is not set → email sending is disabled,
 * reset link is logged to server console (dev mode).
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

let transporter: Transporter | null = null
let transporterSignature = ''

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST
  if (!host) return null

  // Re-create transporter if env changed (for dev convenience)
  const signature = `${host}:${process.env.SMTP_PORT}:${process.env.SMTP_USER}`
  if (transporter && transporterSignature === signature) {
    return transporter
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
  })
  transporterSignature = signature
  return transporter
}

export interface EmailParams {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(params: EmailParams): Promise<{ ok: boolean; error?: string; devMode?: boolean }> {
  const t = getTransporter()
  const from = process.env.SMTP_FROM || 'noreply@maestro7it.ru'
  const fromName = process.env.SMTP_FROM_NAME || 'Maestro7IT Bot'

  // Dev mode — нет SMTP, логируем письмо в консоль
  if (!t) {
    console.log('\n========== EMAIL (DEV MODE) ==========')
    console.log(`From: ${fromName} <${from}>`)
    console.log(`To: ${params.to}`)
    console.log(`Subject: ${params.subject}`)
    console.log('---')
    console.log(params.text)
    console.log('======================================\n')
    return { ok: true, devMode: true }
  }

  try {
    await t.sendMail({
      from: `${fromName} <${from}>`,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    })
    return { ok: true }
  } catch (e: any) {
    console.error('[email] send error:', e?.message)
    return { ok: false, error: e?.message || 'Failed to send email' }
  }
}

export function isEmailConfigured(): boolean {
  return !!process.env.SMTP_HOST
}
