/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: i18n.js
 * Назначение: Текстовые ресурсы и локализация интерфейса
 * Версия: 1.0
 * Обновлено: 2025-11-17
 * ========================================================== */

(function () {
  'use strict';

  // ------------------------------------------------------------
  // Словари
  // ------------------------------------------------------------
  window.I18N = {
    ru: {
      // === auto: donate ===
      donateTitle: "Поддержать проект",
      donateLegalNote: "Ваше пожертвование является добровольным и не является оплатой товаров или услуг.",
      donateMonoTitle: "Поддержать через Monobank",
      donateMonoOpen: "Открыть Monobank",
      donatePaypalTitle: "Поддержать через PayPal",
      donatePaypalOpen: "Открыть PayPal",
      donateThanks: "Каждый донат помогает нам развивать MOYAMOVA — добавлять новые функции и словари, улучшать обучение и сохранять приложение свободным от рекламы. Спасибо за вашу поддержку!",
      ariaBack: "Назад",
      ariaClose: "Закрыть",
      ariaDicts: "Словари",
      ariaFav: "Избранное",
      ariaGuide: "Инструкция",
      ariaHome: "Главная",
      ariaMenu: "Меню",
      ariaMistakes: "Мои ошибки",
      ariaStats: "Статистика",
      btnCheckUpdates: "Проверить обновления",
      btnExport: "Экспорт",
      btnImport: "Импорт",
      menuAppVersion: "Версия приложения",
      menuBackup: "Резервное копирование",
      menuLevel: "Режим сложности",
      menuTheme: "Тема",
      menuUiLang: "Язык интерфейса",
      menuUpdates: "Обновления",
      // === training prefs (PWA/TWA) ===
      menuFocus: "Концентрация",
      focusSets: "Сеты",
      focusContext: "Контекст",
      menuTrainingMode: "Режим тренировки",
      trainTranslate: "Перевод",
      trainReverse: "Обратный",
      trainSetsNav: "Переход по сетам",
      trainAuto: "Авто",
      legalTerms: "Условия",
      legalPrivacy: "Конфиденциальность",
      legalImpressum: "Юридическая информация",
      // === filters ===
      filtersBtn: "Фильтры",
      filtersTitle: "Фильтры",
      filtersLevels: "Уровни",
      filtersTopics: "Темы",
      filtersNoFilter: "Без фильтра",
      filtersReset: "Сбросить",
      filtersApply: "Применить",
      filtersVirtualTitle: "Фильтры недоступны",
      filtersVirtualText: "В Избранном и Моих ошибках тренируются все сохранённые слова. Дополнительные фильтры не применяются.",
      filtersPrepsTitle: "Фильтры недоступны",
      filtersPrepsText: "Для упражнения «Предлоги» фильтрация недоступна.",
      // aliases (older keys used in some builds)
      filtersDisabledTitle: "Фильтры недоступны",
      filtersDisabledPreps: "Для упражнения «Предлоги» фильтрация недоступна.",
      filtersEmpty: "По выбранным фильтрам нет слов.",
      filtersOpen: "Открыть фильтры",

    },
    uk: {
      // === auto: donate ===
      donateTitle: "Підтримати проєкт",
      donateLegalNote: "Ваш донат є добровільним і не є оплатою товарів чи послуг.",
      donateMonoTitle: "Підтримати через Monobank",
      donateMonoOpen: "Відкрити Monobank",
      donatePaypalTitle: "Підтримати через PayPal",
      donatePaypalOpen: "Відкрити PayPal",
      donateThanks: "Кожен донат допомагає нам розвивати MOYAMOVA — додавати нові функції та словники, покращувати навчання і зберігати застосунок вільним від реклами. Дякуємо за вашу підтримку!",
      ariaBack: "Назад",
      ariaClose: "Закрити",
      ariaDicts: "Словники",
      ariaFav: "Вибране",
      ariaGuide: "Інструкція",
      ariaHome: "Головна",
      ariaMenu: "Меню",
      ariaMistakes: "Мої помилки",
      ariaStats: "Статистика",
      btnCheckUpdates: "Перевірити оновлення",
      btnExport: "Експорт",
      btnImport: "Імпорт",
      menuAppVersion: "Версія застосунку",
      menuBackup: "Резервне копіювання",
      menuLevel: "Режим складності",
      menuTheme: "Тема",
      menuUiLang: "Мова інтерфейсу",
      menuUpdates: "Оновлення",

      // === training prefs (PWA/TWA) ===
      menuFocus: "Концентрація",
      focusSets: "Сети",
      focusContext: "Контекст",
      menuTrainingMode: "Режим тренування",
      trainTranslate: "Переклад",
      trainReverse: "Зворотний",
      trainSetsNav: "Перехід по сетах",
      trainAuto: "Авто",
      // === training prefs (PWA/TWA) ===
      menuFocus: "Концентрація",
      focusSets: "Сети",
      focusContext: "Контекст",
      menuTrainingMode: "Режим тренування",
      trainTranslate: "Переклад",
      trainReverse: "Зворотний",
      trainSetsNav: "Перехід по сетах",
      trainAuto: "Авто",
      legalTerms: "Умови",
      legalPrivacy: "Конфіденційність",
      legalImpressum: "Юридична інформація",
    
      // === filters ===
      filtersBtn: "Фільтри",
      filtersTitle: "Фільтри",
      filtersLevels: "Рівні",
      filtersTopics: "Теми",
      filtersNoFilter: "Без фільтра",
      filtersReset: "Скинути",
      filtersApply: "Застосувати",
      filtersVirtualTitle: "Фільтри недоступні",
      filtersVirtualText: "В Обраному та Моїх помилках тренуються всі збережені слова. Додаткові фільтри не застосовуються.",
      filtersPrepsTitle: "Фільтри недоступні",
      filtersPrepsText: "Для вправи «Прийменники» фільтрація недоступна.",
      // aliases (older keys used in some builds)
      filtersDisabledTitle: "Фільтри недоступні",
      filtersDisabledPreps: "Для вправи «Прийменники» фільтрація недоступна.",
      filtersEmpty: "За вибраними фільтрами немає слів.",
      filtersOpen: "Відкрити фільтри",
}
  };

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  window.I18N_getLang = function () {
    try {
      const A = window.App || {};
      const l =
        (A.settings && (A.settings.lang || A.settings.uiLang)) ||
        document.documentElement.getAttribute('lang') ||
        'ru';
      return String(l).toLowerCase() === 'uk' ? 'uk' : 'ru';
    } catch (_) {
      return 'ru';
    }
  };

  window.I18N_t = function (key) {
    const lang = window.I18N_getLang();
    try {
      const dict = (window.I18N && window.I18N[lang]) || {};
      if (Object.prototype.hasOwnProperty.call(dict, key)) return String(dict[key]);
    } catch (_) {}
    try {
      const dict = (window.I18N && window.I18N['ru']) || {};
      if (Object.prototype.hasOwnProperty.call(dict, key)) return String(dict[key]);
    } catch (_) {}
    return key;
  };

  window.applyI18n = function (scope) {
    const root = scope || document;
    if (!root) return;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      const k = el.getAttribute('data-i18n');
      if (!k) return;
      const val = window.I18N_t(k);
      if (val !== k) el.textContent = val;
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      const k = el.getAttribute('data-i18n-aria');
      if (!k) return;
      const val = window.I18N_t(k);
      if (val !== k) el.setAttribute('aria-label', val);
    });
  };

  // ------------------------------------------------------------
  // Первичные события
  // ------------------------------------------------------------
  try {
    document.addEventListener('DOMContentLoaded', function () {
      try { window.applyI18n(); } catch (_) {}
    });
    window.addEventListener('lexitron:ui-lang-changed', function () {
      try { window.applyI18n(); } catch (_) {}
    });
    document.addEventListener('lexitron:ui-lang-changed', function () {
      try { window.applyI18n(); } catch (_) {}
    });
  } catch (_) {}

  // --- дополнительное применение перевода после полной инициализации ---
  setTimeout(function () {
    try { window.applyI18n(document); } catch (_) {}
  }, 500);

  // ------------------------------------------------------------
  // 🔄 Автоматическое применение перевода к новым элементам DOM
  // ------------------------------------------------------------
  (function enableAutoI18n() {
    if (!('MutationObserver' in window)) return;

    const observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue; // только элементы
          if (
            node.hasAttribute('data-i18n') ||
            node.hasAttribute('data-i18n-aria') ||
            node.querySelector('[data-i18n], [data-i18n-aria]')
          ) {
            try {
              window.applyI18n && window.applyI18n(node);
            } catch (err) {
              console.warn('Auto-i18n failed:', err);
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.info('✅ Auto-i18n observer active');
  })();

})(); // 🔸 Закрывает главный (function(){ ... }) блок i18n.js
/* ========================= Конец файла: i18n.js ========================= */
