/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: view.stats.js
 * Назначение: Экран статистики
 * Версия: 1.0
 * Обновлено: 2025-11-17
 * ========================================================== */

(function () {
  'use strict';
  const A = (window.App = window.App || {});

  /* ---------------------- helpers ---------------------- */

  function getUiLang() {
    const s = (A.settings && (A.settings.lang || A.settings.uiLang)) || 'ru';
    return String(s).toLowerCase() === 'uk' ? 'uk' : 'ru';
  }

  function t() {
    const uk = getUiLang() === 'uk';
    const i = (A.i18n && A.i18n()) || null;
    return {
      title: (i && i.statsTitle) || (uk ? 'Статистика' : 'Статистика'),
      coreTitle: uk ? 'Основні частини мови' : 'Основные части речи',
      otherTitle: uk ? 'Інші частини мови' : 'Другие части речи',
      splitTitle: uk ? 'Вивчено: переклади vs артиклі' : 'Выучено: переводы vs артикли',
      activityTitle: uk ? 'Активність' : 'Активность',
      activityNoData: uk
        ? 'Ще немає даних про активність — продовжуйте тренуватися, і тут з’являться кола за днями.'
        : 'Пока нет данных об активности — продолжайте тренироваться, и здесь появятся кружки по дням.',
            activityLegendCaption: uk
        ? 'Останні 35 днів'
        : 'Последние 35 дней',
      activityLegendLow: uk
        ? 'Легкий день'
        : 'Лёгкий день',
      activityLegendMid: uk
        ? 'Стабільно'
        : 'Стабильно',
      activityLegendHigh: uk
        ? 'Дуже активно'
        : 'Очень активно',
      weekdayShort: uk
        ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
        : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      placeholderTitle: uk ? 'Активність і якість' : 'Активность и качество',
      placeholderTitle: uk ? 'Активність і якість' : 'Активность и качество',
      placeholderText: uk
        ? 'Тут пізніше з’явиться статистика за часом у застосунку, регулярністю та якістю запам’ятовування.'
        : 'Здесь позже появится статистика по времени в приложении, регулярности и качеству запоминания.',
      learnedLangShort: function (learned, total) {
        return uk
          ? 'Вивчено ' + learned + ' з ' + total + ' слів'
          : 'Выучено ' + learned + ' из ' + total + ' слов';
      },
      decksSummary: function (started, completed, totalDecks) {
        return uk
          ? 'Словників: ' +
              totalDecks +
              ' • розпочато: ' +
              started +
              ' • завершено: ' +
              completed
          : 'Словарей: ' +
              totalDecks +
              ' • начато: ' +
              started +
              ' • завершено: ' +
              completed;
      },
      // fallback на случай, если не нашли имя словаря
      fallbackPosName: function (pos) {
        const uk = getUiLang() === 'uk';
        const mapRu = {
          nouns: 'Существительные',
          verbs: 'Глаголы',
          adjectives: 'Прилагательные',
          adverbs: 'Наречия',
          pronouns: 'Местоимения',
          prepositions: 'Предлоги',
          conjunctions: 'Союзы',
          particles: 'Частицы',
          numbers: 'Числительные',
          other: 'Другое'
        };
        const mapUk = {
          nouns: 'Іменники',
          verbs: 'Дієслова',
          adjectives: 'Прикметники',
          adverbs: 'Прислівники',
          pronouns: 'Займенники',
          prepositions: 'Прийменники',
          conjunctions: 'Сполучники',
          particles: 'Частки',
          numbers: 'Числівники',
          other: 'Інше'
        };
        const dict = uk ? mapUk : mapRu;
        return dict[pos] || pos;
      }
    };
  }


  function isLernpunktKey(deckKey) {
    return /_lernpunkt\b/i.test(String(deckKey || ''));
  }

  function currentDeckGroup() {
    // Контекст статистики: базовые деки vs LearnPunkt.
    // Используем последний выбранный словарь, чтобы не смешивать прогресс между группами.
    try {
      var k = (A.settings && A.settings.lastDeckKey) || '';
      return isLernpunktKey(k) ? 'lernpunkt' : 'base';
    } catch (_) {
      return 'base';
    }
  }

  /* ---------------------- раздельное время (слова/артикли) ---------------------- */

  function sumSplitSecondsByLang(langCode) {
    try {
      var store = (A.state && A.state.activity) || {};
      var langMap = store[langCode];
      if (!langMap) return { words: 0, articles: 0, total: 0 };

      var words = 0;
      var articles = 0;
      var total = 0;

      Object.keys(langMap).forEach(function (dateKey) {
        var row = langMap[dateKey] || {};
        total += Number(row.seconds || 0);
        words += Number(row.wordsSeconds || 0);
        articles += Number(row.articlesSeconds || 0);
      });

      // Фолбэк для старых данных: если wordsSeconds нет, но total есть — считаем остаток.
      if (words <= 0 && total > 0 && articles > 0) {
        words = Math.max(0, total - articles);
      }

      return { words: words, articles: articles, total: total };
    } catch (_) {
      return { words: 0, articles: 0, total: 0 };
    }
  }

  function countLearnedArticlesByLang(langCode) {
    try {
      if (!A.ArticlesProgress || typeof A.ArticlesProgress.export !== 'function') return 0;
      if (!A.Decks || typeof A.Decks.langOfKey !== 'function') return 0;

      var data = A.ArticlesProgress.export();
      var byDeck = (data && data.byDeck) || {};
      var max = 5;
      try { max = Number(A.ArticlesProgress.starsMax ? A.ArticlesProgress.starsMax() : 5) || 5; } catch (_) {}

      var group = currentDeckGroup();
      var cnt = 0;
      Object.keys(byDeck).forEach(function (deckKey) {
        var lk = null;
        try { lk = A.Decks.langOfKey(deckKey) || null; } catch (_) { lk = null; }
        if (!lk || lk !== langCode) return;
        if (group === 'lernpunkt' ? !isLernpunktKey(deckKey) : isLernpunktKey(deckKey)) return;

        var map = byDeck[deckKey] || {};
        Object.keys(map).forEach(function (wordId) {
          var e = map[wordId] || {};
          var s = Number(e.s || 0);
          if (s >= max) cnt += 1;
        });
      });
      return cnt;
    } catch (_) {
      return 0;
    }
  }

  function countLearnedWordsByLang(langCode) {
    // Считаем «выучено слов с переводами» — это прогресс обычного тренера слов.
    // Важно: используем тот же контекст base vs lernpunkt, чтобы не смешивать данные.
    try {
      if (!A.Decks || typeof A.Decks.builtinKeys !== 'function') return 0;
      var decksApi = A.Decks;
      var group = currentDeckGroup();
      var cnt = 0;
      var keys = decksApi.builtinKeys() || [];
      keys = (keys || []).filter(function (k) {
        return group === 'lernpunkt' ? isLernpunktKey(k) : !isLernpunktKey(k);
      });

      keys.forEach(function (deckKey) {
        var lk = null;
        try { lk = decksApi.langOfKey(deckKey) || null; } catch (_) { lk = null; }
        if (!lk || lk !== langCode) return;

        var words = decksApi.resolveDeckByKey(deckKey) || [];
        if (!words.length) return;

        words.forEach(function (w) {
          if (isWordLearned(w, deckKey)) cnt += 1;
        });
      });

      return cnt;
    } catch (_) {
      return 0;
    }
  }

  function formatMinutes(seconds) {
    seconds = Number(seconds || 0);
    if (!seconds || seconds <= 0) return '0 мин';
    var min = Math.round(seconds / 60);
    return min + ' мин';
  }

  function renderTimeSplitSet(langCode, texts) {
    // Диаграмма на этой странице должна показывать не время,
    // а сравнение «выучено переводов слов» vs «выучено слов с артиклями».
    var split = sumSplitSecondsByLang(langCode);
    var learnedArticles = countLearnedArticlesByLang(langCode);
    var learnedWords = countLearnedWordsByLang(langCode);

    var totalLearned = learnedWords + learnedArticles;
    if (!totalLearned) totalLearned = 1;

    var pArticles = Math.round((learnedArticles / totalLearned) * 100);
    var pWords = 100 - pArticles;

    var uk = getUiLang() === 'uk';

    // Используем тот же "кольцевой" визуал 1:1 (layers + legend), только 2 сегмента.
    var buckets = [
      { key: 'words', label: uk ? 'Переклади' : 'Переводы', value: learnedWords, percent: pWords, color: 'var(--stats-color-verbs, #0ea5e9)' },
      { key: 'articles', label: uk ? 'Артиклі' : 'Артикли', value: learnedArticles, percent: pArticles, color: 'var(--stats-color-nouns, #6366f1)' }
    ];

    var layersHtml = buckets.map(function (b, idx) {
      var angle = degreesFromPercent(b.percent);
      var scale = buckets.length === 1 ? 1 : 1 - idx * 0.18;
      return (
        '<div class="stats-ring-layer" style="--ring-angle:' + angle + 'deg;--ring-scale:' + scale + ';--ring-color:' + b.color + ';">' +
          '<div class="stats-ring-layer__ring"></div>' +
        '</div>'
      );
    }).join('');

    var legendHtml = buckets.map(function (b) {
      return (
        '<div class="stats-ring-legend__item" style="--ring-color:' + b.color + ';">' +
          '<span class="stats-ring-legend__dot"></span>' +
          '<span class="stats-ring-legend__label">' + b.label + '</span>' +
          '<span class="stats-ring-legend__value">' + b.value + '</span>' +
        '</div>'
      );
    }).join('');

    // Метрики под легендой: две строки (артикли / переводы) и две колонки (выучено / время).
    var extraHtml =
      '<div class="stats-split-metrics">' +
        '<div class="stats-split-metrics__row">' +
          '<div class="stats-split-metrics__cell">' +
            '<div class="stats-split-metrics__label">' + (uk ? 'Вивчено слів з артиклями' : 'Выучено слов с артиклями') + '</div>' +
            '<div class="stats-split-metrics__value">' + learnedArticles + '</div>' +
          '</div>' +
          '<div class="stats-split-metrics__cell">' +
            '<div class="stats-split-metrics__label">' + (uk ? 'Час у тренері артиклів' : 'Время в тренере артиклей') + '</div>' +
            '<div class="stats-split-metrics__value">' + formatMinutes(split.articles) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="stats-split-metrics__row">' +
          '<div class="stats-split-metrics__cell">' +
            '<div class="stats-split-metrics__label">' + (uk ? 'Вивчено слів з перекладами' : 'Выучено слов с переводами') + '</div>' +
            '<div class="stats-split-metrics__value">' + learnedWords + '</div>' +
          '</div>' +
          '<div class="stats-split-metrics__cell">' +
            '<div class="stats-split-metrics__label">' + (uk ? 'Час у тренері перекладів' : 'Время в тренере переводов') + '</div>' +
            '<div class="stats-split-metrics__value">' + formatMinutes(split.words) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    return (
      '<div class="stats-ring-set stats-ring-set--split">' +
        '<div class="stats-ring-set__title">' + texts.splitTitle + '</div>' +
        '<div class="stats-ring-set__circle">' +
          '<div class="stats-ring-set__circle-inner">' + layersHtml + '</div>' +
        '</div>' +
        '<div class="stats-ring-legend">' + legendHtml + '</div>' +
        extraHtml +
      '</div>'
    );
  }

  function posFromDeckKey(deckKey) {
    const parts = String(deckKey || '').split('_');
    return parts[1] || 'other';
  }

  function percent(part, total) {
    if (!total || total <= 0) return 0;
    return Math.round((part / total) * 100);
  }

  function degreesFromPercent(p) {
    return Math.round((p / 100) * 360);
  }

  /* основные/прочие части речи и их "цвета" */
  const CORE_POS = ['verbs', 'nouns', 'adjectives'];
  const OTHER_POS_ORDER = [
    'adverbs',
    'pronouns',
    'prepositions',
    'conjunctions',
    'particles',
    'numbers',
    'other'
  ];

  const POS_COLORS = {
    verbs: 'var(--stats-color-verbs, #0ea5e9)',
    nouns: 'var(--stats-color-nouns, #6366f1)',
    adjectives: 'var(--stats-color-adj, #f97316)',
    adverbs: 'var(--stats-color-adv, #22c55e)',
    pronouns: 'var(--stats-color-pron, #ec4899)',
    prepositions: 'var(--stats-color-prep, #eab308)',
    conjunctions: 'var(--stats-color-conj, #8b5cf6)',
    particles: 'var(--stats-color-part, #14b8a6)',
    numbers: 'var(--stats-color-num, #f59e0b)',
    other: 'var(--stats-color-other, #9ca3af)'
  };

  /* ------------ ключевой момент: откуда берём "выучено" --------- */

  function isWordLearned(word, deckKey) {
    const trainer = A.Trainer;
    try {
      if (
        A.state &&
        A.state.stars &&
        typeof A.starKey === 'function' &&
        trainer &&
        typeof trainer.starsMax === 'function'
      ) {
        const sMax = trainer.starsMax();
        const starsMap = A.state.stars || {};
        const sk = A.starKey(word.id, deckKey);
        const raw = starsMap[sk] || 0;
        const sc = Math.max(0, Math.min(sMax, raw));
        return sc >= sMax;
      }
    } catch (e) {}

    try {
      if (trainer && typeof trainer.isLearned === 'function') {
        return !!trainer.isLearned(word, deckKey);
      }
    } catch (e) {}

    return false;
  }

  /* ---------------------- подсчёт статистики ---------------------- */

  function computeStats() {
    const decksApi = A.Decks;
    const rawDecks = window.decks || {};
       const byLang = {};
    const langOrder = [];

    if (!decksApi) {
      return { byLang: [] };
    }

    let deckKeys = [];
    if (typeof decksApi.builtinKeys === 'function') {
      deckKeys = decksApi.builtinKeys() || [];
    } else {
      deckKeys = Object.keys(rawDecks).filter(function (k) {
        return Array.isArray(rawDecks[k]) && rawDecks[k].length;
      });
    }

    var group = currentDeckGroup();
    deckKeys = (deckKeys || []).filter(function (k) {
      return group === 'lernpunkt' ? isLernpunktKey(k) : !isLernpunktKey(k);
    });

    deckKeys.forEach(function (deckKey) {
      let lang;
      try {
        lang = decksApi.langOfKey(deckKey);
      } catch (_) {
        return;
      }
      if (!lang) return;

      const words = decksApi.resolveDeckByKey(deckKey) || [];
      if (!words.length) return;

      const pos = posFromDeckKey(deckKey);

      let langBucket = byLang[lang];
      if (!langBucket) {
        langBucket = byLang[lang] = {
          lang: lang,
          totalWords: 0,
          learnedWords: 0,
          byPos: {}, // pos -> { pos, total, learned, sampleDeckKey }
          decks: []  // [{ key, name, totalWords, learnedWords }]
        };
        langOrder.push(lang);
      }

      let deckLearned = 0;

      words.forEach(function (w) {
        langBucket.totalWords += 1;

        const posBucket =
          (langBucket.byPos[pos] =
            langBucket.byPos[pos] || {
              pos: pos,
              total: 0,
              learned: 0,
              sampleDeckKey: deckKey
            });

        posBucket.total += 1;

        if (isWordLearned(w, deckKey)) {
          langBucket.learnedWords += 1;
          posBucket.learned += 1;
          deckLearned += 1;
        }
      });

      let deckName = '';
      try {
        deckName = decksApi.resolveNameByKey(deckKey) || deckKey;
      } catch (_) {
        deckName = deckKey;
      }

      langBucket.decks.push({
        key: deckKey,
        name: deckName,
        totalWords: words.length,
        learnedWords: deckLearned
      });
    });

    const langList = langOrder.map(function (lang) {
      return byLang[lang];
    });

    return { byLang: langList };
  }

  /* ---------------------- labels из словарей ---------------------- */

  function resolvePosLabel(posBucket, texts) {
    const decksApi = A.Decks;
    let label = '';

    if (
      posBucket.sampleDeckKey &&
      decksApi &&
      typeof decksApi.resolveNameByKey === 'function'
    ) {
      try {
        label = decksApi.resolveNameByKey(posBucket.sampleDeckKey) || '';
      } catch (_) {
        label = '';
      }
    }
    if (!label) {
      label = texts.fallbackPosName(posBucket.pos || '');
    }
    return label;
  }

  /* ---------------------- nested rings ---------------------- */

  function splitPosBuckets(langStat) {
    const core = [];
    const other = [];

    Object.keys(langStat.byPos || {}).forEach(function (pos) {
      const bucket = langStat.byPos[pos];
      if (CORE_POS.indexOf(pos) !== -1) core.push(bucket);
      else other.push(bucket);
    });

    core.sort(function (a, b) {
      return CORE_POS.indexOf(a.pos) - CORE_POS.indexOf(b.pos);
    });

    other.sort(function (a, b) {
      return OTHER_POS_ORDER.indexOf(a.pos) - OTHER_POS_ORDER.indexOf(b.pos);
    });

    return { core: core, other: other };
  }

  function renderRingSet(buckets, texts, groupKind) {
    if (!buckets || !buckets.length) return '';

    const ringCount = buckets.length;

    const layersHtml = buckets
      .map(function (bucket, idx) {
        const p = percent(bucket.learned, bucket.total);
        const angle = degreesFromPercent(p);
        const scale = ringCount === 1 ? 1 : 1 - idx * 0.18; // 1, 0.82, 0.64...
        const color = POS_COLORS[bucket.pos] || POS_COLORS.other;

        return (
          '<div class="stats-ring-layer" ' +
          'style="--ring-angle:' +
          angle +
          'deg;--ring-scale:' +
          scale +
          ';--ring-color:' +
          color +
          ';">' +
          '<div class="stats-ring-layer__ring"></div>' +
          '</div>'
        );
      })
      .join('');

    const legendHtml = buckets
      .map(function (bucket) {
        const color = POS_COLORS[bucket.pos] || POS_COLORS.other;
        const label = resolvePosLabel(bucket, texts);
        const val = bucket.learned + ' / ' + bucket.total; // без процентов
        return (
          '<div class="stats-ring-legend__item" style="--ring-color:' +
          color +
          ';">' +
          '<span class="stats-ring-legend__dot"></span>' +
          '<span class="stats-ring-legend__label">' +
          label +
          '</span>' +
          '<span class="stats-ring-legend__value">' +
          val +
          '</span>' +
          '</div>'
        );
      })
      .join('');

    const caption = groupKind === 'core' ? texts.coreTitle : texts.otherTitle;

    return (
      '<div class="stats-ring-set stats-ring-set--' +
      groupKind +
      '">' +
      '<div class="stats-ring-set__title">' +
      caption +
      '</div>' +
      '<div class="stats-ring-set__circle">' +
      '<div class="stats-ring-set__circle-inner">' +
      layersHtml +
      '</div>' +
      '</div>' +
      '<div class="stats-ring-legend">' +
      legendHtml +
      '</div>' +
      '</div>'
    );
  }

  /* ---------------------- АКТИВНОСТЬ (круглые точки) ----------- */

  function getDailyActivitySeries(langCode) {
    try {
      if (A.Stats && typeof A.Stats.getDailyActivity === 'function') {
        var arr = A.Stats.getDailyActivity(langCode) || [];
        if (Array.isArray(arr)) return arr;
      }
    } catch (_) {}
    return [];
  }

          function renderActivitySection(langCode, texts) {
    var raw = getDailyActivitySeries(langCode);
    if (!raw.length) {
      return (
        '<section class="stats-section stats-section--activity">' +
          '<h2 class="stats-subtitle">' + texts.activityTitle + '</h2>' +
          '<p class="stats-placeholder stats-placeholder--activity">' +
            texts.activityNoData +
          '</p>' +
        '</section>'
      );
    }

    // 1) Собираем баллы по датам (ключ: YYYY-MM-DD)
    var byDate = Object.create(null);
    var maxScore = 0;

    raw.forEach(function (d) {
      var learned  = Number(d.learned  || 0);
      var reviewed = Number(d.reviewed || 0);
      var seconds  = Number(d.seconds  || 0);
      var score = learned * 4 + reviewed * 1 + seconds / 60;

      var key = (d.date || '').slice(0, 10); // предполагаем YYYY-MM-DD
      if (!key) return;

      byDate[key] = {
        data: d,
        score: score
      };

      if (score > maxScore) maxScore = score;
    });

    if (maxScore <= 0) {
      maxScore = 1;
    }

    // 2) Строим "календарь" на 5 недель: строки = недели, колонки = Пн–Вс
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    function toMondayIndex(day) {
      // getDay(): 0=Вс..6=Сб → 0=Пн..6=Вс
      return (day + 6) % 7;
    }

    var weekdayLabels = texts.weekdayShort || ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

    // понедельник текущей недели
    var mondayThisWeek = new Date(today.getTime());
    var todayMondayIdx = toMondayIndex(today.getDay());
    mondayThisWeek.setDate(mondayThisWeek.getDate() - todayMondayIdx);

    // стартовая точка — понедельник 4 недели назад (итого 5 недель)
    var startMonday = new Date(mondayThisWeek.getTime());
    startMonday.setDate(startMonday.getDate() - 7 * 4);

    function formatDateYMD(d) {
      var year = d.getFullYear();
      var month = d.getMonth() + 1;
      var day = d.getDate();
      return (
        year +
        '-' +
        (month < 10 ? '0' + month : month) +
        '-' +
        (day < 10 ? '0' + day : day)
      );
    }

    var cellsHtml = '';

    for (var week = 0; week < 5; week++) {
      for (var dow = 0; dow < 7; dow++) {
        var dayDate = new Date(startMonday.getTime());
        dayDate.setDate(startMonday.getDate() + week * 7 + dow);

        var key = formatDateYMD(dayDate);
        var entry = byDate[key];
        var lvl = 0;
        var title = '';

        if (entry) {
          var ratio = entry.score / maxScore;
          if (ratio >= 0.75) lvl = 3;
          else if (ratio >= 0.5) lvl = 2;
          else if (ratio >= 0.25) lvl = 1;
          else lvl = 0;

          var d = entry.data;
          title =
            key +
            ' — +' +
            (d.learned || 0) +
            ' / ' +
            (d.reviewed || 0) +
            ' / ' +
            Math.round((d.seconds || 0) / 60) +
            ' мин';
        } else {
          var isFuture = dayDate.getTime() > today.getTime();
          title = isFuture ? key : (key + ' — без активности');
          lvl = 0;
        }

        var isToday = dayDate.getTime() === today.getTime();
        var todayClass = isToday ? ' stats-activity-dot--today' : '';

        cellsHtml +=
          '<div class="stats-activity-cell">' +
            '<div class="stats-activity-dot stats-activity-dot--lvl' + lvl + todayClass + '"' +
              (title ? ' title="' + title.replace(/"/g, '&quot;') + '"' : '') +
            '></div>' +
          '</div>';
      }
    }

    // заголовок с днями недели
    var weekdaysHtml =
      '<div class="stats-activity-weekdays">' +
        weekdayLabels
          .map(function (label) {
            return '<span class="stats-activity-weekday">' + label + '</span>';
          })
          .join('') +
      '</div>';

    // 3) История по месяцам (по всем данным, не только 35 дней)
    var uk = getUiLang() === 'uk';
    var monthNamesRu = [
      'Январь','Февраль','Март','Апрель','Май','Июнь',
      'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
    ];
    var monthNamesUk = [
      'Січень','Лютий','Березень','Квітень','Травень','Червень',
      'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'
    ];
    var monthNames = uk ? monthNamesUk : monthNamesRu;

    // собираем по месяцам
    var monthBuckets = Object.create(null);

    Object.keys(byDate).forEach(function (key) {
      var entry = byDate[key];
      var dt = new Date(key);
      if (isNaN(dt.getTime())) return;

      var year = dt.getFullYear();
      var monthIdx = dt.getMonth(); // 0..11
      var mKey = year + '-' + monthIdx;

      var bucket = monthBuckets[mKey];
      if (!bucket) {
        bucket = monthBuckets[mKey] = {
          year: year,
          monthIdx: monthIdx,
          activeDays: 0,
          learnedSum: 0,
          secondsSum: 0
        };
      }

      if (entry.score > 0) {
        bucket.activeDays += 1;
      }
      bucket.learnedSum += Number(entry.data.learned || 0);
      bucket.secondsSum += Number(entry.data.seconds || 0);
    });

    var monthItems = Object.keys(monthBuckets)
      .map(function (mKey) {
        return monthBuckets[mKey];
      })
      .sort(function (a, b) {
        if (a.year !== b.year) return b.year - a.year;
        return b.monthIdx - a.monthIdx;
      });

    // ограничим, например, последними 12 месяцами
    monthItems = monthItems.slice(0, 12);

    var historyHtml = '';
    if (monthItems.length) {
      var titleText = uk ? 'Історія за місяцями' : 'История по месяцам';
      var labelActive = uk ? 'Активні дні' : 'Активные дни';
      var labelLearned = uk ? 'Вивчено слів' : 'Выучено слов';
      var labelTime = uk ? 'Час у тренуваннях' : 'Время в тренировках';
      var hLabel = uk ? 'год' : 'ч';
      var mLabel = uk ? 'хв' : 'мин';

      var itemsHtml = monthItems
        .map(function (b) {
          var monthLabel = monthNames[b.monthIdx] + ' ' + b.year;

          var totalMinutes = Math.round(b.secondsSum / 60);
          var hours = Math.floor(totalMinutes / 60);
          var mins = totalMinutes % 60;
          var timeStr = '';
          if (hours > 0) {
            timeStr += hours + ' ' + hLabel;
          }
          if (mins > 0) {
            if (timeStr) timeStr += ' ';
            timeStr += mins + ' ' + mLabel;
          }
          if (!timeStr) {
            timeStr = '0 ' + mLabel;
          }

          return (
            '<div class="stats-activity-history__item">' +
              '<div class="stats-activity-history__month">' +
                monthLabel +
              '</div>' +
              '<div class="stats-activity-history__line">' +
                labelActive + ': ' + b.activeDays +
              '</div>' +
              '<div class="stats-activity-history__line">' +
                labelLearned + ': ' + b.learnedSum +
              '</div>' +
              '<div class="stats-activity-history__line">' +
                labelTime + ': ' + timeStr +
              '</div>' +
            '</div>'
          );
        })
        .join('');

      historyHtml =
        '<div class="stats-activity-history">' +
          '<div class="stats-activity-history__title">' + titleText + '</div>' +
          '<div class="stats-activity-history__list">' +
            itemsHtml +
          '</div>' +
        '</div>';
    }

    var legendHtml =
      '<div class="stats-activity-legend">' +
        '<span class="stats-activity-legend__caption">' + texts.activityLegendCaption + '</span>' +
        '<div class="stats-activity-legend__scale">' +
          '<span class="stats-activity-legend__item">' +
            '<span class="stats-activity-dot stats-activity-dot--lvl1"></span>' +
            '<span>' + texts.activityLegendLow + '</span>' +
          '</span>' +
          '<span class="stats-activity-legend__item">' +
            '<span class="stats-activity-dot stats-activity-dot--lvl2"></span>' +
            '<span>' + texts.activityLegendMid + '</span>' +
          '</span>' +
          '<span class="stats-activity-legend__item">' +
            '<span class="stats-activity-dot stats-activity-dot--lvl3"></span>' +
            '<span>' + texts.activityLegendHigh + '</span>' +
          '</span>' +
        '</div>' +
      '</div>';

    return (
      '<section class="stats-section stats-section--activity">' +
        '<h2 class="stats-subtitle">' + texts.activityTitle + '</h2>' +
        weekdaysHtml +
        '<div class="stats-activity-grid">' + cellsHtml + '</div>' +
        legendHtml +
        historyHtml +
      '</section>'
    );
  }

  /* ---------------------- карточки по языкам ---------------------- */

  function renderLangCards(langStats, texts, activeLangCode) {
    if (!langStats.length) {
      return '<p class="stats-placeholder">—</p>';
    }

    var activeLang = activeLangCode || langStats[0].lang;

    const items = langStats
      .map(function (langStat) {
        const total = langStat.totalWords || 0;
        const learned = langStat.learnedWords || 0;
        const langCode = langStat.lang;
        const isActive = langCode === activeLang;

        let started = 0;
        let completed = 0;
        langStat.decks.forEach(function (d) {
          if (d.learnedWords > 0) started += 1;
          if (d.totalWords > 0 && d.learnedWords >= d.totalWords) completed += 1;
        });

        const split = splitPosBuckets(langStat);
        const coreSetHtml = renderRingSet(split.core, texts, 'core');
        const otherSetHtml = renderRingSet(split.other, texts, 'other');
        const isGerman = langCode === 'de';
        const splitTimeHtml = isGerman ? renderTimeSplitSet(langCode, texts) : '';
        const activityHtml = renderActivitySection(langCode, texts);

        // Страница "Время: слова vs артикли" показывается только для немецкого языка (de).
        // Пейджер и PRO-гейт должны работать независимо от количества страниц.
        const activityPage = isGerman ? 3 : 2;

        const pagesHtml =
          '<div class="stats-pages">' +
            '<div class="stats-page stats-page--core is-active" data-page="0">' +
              '<div class="stats-ring-sets stats-ring-sets--single">' +
                coreSetHtml +
              '</div>' +
            '</div>' +
            '<div class="stats-page stats-page--other" data-page="1">' +
              '<div class="stats-ring-sets stats-ring-sets--single">' +
                otherSetHtml +
              '</div>' +
            '</div>' +
            (isGerman
              ? ('<div class="stats-page stats-page--split" data-page="2">' +
                   '<div class="stats-ring-sets stats-ring-sets--single">' +
                     splitTimeHtml +
                   '</div>' +
                 '</div>')
              : '') +
            '<div class="stats-page stats-page--analytics" data-page="' + activityPage + '">' +
              activityHtml +
            '</div>' +
          '</div>';

        const dotsHtml =
          '<div class="stats-pages-dots">' +
            '<button class="stats-page-dot is-active" type="button" data-page="0"></button>' +
            '<button class="stats-page-dot" type="button" data-page="1"></button>' +
            (isGerman ? '<button class="stats-page-dot" type="button" data-page="2"></button>' : '') +
            '<button class="stats-page-dot" type="button" data-page="' + activityPage + '"></button>' +
          '</div>';

        return (
          '<article class="stats-lang-card' +
          (isActive ? ' is-active' : '') +
          '" data-lang="' +
          langCode +
          '">' +
          '<header class="stats-lang-card__header">' +
          '<div class="stats-lang-card__title">' +
          '<span class="stats-lang-card__meta">' +
          texts.learnedLangShort(learned, total) +
          '</span>' +
          '</div>' +
          '<div class="stats-lang-card__decks">' +
          texts.decksSummary(started, completed, langStat.decks.length) +
          '</div>' +
          '</header>' +
          '<div class="stats-lang-card__body">' +
          pagesHtml +
          dotsHtml +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    return '<div class="stats-lang-list">' + items + '</div>';
  }

  /* ---------------------- плейсхолдер ---------------------- */

  function renderPlaceholderSection(texts) {
    return (
      '<section class="stats-section stats-section--placeholder">' +
      '<h2 class="stats-subtitle">' +
      texts.placeholderTitle +
      '</h2>' +
      '<p class="stats-placeholder">' +
      texts.placeholderText +
      '</p>' +
      '</section>'
    );
  }

  /* ---------------------- флаги (как в Словарях) ------------ */

  function setupLangFlags(root, langStats, activeLangInitial) {
    const box = root.querySelector('#stats-flags');
    if (!box || !langStats.length) return;

    const langs = langStats.map(function (ls) {
      return ls.lang;
    });
    let activeLang =
      activeLangInitial && langs.indexOf(activeLangInitial) !== -1
        ? activeLangInitial
        : langs[0];

    const FLAG = {
      en: '🇬🇧',
      de: '🇩🇪',
      fr: '🇫🇷',
      es: '🇪🇸',
      it: '🇮🇹',
      ru: '🇷🇺',
      uk: '🇺🇦',
      sr: '🇷🇸',
      pl: '🇵🇱'
    };

    function applyActive(lang) {
      activeLang = lang;

      box.querySelectorAll('.dict-flag').forEach(function (b) {
        b.classList.toggle('active', b.dataset.lang === lang);
      });

      root.querySelectorAll('.stats-lang-card').forEach(function (card) {
        const cl = card.getAttribute('data-lang');
        card.classList.toggle('is-active', cl === lang);
      });

      try {
        A.settings = A.settings || {};
        A.settings.statsLang = lang;
      } catch (_) {}
    }

    box.innerHTML = '';
    langs.forEach(function (lang) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dict-flag' + (lang === activeLang ? ' active' : '');
      btn.dataset.lang = lang;
      btn.title = lang.toUpperCase();
      btn.textContent = FLAG[lang] || lang.toUpperCase();
      btn.addEventListener('click', function () {
        if (lang === activeLang) return;
        applyActive(lang);
      });
      box.appendChild(btn);
    });

    applyActive(activeLang);
  }

  /* ---------------------- выбор активного языка ------------ */

  function detectActiveTrainLang(statsByLang) {
    if (!statsByLang || !statsByLang.length) return null;

    try {
      if (
        A.settings &&
        A.settings.statsLang &&
        statsByLang.some(function (b) {
          return b.lang === A.settings.statsLang;
        })
      ) {
        return A.settings.statsLang;
      }
    } catch (_) {}

    try {
      if (
        A.Trainer &&
        typeof A.Trainer.getDeckKey === 'function' &&
        A.Decks &&
        typeof A.Decks.langOfKey === 'function'
      ) {
        const dk = A.Trainer.getDeckKey();
        if (dk) {
          const lang = A.Decks.langOfKey(dk);
          if (
            lang &&
            statsByLang.some(function (b) {
              return b.lang === lang;
            })
          ) {
            return lang;
          }
        }
      }
    } catch (_) {}

    const withProgress = statsByLang.filter(function (b) {
      return (b.learnedWords || 0) > 0;
    });
    if (withProgress.length) return withProgress[0].lang;

    return statsByLang[0].lang;
  }

  /* ---------------------- Пейджер по трём экранам ---------------------- */

  function setupStatsPager(root) {
    if (!root) return;

    var cards = root.querySelectorAll('.stats-lang-card');
    if (!cards.length) return;

    cards.forEach(function (card) {
      var body = card.querySelector('.stats-lang-card__body');
      if (!body) return;

      var pages = body.querySelectorAll('.stats-page');
      var dots  = body.querySelectorAll('.stats-page-dot');
      if (!pages.length || !dots.length) return;

      var current = 0;

      function goTo(pageNum) {
        // Доступные страницы определяются по dot'ам (data-page).
        var pagesList = Array.prototype.slice.call(pages || []);
        var dotsList  = Array.prototype.slice.call(dots  || []);
        var nums = dotsList.map(function (d) {
          return parseInt(d.getAttribute('data-page') || '0', 10) || 0;
        }).sort(function (a,b){return a-b;});
        var minPage = nums.length ? nums[0] : 0;
        var maxPage = nums.length ? nums[nums.length-1] : (pagesList.length ? pagesList.length-1 : 0);

        if (pageNum < minPage) pageNum = minPage;
        if (pageNum > maxPage) pageNum = maxPage;
        current = pageNum;

        // PRO-gate: аналитика доступна только в PRO (независимо от индекса)
        var targetPage = null;
        pagesList.forEach(function (pageEl) {
          var pIdx = parseInt(pageEl.getAttribute('data-page') || '0', 10) || 0;
          if (pIdx === current) targetPage = pageEl;
        });

        if (targetPage && targetPage.classList.contains('stats-page--analytics') && (!A.isPro || !A.isPro())) {
          try {
            var lang = getUiLang();
            var bodyText = (lang === 'uk')
              ? 'Статистика доступна у версії MOYAMOVA PRO. Натисніть кнопку 💎 у меню, щоб розблокувати.'
              : 'Статистика доступна в версии MOYAMOVA PRO. Нажмите кнопку 💎 в меню, чтобы разблокировать.';

            var stubHtml =
              '<div class="stats-pro-gate" style="padding:16px 12px 18px;text-align:center;font-size:14px;opacity:.9;">' +
                '<p style="margin-bottom:10px;">' + bodyText + '</p>' +
              '</div>';

            targetPage.innerHTML = stubHtml;
          } catch (_) {}
        }

        // Активные классы
        pagesList.forEach(function (pageEl) {
          var pIdx = parseInt(pageEl.getAttribute('data-page') || '0', 10) || 0;
          pageEl.classList.toggle('is-active', pIdx === current);
        });
        dotsList.forEach(function (dotEl) {
          var dIdx = parseInt(dotEl.getAttribute('data-page') || '0', 10) || 0;
          dotEl.classList.toggle('is-active', dIdx === current);
        });
      }

      dots.forEach(function (dot) {
        dot.addEventListener('click', function (evt) {
          evt.preventDefault();
          var p = Number(dot.getAttribute('data-page') || 0) || 0;
          goTo(p);
        });
      });
    });
  }

  function mount() {
    const app = document.getElementById('app');
    if (!app) return;

    const texts = t();
    const stats = computeStats();
    const activeLang = detectActiveTrainLang(stats.byLang);

    const cardsHtml = renderLangCards(stats.byLang, texts, activeLang);

    const html =
      '<div class="home">' +
      '<section class="card dicts-card stats-card">' +
      '<div class="dicts-header">' +
      '<h3>' +
      texts.title +
      '</h3>' +
      '<div id="stats-flags" class="dicts-flags"></div>' +
      '</div>' +
      cardsHtml +
      '</section>' +
      // renderPlaceholderSection(texts) +
      '</div>';

    app.innerHTML = html;
    setupLangFlags(app, stats.byLang, activeLang);
    setupStatsPager(app);
  }

  A.ViewStats = {
    mount: function(){ try{ if (A.stopAllTrainers) A.stopAllTrainers('view:stats'); }catch(_){} return mount(); }
  };
})();
/* ========================= Конец файла: view.stats.js ========================= */