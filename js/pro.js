/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: pro.js
 * Назначение: Заглушка PRO (временно отключено)
 * ----------------------------------------------------------
 * PRO-активация и внешние платежи отключены для подготовки к
 * публикации в Google Play (будет Google Play Billing).
 * Файл сохранён как точка расширения на будущее.
 * ========================================================== */

(function (root) {
  'use strict';

  // Публичный API сохраняем, чтобы ничего не ломалось,
  // если где-то остался вызов ProUpgrade.open().
  root.ProUpgrade = root.ProUpgrade || {};

  root.ProUpgrade.open = function () {
    // NO-OP
    // В будущем здесь будет запуск экрана покупки через Google Play Billing.
    try {
      console.warn('[PRO] Disabled: will be replaced by Google Play Billing.');
    } catch (_) {}
  };

  root.ProUpgrade.close = function () {
    // NO-OP
  };

})(window);
