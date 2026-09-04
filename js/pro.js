/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: pro.js
 * Назначение: Совместимый мост для будущих платных дополнений
 * ----------------------------------------------------------
 * Основной учебный функционал MOYAMOVA бесплатный.
 * Файл сохранён только как безопасная точка расширения для
 * будущих дополнительных возможностей и Google Play Billing.
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
      console.warn('[Entitlements] No paid add-ons are configured.');
    } catch (_) {}
  };

  root.ProUpgrade.close = function () {
    // NO-OP
  };

})(window);
