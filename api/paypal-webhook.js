/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: paypal-webhook.js
 * Назначение: Приём и логирование PayPal webhooks (sandbox/live)
 * Важно: на данном этапе подпись НЕ проверяем, только логируем.
 * Основная проверка оплаты идёт через /api/paypal-confirm.
 * Версия: 2.0
 * Обновлено: 2025-12-02
 * ========================================================== */

/* ==========================================================
 * Эндпоинт: POST /api/paypal-webhook
 *
 * Что делает сейчас:
 *   - принимает любое событие от PayPal;
 *   - пишет его в лог с меткой [PAYMENT_LOG];
 *   - ВСЕГДА отвечает 200 OK, чтобы PayPal не ретраил.
 *
 * Это "тихий" вебхук: не влияет на активацию PRO,
 * нужен только как журнал.
 * ========================================================== */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // Для PayPal всё равно отдаём 200, чтобы не было ретраев
    return res.status(200).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const mode = (process.env.PAYPAL_MODE === 'live') ? 'live' : 'sandbox';
    const event = req.body || {};

    // Короткий лог самого вебхука
    console.log('[paypal-webhook] Event received:', event.event_type, 'id:', event.id, 'env:', mode);

    // Структурированный лог для анализа
    console.log('[PAYMENT_LOG]', {
      type:    'WEBHOOK_RAW',
      source:  'paypal',
      env:     mode,
      eventId: event.id || null,
      eventType: event.event_type || null,
      createTime: event.create_time || null,
      resource: event.resource || null,
      time:    new Date().toISOString()
    });

    // Всегда 200 OK, чтобы PayPal не спамил ретраями
    return res.status(200).json({ ok: true });
  } catch (err) {
    const mode = (process.env.PAYPAL_MODE === 'live') ? 'live' : 'sandbox';
    console.error('[paypal-webhook] Exception:', err);

    console.log('[PAYMENT_LOG]', {
      type:    'WEBHOOK_EXCEPTION',
      source:  'paypal',
      env:     mode,
      message: (err && err.message) ? err.message : String(err),
      time:    new Date().toISOString()
    });

    // Даже при ошибке отдаём 200, чтобы PayPal не ретраил
    return res.status(200).json({
      ok:    false,
      error: 'EXCEPTION',
      message: (err && err.message) ? err.message : String(err)
    });
  }
}

/* ==================== Конец файла: paypal-webhook.js ==================== */
