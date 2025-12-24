/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: pro.js
 * Назначение: Экран/лист PRO-версии (разовая покупка)
 * Версия: 2.0
 * Обновлено: 2025-12-02
 * ========================================================== */

(function(root){
  'use strict';
  var A = root.App = root.App || {};

  /* ========================================================
   * Локализация
   * ====================================================== */

  function getUiLang(){
    try {
      var s = (A.settings && (A.settings.lang || A.settings.uiLang)) || 'ru';
      s = String(s || '').toLowerCase();
      return (s === 'uk') ? 'uk' : 'ru';
    } catch (e) {
      return 'ru';
    }
  }

  function t(){
    var uk = getUiLang() === 'uk';
    return uk ? {
      title: 'MOYAMOVA PRO',
      subtitle: 'Разове розблокування розширеного функціоналу',
      featuresTitle: 'У версію PRO входить:',
      f1: 'Розширена статистика та календар прогресу',
      f2: 'Озвучка слів і повні підказки: приклади, синоніми та антоніми',
      f3: 'Розширені режими тренування та рівні складності',
      f4: 'Повний контроль над словниками і помилками',
      buy: 'Купити PRO',
      already: 'У вас вже активована версія PRO',
      close: 'Закрити',
      badge: 'Раз і назавжди',

      chooseMethod: 'Оберіть спосіб оплати',
      paypalShort: 'PayPal',
      otherShort: 'Інші способи',
      soon: 'Скоро',
      payWithPaypal: 'Оплатити через PayPal-акаунт',
      otherDesc: 'Ми працюємо над підтримкою популярних способів оплати в різних країнах.',

      haveCode: 'Ввести код',
      enterCode: 'Введіть код активації',
      codeInvalid: 'Невірний код активації'
    } : {
      title: 'MOYAMOVA PRO',
      subtitle: 'Разовая разблокировка расширенного функционала',
      featuresTitle: 'В PRO-версию входит:',
      f1: 'Расширенная статистика и календарь прогресса',
      f2: 'Озвучка слов и полные подсказки: примеры, синонимы и антонимы',
      f3: 'Расширенные режимы тренировки и уровни сложности',
      f4: 'Полный контроль над словарями и ошибками',
      buy: 'Купить PRO',
      already: 'У вас уже активирована версия PRO',
      close: 'Закрыть',
      badge: 'Раз и навсегда',

      chooseMethod: 'Выберите способ оплаты',
      paypalShort: 'PayPal',
      otherShort: 'Другие способы',
      soon: 'Скоро',
      payWithPaypal: 'Оплатить через PayPal-аккаунт',
      otherDesc: 'Мы работаем над поддержкой популярных способов оплаты в разных странах.',

      haveCode: 'Ввести код',
      enterCode: 'Введите код активации',
      codeInvalid: 'Неверный код активации'
    };
  }

  /* ========================================================
   * Состояние листа PRO
   * ====================================================== */

  var sheet = null;
  var paypalRendered = false;
  var currentPayPage = 0;

  /* ========================================================
   * Стили
   * ====================================================== */

  function ensureStyles(){
    if (document.getElementById('pro-sheet-style')) return;

    var css = ''
      + '.pro-sheet-overlay{position:fixed;inset:0;background:rgba(15,23,42,.65);z-index:9990;}'
      + '.pro-sheet{position:fixed;left:0;right:0;bottom:0;z-index:9991;border-radius:16px 16px 0 0;'
      + 'background:var(--card-bg,rgba(15,23,42,.98));color:var(--text-primary,#fff);box-shadow:0 -10px 40px rgba(15,23,42,.9);'
      + 'max-width:520px;margin:0 auto;padding:16px 18px 20px;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}'
      + '@media (prefers-color-scheme:light){.pro-sheet{background:var(--card-bg,#fff);color:var(--text-primary,#0f172a);}}'

      + '.pro-sheet__title{font-size:18px;font-weight:700;margin-bottom:4px;text-align:center;'
      + 'color:var(--accent,var(--brand,#35b6ff));}'
      + '.pro-sheet__subtitle{font-size:13px;opacity:.8;margin-bottom:12px;text-align:center;}'
      + '.pro-sheet__features-title{font-size:13px;font-weight:600;margin-bottom:6px;}'
      + '.pro-sheet__list{margin:0 0 14px;padding-left:18px;font-size:13px;}'
      + '.pro-sheet__list li{margin-bottom:4px;}'
      + '.pro-sheet__actions{display:flex;gap:12px;justify-content:center;margin-top:8px;}'
      + '.pro-sheet__btn{border:0;border-radius:12px;padding:9px 20px;font-size:14px;cursor:pointer;min-width:120px;}'
      + '.pro-sheet__btn--primary{background:var(--accent,var(--brand,#35b6ff));color:#fff;}'
      + '.pro-sheet__btn--ghost{background:transparent;color:inherit;border:1px solid rgba(148,163,184,.6);}'
      + '.pro-sheet__badge{display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;'
      + 'padding:0;border-radius:999px;color:inherit;margin:0 auto 10px auto;background:transparent;}'
      + '.pro-sheet__badge span{font-size:15px;}'

      + '.pro-payments{margin-top:14px;padding-top:10px;border-top:1px solid rgba(148,163,184,.3);}'
      + '.pro-payments__header{font-size:13px;font-weight:600;text-align:center;margin-bottom:8px;}'
      + '.pro-payments__dots{display:flex;justify-content:center;gap:10px;margin-bottom:10px;}'
      + '.pro-payments__dot{width:8px;height:8px;border-radius:999px;border:0;padding:8px;'
      + 'background:rgba(148,163,184,.6);cursor:pointer;position:relative;}'
      + '.pro-payments__dot::after{content:"";position:absolute;inset:4px;border-radius:999px;}'
      + '.pro-payments__dot--active{background:var(--accent,var(--brand,#35b6ff));}'
      + '.pro-payments__pages{position:relative;min-height:120px;}'
      + '.pro-payments__page{display:none;font-size:13px;line-height:1.4;}'
      + '.pro-payments__page--active{display:block;}'
      + '.pro-payments__title{font-weight:600;margin-bottom:4px;text-align:center;}'
      + '.pro-payments__text{font-size:13px;opacity:.85;margin-bottom:10px;text-align:center;}'
      + '.pro-payments__soon{font-size:13px;opacity:.7;text-align:center;}'
      + '.pro-payments__soon strong{font-weight:600;}'
      + '.pro-sheet__paypal{margin-top:8px;}';

    var style = document.createElement('style');
    style.id = 'pro-sheet-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ========================================================
   * Закрытие листа
   * ====================================================== */

  function close(){
    if (!sheet) return;
    sheet.remove();
    sheet = null;
    paypalRendered = false;
    currentPayPage = 0;
    document.body.classList.remove('pro-open');
  }

  /* ========================================================
   * Активация PRO (после оплаты или мастер-кода)
   * ====================================================== */

  function activateProAfterPayment(){
    var texts = t();
    var already = false;

    try {
      if (typeof A.isPro === 'function') {
        already = !!A.isPro();
      } else {
        try {
          already = root.localStorage.getItem('mm.proUnlocked') === '1';
        } catch (_) {}
      }
    } catch (_) {}

    try {
      if (typeof A.unlockPro === 'function') {
        A.unlockPro();
      } else {
        root.localStorage.setItem('mm.proUnlocked', '1');
      }
    } catch (e) {
      console.error('[PRO] Failed to persist PRO flag', e);
    }

    var TOAST_MS = 2600;
    if (root.App && root.App.Msg && typeof root.App.Msg.toast === 'function') {
      root.App.Msg.toast(already ? 'pro.already' : 'pro.purchased', TOAST_MS);
    } else {
      var fallback = already
        ? (texts.already || 'PRO уже активирована')
        : (texts.already || 'PRO активирована');
      alert(fallback);
    }

    try {
      setTimeout(function(){ root.location.reload(); }, TOAST_MS - 200);
    } catch(e) {}
  }

  /* ========================================================
   * Переключение страниц способов оплаты
   * ====================================================== */

  function setPayPage(index){
    currentPayPage = index;

    if (!sheet) return;
    var dots = sheet.querySelectorAll('.pro-payments__dot');
    var pages = sheet.querySelectorAll('.pro-payments__page');

    dots.forEach(function(dot){
      var i = parseInt(dot.getAttribute('data-pay-page'), 10) || 0;
      if (i === index) {
        dot.classList.add('pro-payments__dot--active');
      } else {
        dot.classList.remove('pro-payments__dot--active');
      }
    });

    pages.forEach(function(page){
      var i = parseInt(page.getAttribute('data-pay-page'), 10) || 0;
      if (i === index) {
        page.classList.add('pro-payments__page--active');
      } else {
        page.classList.remove('pro-payments__page--active');
      }
    });
  }

  function initPaymentsNavigation(){
    if (!sheet) return;
    var dots = sheet.querySelectorAll('.pro-payments__dot');
    dots.forEach(function(dot){
      dot.addEventListener('click', function(){
        var i = parseInt(dot.getAttribute('data-pay-page'), 10) || 0;
        setPayPage(i);
      }, { passive: true });
    });
    setPayPage(0);
  }

  /* ========================================================
   * Инициализация PayPal-кнопки (только аккаунт)
   * ====================================================== */

  function initPaypalButtons(){
    if (paypalRendered) return;
    paypalRendered = true;

    if (typeof root.paypal === 'undefined') {
      console.warn('[PRO] PayPal SDK not loaded');
      alert('PayPal SDK сейчас недоступен. Попробуйте обновить страницу.');
      return;
    }

    var paypalFunding   = root.paypal.FUNDING || {};
    var hasFundingCheck = typeof root.paypal.isFundingAvailable === 'function';

    var paypalContainer = sheet && sheet.querySelector('#paypal-button-container');

    function createConfig(){
      return {
        createOrder: function (data, actions) {
          return actions.order.create({
            purchase_units: [{
              amount: { value: '9.99' } // цена PRO (должна совпадать с paypal-confirm.js)
            }]
          });
        },
        onApprove: function (data, actions) {
          return actions.order.capture().then(function (details) {
            console.log('[PRO][PayPal] Payment captured:', details);

            return fetch('/api/paypal-confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderID: data.orderID })
            })
            .then(function (r) { return r.json(); })
            .then(function (res) {
              console.log('[PRO] /api/paypal-confirm response:', res);

              if (res && res.ok) {
                activateProAfterPayment();
              } else {
                alert('Оплату не удалось подтвердить. Статус: ' + (res && res.status ? res.status : 'unknown'));
              }
            })
            .catch(function (err) {
              console.error('[PRO] Error calling /api/paypal-confirm:', err);
              alert('Ошибка при подтверждении оплаты. Попробуйте позже.');
            });
          });
        },
        onError: function (err) {
          console.error('[PRO][PayPal] Error:', err);
          alert('Ошибка PayPal. Детали в консоли браузера.');
        }
      };
    }

    // Жёлтая кнопка PayPal (только оплата через аккаунт)
    if (paypalContainer && (!hasFundingCheck || root.paypal.isFundingAvailable(paypalFunding.PAYPAL))) {
      try {
        var cfgPaypal = createConfig();
        cfgPaypal.fundingSource = paypalFunding.PAYPAL;
        root.paypal.Buttons(cfgPaypal).render('#paypal-button-container');
      } catch (e) {
        console.error('[PRO] Failed to render PayPal button:', e);
      }
    }
  }

  /* ========================================================
   * Активация по мастер-коду
   * ====================================================== */

  function onHaveCodeClick(){
    var texts = t();

    try {
      var code = root.prompt(texts.enterCode || 'Введите код активации');
      if (!code) return;

      fetch('/api/pro-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: code })
      })
      .then(function(r){ return r.json(); })
      .then(function(res){
        if (res && res.ok) {
          activateProAfterPayment();
        } else {
          alert(texts.codeInvalid || 'Неверный код активации');
        }
      })
      .catch(function(err){
        console.error('[PRO] Error calling /api/pro-key:', err);
        alert('Ошибка при проверке кода. Попробуйте позже.');
      });
    } catch (e) {
      console.error('[PRO] Master key error:', e);
    }
  }

  /* ========================================================
   * Обработчики
   * ====================================================== */

  function onBuyClick(){
    if (!sheet) return;
    var payments = sheet.querySelector('#pro-payments');
    if (!payments) return;

    payments.style.display = 'block';
    initPaymentsNavigation();
    initPaypalButtons();

    try {
      payments.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (_) {}
  }

  /* ========================================================
   * Открытие PRO-листа
   * ====================================================== */

  function open(){
    ensureStyles();
    var texts = t();

    if (sheet){
      sheet.classList.add('pro-sheet--pulse');
      setTimeout(function(){ sheet && sheet.classList.remove('pro-sheet--pulse'); }, 500);
      return;
    }

    document.body.classList.add('pro-open');

    var html = ''
      + '<div class="pro-sheet-overlay" data-pro-close="1"></div>'
      + '<section class="pro-sheet" role="dialog" aria-modal="true">'
      + '  <div class="pro-sheet__badge">💎 <span>' + texts.badge + '</span></div>'
      + '  <div class="pro-sheet__title">' + texts.title + '</div>'
      + '  <div class="pro-sheet__subtitle">' + texts.subtitle + '</div>'
      + '  <div class="pro-sheet__features-title">' + texts.featuresTitle + '</div>'
      + '  <ul class="pro-sheet__list">'
      + '    <li>' + texts.f1 + '</li>'
      + '    <li>' + texts.f2 + '</li>'
      + '    <li>' + texts.f3 + '</li>'
      + '    <li>' + texts.f4 + '</li>'
      + '  </ul>'
      + '  <div class="pro-sheet__actions">'
      + '    <button type="button" class="pro-sheet__btn pro-sheet__btn--ghost" data-pro-close="1">' + texts.close + '</button>'
      + '    <button type="button" class="pro-sheet__btn pro-sheet__btn--primary" data-pro-buy="1">' + texts.buy + '</button>'
      + '    <button type="button" class="pro-sheet__btn pro-sheet__btn--ghost" data-pro-code="1">' + texts.haveCode + '</button>'
      + '  </div>'

      // блок выбора способа оплаты
      + '  <div id="pro-payments" class="pro-payments" style="display:none;">'
      + '    <div class="pro-payments__header">' + texts.chooseMethod + '</div>'
      + '    <div class="pro-payments__dots" role="tablist" aria-label="' + texts.chooseMethod + '">'
      + '      <button type="button" class="pro-payments__dot pro-payments__dot--active" data-pay-page="0" aria-label="' + texts.paypalShort + '"></button>'
      + '      <button type="button" class="pro-payments__dot" data-pay-page="1" aria-label="' + texts.otherShort + '"></button>'
      + '    </div>'
      + '    <div class="pro-payments__pages">'

      // страница 0 — PayPal
      + '      <section class="pro-payments__page pro-payments__page--active" data-pay-page="0">'
      + '        <div class="pro-payments__title">PayPal</div>'
      + '        <div class="pro-payments__text">' + texts.payWithPaypal + '</div>'
      + '        <div id="paypal-button-container" class="pro-sheet__paypal"></div>'
      + '      </section>'

      // страница 1 — другие методы (заглушка)
      + '      <section class="pro-payments__page" data-pay-page="1">'
      + '        <div class="pro-payments__title">' + texts.otherShort + '</div>'
      + '        <div class="pro-payments__text">' + texts.otherDesc + '</div>'
      + '        <div class="pro-payments__soon"><strong>' + texts.soon + '</strong></div>'
      + '      </section>'

      + '    </div>'
      + '  </div>'

      + '</section>';

    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    sheet = wrap;
    document.body.appendChild(sheet);

    var closeNodes = sheet.querySelectorAll('[data-pro-close]');
    if (closeNodes && closeNodes.length) {
      closeNodes.forEach(function(node){
        node.addEventListener('click', close, { passive:true });
      });
    }

    var buyBtn = sheet.querySelector('[data-pro-buy]');
    if (buyBtn) {
      buyBtn.addEventListener('click', onBuyClick, { passive:true });
    }

    var codeBtn = sheet.querySelector('[data-pro-code]');
    if (codeBtn) {
      codeBtn.addEventListener('click', onHaveCodeClick, { passive:true });
    }
  }

  /* ========================================================
   * Публичный API
   * ====================================================== */

  root.ProUpgrade = { open: open, close: close };

})(window);
/* ========================= Конец файла: pro.js ========================= */
