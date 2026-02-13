/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: articles.card.shell.js
 * Назначение: UI карточка упражнения "Учить артикли" (каркас).
 *
 * Требования:
 *   - элементы "хрома" (звёзды, сердце, режим, озвучка) остаются
 *     на тех же местах, что и в базовой карточке
 *   - слово отображается тем же стилем/размером, но БЕЗ артикуля
 *   - перевод (второй строкой) пока показываем, позже можно отключить
 *   - 3 кнопки: der / die / das
 *   - озвучка: работает 1:1 как в обычном тренере (ui.audio.tts.js)
 *   - сердце: видно, но disabled
 *
 * Статус: каркас (MVP)
 * Версия: 0.1
 * Обновлено: 2026-01-01
 * ========================================================== */

(function () {
  'use strict';

  var A = (window.App = window.App || {});

  // IMPORTANT: перевод отключён полностью по ТЗ (вторая строка убирается).

  var mounted = false;
  var rootEl = null;
  var snapshotHTML = '';
  var unsubs = [];

  // Поведение ответов должно совпадать с базовым тренером (home.js):
  // - неправильный ответ: подсветка + disable только нажатой кнопки
  // - штраф/статистика применяются 1 раз на слово (логика в ArticlesTrainer)
  // - правильный ответ: блокируем все кнопки + is-correct + is-dim
  // - переход к следующему слову с тем же таймингом
  var uiState = { wordId: '', solved: false, layout: null };
  var ADV_DELAY = 750;

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function ensureBusOn() {
    if (!window.UIBus || typeof window.UIBus.on !== 'function') return null;
    return window.UIBus;
  }

  function setHeartEnabled(btn) {
    if (!btn) return;
    // Articles favorites use their own isolated storage; the heart button is active
    // (with guards when training from Favorites).
    btn.disabled = false;
    btn.removeAttribute('aria-disabled');
    btn.classList.remove('is-disabled');
  }

  function baseOfDeckKey(key){
    try{
      var s = String(key||'');
      if (/^favorites:/i.test(s)) return s.split(':').slice(2).join(':') || '';
      if (/^mistakes:/i.test(s)) return s.split(':').slice(2).join(':') || '';
      return s;
    }catch(_){ return String(key||''); }
  }

  function toast(msg){
    try { (A.toast && A.toast.show) ? A.toast.show(msg) : alert(msg); } catch(_){ }
  }

  function paintStars(deckKey, wordId) {
    try {
      if (!rootEl) return;
      var starsBox = qs('.trainer-stars', rootEl);
      if (!starsBox || !A.ArticlesProgress || !wordId) return;
      var max = (A.ArticlesProgress.starsMax && A.ArticlesProgress.starsMax()) || 5;
      var have = Number((A.ArticlesProgress.getStars && A.ArticlesProgress.getStars(deckKey, wordId)) || 0) || 0;

      // 1:1 с базовым тренером: поддержка "половинок" в hard-mode.
      // Используем те же классы full/half.
      var kids = starsBox.querySelectorAll('.star');
      if (!kids || kids.length !== max) {
        var html = '';
        for (var i = 0; i < max; i++) html += '<span class="star" aria-hidden="true">★</span>';
        starsBox.innerHTML = html;
      }
      var stars = starsBox.querySelectorAll('.star');
      stars.forEach(function (el) { el.classList.remove('full', 'half'); });

      var EPS = 1e-6;
      var filled = Math.floor(have + EPS);
      for (var fi = 0; fi < Math.min(filled, max); fi++) {
        stars[fi].classList.add('full');
      }
      var frac = have - filled;
      if (frac + EPS >= 0.5 && filled < max) {
        stars[filled].classList.add('half');
      }
    } catch (e) {}
  }

  // Строка статистики должна быть 1:1 как в обычном тренере:
  // используем тот же нижний элемент #dictStats (место/стиль уже заданы в home).
  // Здесь меняем только входные данные: X/Y считаются по прогрессу артиклей.
  function updateBottomDictStats(vm) {
    try {
      if (!vm) return;
      var statsEl = document.getElementById('dictStats');
      if (!statsEl) return;

      var dk = vm.deckKey;
      var st;
      try {
        st = (A.ArticlesTrainer && typeof A.ArticlesTrainer.getDeckStats === 'function')
          ? A.ArticlesTrainer.getDeckStats(dk)
          : { withArticles: vm.statsWithArticles, learned: vm.statsLearned };
      } catch (_) {
        st = { withArticles: vm.statsWithArticles, learned: vm.statsLearned };
      }
      var x = (st && st.withArticles != null) ? st.withArticles : (vm.statsWithArticles || 0);
      var y = (st && st.learned != null) ? st.learned : (vm.statsLearned || 0);

      var uiLang = '';
      try { uiLang = (A.settings && (A.settings.lang || A.settings.uiLang)) || ''; } catch (_) {}
      var uk = String(uiLang).toLowerCase() === 'uk';

      // Формулировки и формат — те же, что у обычного тренера.
      statsEl.textContent = uk
        ? ('Всього слів: ' + x + ' / Вивчено: ' + y)
        : ('Всего слов: ' + x + ' / Выучено: ' + y);
      statsEl.style.display = '';
    } catch (_e) {}
  }

  function render(vm) {
    if (!mounted || !rootEl || !vm) return;

    // запоминаем последнее состояние, чтобы корректно переотрисовать строку статистики
    // при переключении языка интерфейса.
    uiState.lastVm = vm;

    // На каркасе мы используем ту же разметку .home-trainer из home.js.
    var starsBox = qs('.trainer-stars', rootEl);
    var heartBtn = qs('#favBtn', rootEl);
    var wordEl = qs('.trainer-word', rootEl);
    var subtitleEl = qs('.trainer-subtitle', rootEl);
    var translationEl = qs('.trainer-translation', rootEl);
    // Строка статистики внизу карточки (как в обычном тренере) — не часть rootEl.
    var answersEl = qs('.answers-grid', rootEl);

    // Heart / favorites (isolated for articles)
    try {
      if (heartBtn && A.ArticlesFavorites && vm.wordId){
        var uiLang2 = '';
        try { uiLang2 = (A.settings && (A.settings.lang || A.settings.uiLang)) || ''; } catch (_e) {}
        var uk2 = String(uiLang2).toLowerCase() === 'uk';

        var dk0 = String(vm.deckKey || '');
        var isFavDeck = /^favorites:/i.test(dk0);
        var isMistDeck = /^mistakes:/i.test(dk0);

        var baseKey = baseOfDeckKey(dk0);
        var favNow = (!isFavDeck && !isMistDeck) && !!A.ArticlesFavorites.has(baseKey, vm.wordId);

        var title = uk2 ? 'У вибране' : 'В избранное';
        try { heartBtn.title = title; heartBtn.ariaLabel = title; } catch(__e){}

        if (isFavDeck || isMistDeck){
          // Внутри тренировки избранного или ошибок: сердце не должно менять состояние.
          // Но по UX должно быть объяснение (тост) 1:1 как в обычном тренере.
          var isFavTrain = isFavDeck;
          var msgRu = isFavTrain
            ? 'Во время тренировки избранного добавление запрещено'
            : 'Во время тренировки ошибок добавление запрещено';
          var msgUk = isFavTrain
            ? 'Під час тренування обраного додавання заборонено'
            : 'Під час тренування помилок додавання заборонено';
          var disabledMsg = uk2 ? msgUk : msgRu;

          try { heartBtn.title = disabledMsg; heartBtn.ariaLabel = disabledMsg; } catch(__e){}
          heartBtn.textContent = '♡';
          heartBtn.classList.remove('is-fav');
          heartBtn.setAttribute('aria-pressed', 'false');
          // Не используем disabled=true, чтобы клик проходил и показывался тост.
          heartBtn.disabled = false;
          heartBtn.setAttribute('aria-disabled', 'true');
          heartBtn.classList.add('is-disabled');
          heartBtn.onclick = function(){
            try {
              toast(disabledMsg);
              heartBtn.classList.add('shake');
              setTimeout(function(){ heartBtn.classList.remove('shake'); }, 300);
            } catch(_e){}
          };
        } else {
          // Обычная тренировка артиклей: сердце активно (изолированное избранное)
          setHeartEnabled(heartBtn);
          heartBtn.textContent = favNow ? '♥' : '♡';
          heartBtn.classList.toggle('is-fav', favNow);
          heartBtn.setAttribute('aria-pressed', String(favNow));

          heartBtn.onclick = function(){
            try {
              A.ArticlesFavorites.toggle(baseKey, vm.wordId);
              var nowFav = !!A.ArticlesFavorites.has(baseKey, vm.wordId);
              heartBtn.textContent = nowFav ? '♥' : '♡';
              heartBtn.classList.toggle('is-fav', nowFav);
              heartBtn.setAttribute('aria-pressed', String(nowFav));
            } catch(__e){}
          };
        }
      }    } catch(_){ }

    // заголовок вопроса
    if (subtitleEl) {
      var uiLang = '';
      try { uiLang = (A.settings && (A.settings.lang || A.settings.uiLang)) || ''; } catch (e) {}
      subtitleEl.textContent = (String(uiLang).toLowerCase() === 'uk') ? (vm.promptUk || 'Оберіть артикль') : (vm.promptRu || 'Выберите артикль');
    }

    // слово
    if (wordEl) {
      // важно: слово без артикуля
      wordEl.textContent = String(vm.wordDisplay || '').trim();
      // Кнопка TTS (ui.audio.tts.js) живёт внутри .trainer-word и будет
      // переинициализирована MutationObserver-ом после смены текста.
    }

    // Перевод: показываем между словом и подсказкой "Выберите артикль"
    // Важно: на "втором плане" (чуть меньше и приглушённый) — через CSS.
    var trText = String(vm.translation || '').trim();
    if (!translationEl) {
      translationEl = document.createElement('p');
      translationEl.className = 'trainer-translation';
      // вставляем сразу после слова
      if (wordEl && wordEl.parentNode) {
        if (wordEl.nextSibling) wordEl.parentNode.insertBefore(translationEl, wordEl.nextSibling);
        else wordEl.parentNode.appendChild(translationEl);
      }
    }
    if (translationEl) {
      translationEl.textContent = trText;
      translationEl.style.display = trText ? '' : 'none';
    }

    // Статистика: обновляем нижнюю строку #dictStats тем же стилем, что у word-trainer.
    updateBottomDictStats(vm);

    // звёзды: пока просто оставляем от базового рендера, позже подключим ArticlesProgress.
    // (В каркасе не трогаем, чтобы не ломать базовый компонент.)
    if (starsBox && A.ArticlesProgress && vm.wordId) {
      paintStars(vm.deckKey, vm.wordId);
    }

    // ответы
    if (answersEl) {
      // сброс UI-состояния при смене слова
      if (String(uiState.wordId) !== String(vm.wordId || '')) {
        uiState.wordId = String(vm.wordId || '');
        uiState.solved = false;
        uiState.layout = null;
      }

      answersEl.innerHTML = '';
      var base = vm.options || ['der','die','das'];

      // 3 кнопки всегда в одну линию. Позиции артиклей должны быть рандомными.
      if (!uiState.layout) {
        var articles = base.slice(0, 3);
        for (var si = articles.length - 1; si > 0; si--) {
          var sj = Math.floor(Math.random() * (si + 1));
          var tmp = articles[si]; articles[si] = articles[sj]; articles[sj] = tmp;
        }
        uiState.layout = articles;
      }

      for (var j = 0; j < 3; j++) {
        var article = String(uiState.layout[j] || '');
        var b = document.createElement('button');
        b.className = 'answer-btn';
        b.textContent = article;
        b.setAttribute('data-article', article);

        // КЛИКИ обрабатываются единым делегированным слушателем (см. mount)
        answersEl.appendChild(b);
      }
    }
  }

  function mount(root) {
    // В SPA разметка .home-trainer может пересоздаваться при навигации.
    // Если мы уже смонтированы в старый DOM-узел — нужно перемонтироваться.
    var nextRoot = root || qs('.home-trainer');
    if (mounted) {
      try {
        if (!rootEl || (rootEl && rootEl.isConnected === false) || (nextRoot && rootEl !== nextRoot)) {
          unmount();
        } else {
          return;
        }
      } catch (_e) {
        // на всякий случай — не блокируем монтирование
      }
    }
    rootEl = nextRoot;
    if (!rootEl) return;

    snapshotHTML = rootEl.innerHTML;
    mounted = true;
    rootEl.classList.add('is-articles');
    // Делегированный обработчик ответов (один раз на mount)
    var onRootClick = function (e) {
      try {
        // "Не знаю" — поведение 1:1 с базовым тренером: блокируем ввод,
        // подсвечиваем правильный, затем переходим дальше по тому же таймеру.
        var idk = e && e.target && e.target.closest ? e.target.closest('.idk-btn') : null;
        if (idk) {
          if (uiState.solved) return;
          uiState.solved = true;
          var vm0 = (A.ArticlesTrainer && A.ArticlesTrainer.getViewModel) ? A.ArticlesTrainer.getViewModel() : null;
          var correct0 = vm0 ? String(vm0.correct || '').trim() : '';

          // "Не знаю" должно учитываться как неправильный ответ (прогресс/статистика).
          try {
            if (A.ArticlesTrainer && typeof A.ArticlesTrainer.answerIdk === 'function') {
              A.ArticlesTrainer.answerIdk();
            } else if (A.ArticlesTrainer && typeof A.ArticlesTrainer.answer === 'function') {
              A.ArticlesTrainer.answer('__idk__');
            }
          } catch (_e) {}

          var all0 = rootEl.querySelectorAll('.answers-grid .answer-btn');
          all0.forEach(function (b) {
            b.disabled = true;
            var a = String(b.getAttribute('data-article') || b.textContent || '').trim();
            if (correct0 && a === correct0) b.classList.add('is-correct');
            else b.classList.add('is-dim');
          });

          // Обновляем звёзды и строку статистики, не дожидаясь следующего слова.
          try {
            if (vm0) {
              paintStars(vm0.deckKey, vm0.wordId);
              updateBottomDictStats(vm0);
            }
          } catch (_e2) {}

          setTimeout(function () {
            try { if (A.ArticlesTrainer && A.ArticlesTrainer.next) A.ArticlesTrainer.next(); } catch (e) {}
          }, ADV_DELAY);
          return;
        }

        var btn = e && e.target && e.target.closest ? e.target.closest('.answers-grid .answer-btn') : null;
        if (!btn) return;
        if (btn.disabled) return;
        if (uiState.solved) return;

        var picked = btn.getAttribute('data-article') || btn.textContent || '';
        if (!String(picked || '').trim()) return;
        var vm = (A.ArticlesTrainer && A.ArticlesTrainer.getViewModel) ? A.ArticlesTrainer.getViewModel() : null;
        var res = (A.ArticlesTrainer && A.ArticlesTrainer.answer) ? A.ArticlesTrainer.answer(picked) : { ok:false, correct:'', applied:false };

        if (res.ok) {
          uiState.solved = true;
          btn.classList.add('is-correct');
          var all = rootEl.querySelectorAll('.answers-grid .answer-btn');
          all.forEach(function (b) {
            b.disabled = true;
            if (b !== btn) b.classList.add('is-dim');
          });
          if (vm) {
            paintStars(vm.deckKey, vm.wordId);
            updateBottomDictStats(vm);
            try { if (A.AudioTTS && A.AudioTTS.onCorrect) A.AudioTTS.onCorrect(); } catch (_eTTS) {}
          }
          setTimeout(function () {
            try { if (A.ArticlesTrainer && A.ArticlesTrainer.next) A.ArticlesTrainer.next(); } catch (e) {}
          }, ADV_DELAY);
          return;
        }

        // wrong
        btn.classList.add('is-wrong');
        btn.disabled = true;
        if (res.applied && vm) {
          paintStars(vm.deckKey, vm.wordId);
          updateBottomDictStats(vm);
        }
      } catch (e) {}
    };
    rootEl.addEventListener('click', onRootClick, { passive: true });
    unsubs.push(function () {
      try { if (rootEl) rootEl.removeEventListener('click', onRootClick); } catch (e) {}
    });

    // подписка на обновления от тренера
    var bus = ensureBusOn();
    if (bus) {
      var off = bus.on('articles:update', function (vm) {
        render(vm);
      });
      if (typeof off === 'function') unsubs.push(off);
    }

    // реакция на переключение языка интерфейса (тогл): обновляем нижнюю строку статистики
    // теми же формулировками, что и у базового тренера.
    var onLang = function () {
      try { if (uiState && uiState.lastVm) updateBottomDictStats(uiState.lastVm); } catch (_e) {}
    };
    try {
      document.addEventListener('lexitron:ui-lang-changed', onLang);
      window.addEventListener('lexitron:ui-lang-changed', onLang);
      unsubs.push(function(){
        try { document.removeEventListener('lexitron:ui-lang-changed', onLang); } catch(_){ }
        try { window.removeEventListener('lexitron:ui-lang-changed', onLang); } catch(_){ }
      });
    } catch (_e3) {}

    // первичная отрисовка, если тренер уже активен
    try {
      if (A.ArticlesTrainer && A.ArticlesTrainer.getViewModel) {
        render(A.ArticlesTrainer.getViewModel());
      }
    } catch (e) {}
  }

  function unmount() {
    if (!mounted || !rootEl) return;
    mounted = false;
    try {
      while (unsubs.length) {
        var fn = unsubs.pop();
        try { fn(); } catch (e) {}
      }
    } catch (e) {}

    rootEl.classList.remove('is-articles');
    if (snapshotHTML) rootEl.innerHTML = snapshotHTML;
    snapshotHTML = '';
    rootEl = null;
  }

  A.ArticlesCard = {
    mount: mount,
    unmount: unmount,
    render: render
  };
})();
