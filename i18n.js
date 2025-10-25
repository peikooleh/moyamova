/* ==========================================================
 * Project: MOYAMOVA
 * File: i18n.js
 * Purpose: Локализация (RU/UK), без EN
 * Version: 1.1
 * Last modified: 2025-10-23
*/

(function(){
  'use strict';

  // Базовый словарь
  window.I18N = {
    ru: {
      // ===== Приложение / заголовки =====
      appTitle: "MOYAMOVA",
      tagline: "Он научит!",

      // ===== Режимы / общие UI =====
      modeSelection: "Выбор режима",
      modeHard: "Сложный",
      modeNormal: "Обычный",
      reloadQuestion: "Перезагрузить?",
      updateNone: "обновлений нет",
      ok: "OK",
      choose: "Выберите перевод",
      iDontKnow: "Не знаю",

      // ===== Меню/подсказки/тултипы =====
      donateTitle: "Поддержать проект",
      donateMonoTitle: "Поддержать через Monobank",
      donatePaypalTitle: "Поддержать через PayPal",
      donateMonoOpen: "Открыть Monobank",
      donatePaypalOpen: "Открыть PayPal",
      donateLegalNote: "Донат является добровольным пожертвованием и не является оплатой товаров или услуг.",
      rotateToPortraitTitle: "Поверните устройство",
      rotateToPortraitText: "Доступен только портретный режим. Пожалуйста, используйте приложение вертикально.",
      settingsTitle: "Настройки",
      settingsInDev: "",
      tt_ui_theme: "Тема",
      tt_ui_lang: "Язык интерфейса",
      tt_dicts: "Словари",
      tt_favorites: "Избранное",
      tt_help: "Инструкция",
      tt_support: "Поддержка",
      tt_settings: "Настройки",

      // ===== Диалоги подтверждения =====
      confirmTitle: "Подтверждение",
      confirmOk: "ОК",
      confirmCancel: "Отмена",
      confirmModeReset: "Переключение режима сбросит прогресс в текущем словаре. Продолжить?",
      confirmFavReset: "Очистить «Избранное» для активного языка? Действие нельзя отменить.",
      confirmMistakesReset: "Очистить «Мои ошибки» для активного языка? Действие нельзя отменить.",

      // ===== Модалки/разделы =====
      modalTitle: "Словари",
      dictsHeader: "Словари",
      langLabel: "Язык",
      repeatLabel: "Сложность",
      themeLabel: "Тема",

      // ===== Статусы/счётчики =====
      totalWords: "Всего слов в словаре",
      learned: "Выучено",
      errors: "Ошибок",
      badgeSetWords: "Слов в наборе",
      badgeLearned: "Выучено",

      // ===== Разделы «Избранное» / «Мои ошибки» =====
      mistakesName: "Мои ошибки",
      allMistakesDone: "Все ошибки закрыты!",
      favTitle: "Избранное",
      ttPreview: "Предпросмотр",

      // ===== Части речи / категории =====
      pos_verbs: "Глаголы",
      pos_nouns: "Существительные",
      pos_adjs: "Прилагательные",
      pos_advs: "Наречия",
      pos_preps: "Предлоги",
      pos_pronouns: "Местоимения",
      pos_conjs: "Союзы",
      pos_particles: "Частицы",
      pos_numbers: "Числительные",
      pos_misc: "Словарь",

      // ===== Инфо / версия / лицензия =====
      infoTitle: "Инструкция",
      infoSteps: [
        "Запоминайте слова — увидели слово — выберите перевод.",
        "Добавляйте в Избранное — отмечайте важные слова, чтобы вернуться к ним позже.",
        "Используйте кнопку «Не знаю» — это помогает продвигаться дальше и не считается ошибкой."
      ],
      version: "Версия",
      status: "Статус",
      licensed: "Зарегистрировано",
      notLicensed: "Не зарегистрировано",

      // ===== Резервное копирование (Backup) =====
      backupTitle: "Резервное копирование",
      backupExport: "Экспортировать",
      backupImport: "Импортировать",
      backupExportOk: "Файл резервной копии успешно сохранён.",
      backupExportFail: "Ошибка при создании резервной копии.",
      // Важно: именно этот ключ используется тостом после импорта
      backupImportOk: "Импорт успешно завершён.",
      backupImportFail: "Ошибка восстановления. Проверьте файл.",

      // ===== Обновления (Updater / PWA) =====
      updateTitle: "Обновление",
      updatesNone: "Обновлений нет.",
      updateAvailable: "Доступно обновление.",
      updateApplied: "Обновление установлено. Приложение перезапустится.",
      updateCheck: "Проверить обновления",
      updateNow: "Обновить сейчас"
    },

    uk: {
      // ===== Додаток / заголовки =====
      appTitle: "MOYAMOVA",
      tagline: "Він навчить!",

      // ===== Режими / загальний UI =====
      modeSelection: "Вибір режиму",
      modeHard: "Складний",
      modeNormal: "Звичайний",
      reloadQuestion: "Перезавантажити?",
      updateNone: "оновлень немає",
      ok: "OK",
      choose: "Оберіть переклад",
      iDontKnow: "Не знаю",

      // ===== Меню/підказки/тултіпи =====
      donateTitle: "Підтримати проєкт",
      donateMonoTitle: "Підтримати через Monobank",
      donatePaypalTitle: "Підтримати через PayPal",
      donateMonoOpen: "Відкрити Monobank",
      donatePaypalOpen: "Відкрити PayPal",
      donateLegalNote: "Донат є добровільним пожертвуванням і не є оплатою товарів чи послуг.",
      rotateToPortraitTitle: "Поверніть пристрій",
      rotateToPortraitText: "Доступний лише портретний режим. Будь ласка, використовуйте застосунок вертикально.",
      settingsTitle: "Налаштування",
      settingsInDev: "",
      tt_ui_theme: "Тема",
      tt_ui_lang: "Мова інтерфейсу",
      tt_dicts: "Словники",
      tt_favorites: "Обране",
      tt_help: "Інструкція",
      tt_support: "Підтримка",
      tt_settings: "Налаштування",

      // ===== Діалоги підтвердження =====
      confirmTitle: "Підтвердження",
      confirmOk: "ОК",
      confirmCancel: "Скасувати",
      confirmModeReset: "Перемикання режиму скине прогрес у поточному словнику. Продовжити?",
      confirmFavReset: "Очистити «Обране» для активної мови? Дію не можна скасувати.",
      confirmMistakesReset: "Очистити «Мої помилки» для активної мови? Дію не можна скасувати.",

      // ===== Модалки/розділи =====
      modalTitle: "Словники",
      dictsHeader: "Словники",
      langLabel: "Мова",
      repeatLabel: "Складність",
      themeLabel: "Тема",

      // ===== Статуси/лічильники =====
      totalWords: "Всього слів в словнику",
      learned: "Вивчено",
      errors: "Помилок",
      badgeSetWords: "Слів у наборі",
      badgeLearned: "Вивчено",

      // ===== «Обране» / «Мої помилки» =====
      mistakesName: "Мої помилки",
      allMistakesDone: "Усі помилки закриті!",
      favTitle: "Обране",
      ttPreview: "Попередній перегляд",

      // ===== Частини мови / категорії =====
      pos_verbs: "Дієслова",
      pos_nouns: "Іменники",
      pos_adjs: "Прикметники",
      pos_advs: "Прислівники",
      pos_preps: "Прийменники",
      pos_pronouns: "Займенники",
      pos_conjs: "Сполучники",
      pos_particles: "Частки",
      pos_numbers: "Числівники",
      pos_misc: "Словник",

      // ===== Інфо / версія / ліцензія =====
      infoTitle: "Інструкція",
      infoSteps: [
        "Запам’ятовуйте слова — побачили слово — оберіть переклад.",
        "Додавайте в Обране — позначайте важливі слова, щоб повернутися до них пізніше.",
        "Користуйтесь кнопкою «Не знаю» — це допомагає рухатися далі й не вважається помилкою."
      ],
      version: "Версія",
      status: "Статус",
      licensed: "Зареєстровано",
      notLicensed: "Не зареєстровано",

      // ===== Резервне копіювання (Backup) =====
      backupTitle: "Резервне копіювання",
      backupExport: "Експортувати",
      backupImport: "Імпортувати",
      backupExportOk: "Файл резервної копії успішно збережено.",
      backupExportFail: "Помилка під час створення резервної копії.",
      // Важливо: саме цей ключ показується після імпорту
      backupImportOk: "Імпорт успішно завершено.",
      backupImportFail: "Помилка відновлення. Перевірте файл.",

      // ===== Оновлення (Updater / PWA) =====
      updateTitle: "Оновлення",
      updatesNone: "Оновлень немає.",
      updateAvailable: "Доступне оновлення.",
      updateApplied: "Оновлення встановлено. Додаток перезапуститься.",
      updateCheck: "Перевірити оновлення",
      updateNow: "Оновити зараз"
    }
  };

  // Доп. локали для списка языков интерфейса в приложении (без EN)
  try {
    if (window.App && App.locales) {
      App.locales.ru = Object.assign(App.locales.ru||{}, { allLangs: "Все языки",  lang_sr: "Сербский" });
      App.locales.uk = Object.assign(App.locales.uk||{}, { allLangs: "Всі мови",   lang_sr: "Сербська" });
    }
  } catch(_) {}

  // Запасные подписи «Закрыть» (если где-то ожидаются)
  try {
    (window.App = window.App || {});
    App.dict = App.dict || {};
    App.dict.ru = App.dict.ru || {};
    App.dict.uk = App.dict.uk || {};
    if (!App.dict.ru.close) App.dict.ru.close = "Закрыть";
    if (!App.dict.uk.close) App.dict.uk.close = "Закрити";
  } catch(_) {}

})();
