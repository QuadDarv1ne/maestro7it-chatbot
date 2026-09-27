import { NextRequest, NextResponse } from 'next/server'
import { createPasswordResetToken } from '@/lib/auth'
import { sendEmail, isEmailConfigured } from '@/lib/email'

/**
 * POST /api/admin/reset-request
 * Body: { email }
 *
 * Создаёт токен восстановления и отправляет email со ссылкой.
 *
 * ВАЖНО: всегда возвращаем { ok: true } — даже если email не найден.
 * Это предотвращает перечисление аккаунтов через API.
 * Реальный токен создаётся только для существующих email'ов.
 */
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (!normalizedEmail) {
    return NextResponse.json(
      { ok: false, error: 'Введите email' },
      { status: 400 },
    )
  }

  // Создаём токен (если email существует)
  const token = await createPasswordResetToken(normalizedEmail)

  if (token) {
    // Формируем ссылку восстановления
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.NODE_ENV === 'production' ? 'https://your-domain.ru' : 'http://localhost:3000')
    const resetLink = `${baseUrl}/admin/reset?token=${token}`

    const subject = 'Восстановление пароля — Maestro7IT Bot'
    const text =
      `Здравствуйте!\n\n` +
      `Получен запрос на восстановление пароля для аккаунта ${normalizedEmail}.\n\n` +
      `Для установки нового пароля перейдите по ссылке:\n${resetLink}\n\n` +
      `Ссылка действительна 1 час.\n\n` +
      `Если вы не запрашивали восстановление пароля — проигнорируйте это письмо.\n\n` +
      `---\nMaestro7IT Bot\n${baseUrl}`

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #f59e0b; margin-bottom: 24px;">Восстановление пароля</h2>
        <p>Здравствуйте!</p>
        <p>Получен запрос на восстановление пароля для аккаунта <strong>${normalizedEmail}</strong>.</p>
        <p>Для установки нового пароля нажмите кнопку ниже:</p>
        <p style="margin: 32px 0;">
          <a href="${resetLink}"
             style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Установить новый пароль
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Или скопируйте ссылку: ${resetLink}</p>
        <p style="color: #6b7280; font-size: 14px;">Ссылка действительна 1 час.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Если вы не запрашивали восстановление пароля — проигнорируйте это письмо.
        </p>
        <p style="color: #6b7280; font-size: 12px;">Maestro7IT Bot</p>
      </div>
    `

    const result = await sendEmail({
      to: normalizedEmail,
      subject,
      text,
      html,
    })

    if (!result.ok) {
      console.error('[reset-request] email send failed:', result.error)
      // Не раскрываем ошибку пользователю
    } else if (result.devMode) {
      // В dev-режиме логируем ссылку в консоль (уже залогирована в sendEmail)
      console.log(`[reset-request] DEV MODE — reset link for ${normalizedEmail}: ${resetLink}`)
    }
  }

  // Всегда возвращаем одинаковый ответ
  return NextResponse.json({
    ok: true,
    message: 'Если аккаунт с таким email существует, инструкция по восстановлению отправлена.',
    emailConfigured: isEmailConfigured(),
  })
}
