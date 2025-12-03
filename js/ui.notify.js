/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: ui.notify.js
 * Назначение: Единая точка текстов и уведомлений (тосты, confirm)
 * Обновлено: 2025-12-01
 * ========================================================== */
(function(){
  'use strict';
  var App = window.App = window.App || {};
  App.Msg = App.Msg || {};

  // Локализованный словарь сообщений
  var DICT = {
    ru: {
      // PRO
      'pro.already': 'PRO-версия уже активирована ✨',
      'pro.purchased': 'PRO-версия активирована, спасибо за поддержку! ✨',

      // Legal / factory reset
      'legal.reset_warning': 'Все данные (прогресс, настройки, избранное) будут удалены, приложение вернётся к начальной настройке.',
      'legal.reset_confirm': 'Сбросить данные и начать заново?',

      // Ошибки / системные
      'error.no_decks': 'Нет словарей для старта тренировки.',

      // Общие кнопки
      'common.ok': 'ОК',
      'common.cancel': 'Отмена'
    },
    uk: {
      'pro.already': 'PRO-версія вже активована ✨',
      'pro.purchased': 'PRO-версія активована, дякуємо за підтримку! ✨',

      'legal.reset_warning': 'Усі дані (прогрес, налаштування, обране) будуть видалені, застосунок повернеться до початкового стану.',
      'legal.reset_confirm': 'Скинути дані й почати заново?',

      'error.no_decks': 'Немає словників для старту тренування.',

      'common.ok': 'OK',
      'common.cancel': 'Скасувати'
    },
    en: {
      'pro.already': 'PRO version is already active ✨',
      'pro.purchased': 'PRO version activated, thank you for your support! ✨',

      'legal.reset_warning': 'All data (progress, settings, favorites) will be erased and the app will be reset.',
      'legal.reset_confirm': 'Reset data and start over?',

      'error.no_decks': 'No decks available to start training.',

      'common.ok': 'OK',
      'common.cancel': 'Cancel'
    }
  };

  function getLang(){
    try {
      if (App.getUiLang && typeof App.getUiLang === 'function') {
        var l = App.getUiLang();
        if (l) return String(l).slice(0,2).toLowerCase();
      }
    } catch(_){}

    try {
      var htmlLang = (document.documentElement && document.documentElement.lang) || '';
      if (htmlLang) return String(htmlLang).slice(0,2).toLowerCase();
    } catch(_){}

    return 'ru';
  }

  function msg(key){
    var lang = getLang();
    var table = DICT[lang] || DICT.ru;
    if (table && Object.prototype.hasOwnProperty.call(table, key)) {
      return table[key];
    }
    if (DICT.ru && Object.prototype.hasOwnProperty.call(DICT.ru, key)) {
      return DICT.ru[key];
    }
    return key;
  }

  // Достаём текст по ключу
  App.Msg.text = msg;

  // Тост: показывает краткое уведомление в едином стиле
  App.Msg.toast = function(keyOrText, ms){
    var text;
    if (typeof keyOrText === 'string' && (DICT.ru[keyOrText] || DICT.uk[keyOrText] || DICT.en[keyOrText])) {
      text = msg(keyOrText);
    } else {
      text = String(keyOrText || '');
    }

    try {
      if (window.MoyaUpdates && typeof MoyaUpdates.setToast === 'function') {
        MoyaUpdates.setToast(text, ms || 2600);
        return;
      }
    } catch(_){}

    try { window.alert(text); } catch(_){}
  };


  // Кастомный модальный confirm с тем же визуалом, что и смена режима
  App.Msg.openConfirmModal = function(opts){
    opts = opts || {};
    var title = opts.title || '';
    var text = opts.text || '';
    var icon = typeof opts.icon === 'string' ? opts.icon : '⚙️';
    var okText = opts.okText || msg('common.ok');
    var cancelText = opts.cancelText || msg('common.cancel');

    try {
      document.querySelectorAll('.mm-modal-backdrop').forEach(function(n){ n.remove(); });
    } catch(_){}

    return new Promise(function(resolve){
      var root = document.createElement('div');
      root.className = 'mm-modal-backdrop';
      root.innerHTML = ''
        + '<div class="mm-modal" role="dialog" aria-modal="true" aria-labelledby="mmModalTitle" aria-describedby="mmModalText" tabindex="-1">'
        +   '<div class="mm-modal__icon" aria-hidden="true">' + icon + '</div>'
        +   '<div class="mm-modal__title" id="mmModalTitle">' + title + '</div>'
        +   '<div class="mm-modal__text" id="mmModalText">' + text + '</div>'
        +   '<div class="mm-modal__btns">'
        +     '<button type="button" class="mm-btn mm-btn--ghost" data-mm="cancel">' + cancelText + '</button>'
        +     '<button type="button" class="mm-btn mm-btn--primary" data-mm="ok">' + okText + '</button>'
        +   '</div>'
        + '</div>';

      document.body.appendChild(root);
      if (document.body.classList) {
        document.body.classList.add('mm-modal-open');
      }

      var btnOk = root.querySelector('[data-mm="ok"]');
      var btnCancel = root.querySelector('[data-mm="cancel"]');

      var closed = false;
      function close(val){
        if (closed) return;
        closed = true;
        if (root.classList) root.classList.add('hide');
        setTimeout(function(){
          try { root.remove(); } catch(_){}
          try { document.body.classList.remove('mm-modal-open'); } catch(_){}
          resolve(val);
        }, 180);
      }

      if (btnOk) btnOk.addEventListener('click', function(){ close(true); });
      if (btnCancel) btnCancel.addEventListener('click', function(){ close(false); });
      root.addEventListener('click', function(e){ if (e.target === root) close(false); });

      document.addEventListener('keydown', function onKey(e){
        if (!document.body.contains(root)) {
          document.removeEventListener('keydown', onKey);
          return;
        }
        if (e.key === 'Escape') { e.preventDefault(); close(false); }
        if (e.key === 'Enter')  { e.preventDefault(); close(true); }
      });

      setTimeout(function(){ try { if (btnOk) btnOk.focus(); } catch(_){ } }, 0);
    });
  };

  // Подтверждение действия: пока использует стандартный confirm,
  // но текст централизован в DICT
  App.Msg.confirm = function(keyOrText){
    var text;
    if (typeof keyOrText === 'string' && (DICT.ru[keyOrText] || DICT.uk[keyOrText] || DICT.en[keyOrText])) {
      text = msg(keyOrText);
    } else {
      text = String(keyOrText || '');
    }

    try {
      return window.confirm(text);
    } catch(_){
      return false;
    }
  };

})();