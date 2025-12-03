/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: pro-key.js
 * Назначение: Активация PRO по мастер-коду (без покупки)
 * Версия: 1.1
 * Обновлено: 2025-12-02
 * ========================================================== */

function normalizeKey(str) {
  // убираем пробелы и дефисы, приводим к верхнему регистру
  return String(str || '')
    .trim()
    .replace(/[\s-]+/g, '')
    .toUpperCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const body  = req.body || {};
    const keyIn = body.key;

    const keyNorm = normalizeKey(keyIn);

    if (!keyNorm) {
      return res.status(400).json({ ok: false, error: 'KEY_MISSING' });
    }

    // Список мастер-ключей задаётся в ENV:
    // PRO_MASTER_KEYS="ABC123,TEST-KEY-1,VIP MOYA"
    const envKeys = process.env.PRO_MASTER_KEYS || '';
    const rawList = envKeys
      .split(',')
      .map(s => String(s || '').trim())
      .filter(Boolean);

    if (!rawList.length) {
      console.error('[pro-key] No PRO_MASTER_KEYS configured');
      return res.status(500).json({ ok: false, error: 'NO_KEYS_CONFIGURED' });
    }

    // нормализуем все ключи из ENV
    const normList = rawList.map(normalizeKey);

    const idx = normList.findIndex(storedNorm => storedNorm === keyNorm);

    if (idx === -1) {
      console.log('[PRO_KEY]', {
        type: 'FAIL',
        keyMasked:
          keyNorm.length > 4
            ? keyNorm.slice(0, 2) + '***' + keyNorm.slice(-2)
            : '***',
        time: new Date().toISOString()
      });

      return res.status(200).json({ ok: false, error: 'INVALID_KEY' });
    }

    console.log('[PRO_KEY]', {
      type: 'OK',
      index: idx,
      time: new Date().toISOString()
    });

    return res.status(200).json({
      ok: true,
      mode: 'master-key',
      index: idx
    });
  } catch (err) {
    console.error('[pro-key] Exception:', err);
    return res.status(500).json({
      ok: false,
      error: 'EXCEPTION',
      message: (err && err.message) ? err.message : String(err)
    });
  }
}

/* ======================= Конец файла: pro-key.js ======================= */
