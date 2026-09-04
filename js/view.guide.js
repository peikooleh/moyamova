/* ==========================================================
 * MOYAMOVA 1.10.11 — Guide / Instruction V3
 * Desktop: unified MOYAMOVA shell. Mobile: clean standalone guide.
 * ========================================================== */
(function(root){
  'use strict';

  function A(){ return root.App || (root.App={}); }
  function app(){ return document.getElementById('app'); }
  function uk(){
    try{
      const a=A();
      const raw=String((a.settings&&(a.settings.uiLang||a.settings.lang))||document.documentElement.lang||'ru').toLowerCase();
      return raw==='uk'||raw==='ua'||raw.startsWith('uk-');
    }catch(_){ return false; }
  }
  function langOf(key){
    try{
      const a=A();
      return (a.Decks&&a.Decks.langOfKey&&a.Decks.langOfKey(key)) || String(key||'').split('_')[0] || 'de';
    }catch(_){ return 'de'; }
  }
  function currentLearnLang(){
    try{
      const a=A();
      const k=(a.Trainer&&a.Trainer.getDeckKey&&a.Trainer.getDeckKey())||(a.settings&&a.settings.lastDeckKey)||'de';
      return langOf(k);
    }catch(_){ return 'de'; }
  }
  function languageName(lg){
    return ({de:'Deutsch',en:'English',sr:'Srpski',es:'Español',fr:'Français'})[lg]||String(lg||'').toUpperCase();
  }
  function navCounts(lg){
    const a=A(); let mistakes=0,favs=0;
    try{
      const xs=(a.Mistakes&&a.Mistakes.listSummary?a.Mistakes.listSummary():[])||[];
      mistakes=xs.filter(x=>langOf(x.baseKey)===lg).reduce((n,x)=>n+Number(x.count||0),0);
    }catch(_){}
    try{
      const xs=(a.Favorites&&a.Favorites.list?a.Favorites.list():[])||[];
      favs=xs.filter(x=>langOf(x.dictKey)===lg).length;
    }catch(_){}
    return {mistakes,favs};
  }
  function route(action){
    try{
      const a=A();
      if(a.Router&&typeof a.Router.routeTo==='function'){
        a.Router.routeTo(action);
        return;
      }
    }catch(_){}
    try{
      const btn=document.querySelector('.app-footer .nav-btn[data-action="'+action+'"]');
      if(btn) btn.click();
    }catch(_){}
  }

  function T(){
    if(uk()) return {
      title:'Інструкція',
      sub:'Усе необхідне для роботи з MOYAMOVA',
      start:'Почніть звідси',
      startText:'Не потрібно одразу вивчати всі можливості. Оберіть словник і почніть тренування — MOYAMOVA зберігатиме прогрес і допомагатиме повертатися до слів, які потребують повторення.',
      flow:['Оберіть словник','Тренуйтеся','Отримуйте зірки','Закріплюйте складне'],
      cards:[
        ['◎','Як проходить навчання',
          'Навчайтеся невеликими сетами у зручному темпі. За правильні відповіді слова отримують зірки та поступово переходять до вивчених.',
          '<ul><li>правильні відповіді просувають слово вперед</li><li>помилки допомагають виявити складні слова</li><li>прогрес зберігається автоматично</li><li>можна продовжити з того місця, де ви зупинилися</li></ul><aside>Не женіться за кількістю — регулярні короткі тренування ефективніші за рідкісні довгі заняття.</aside>'],
        ['▤','Режими тренування',
          'Використовуйте різні тренажери, щоб запам’ятовувати не лише переклад, а й правильне вживання слів.',
          '<dl><dt>Слова</dt><dd>оберіть правильний переклад із чотирьох варіантів.</dd><dt>Артиклі</dt><dd>закріплюйте рід німецьких іменників: <b>der, die, das</b>.</dd><dt>Прийменники</dt><dd>добирайте правильний прийменник безпосередньо в контексті речення.</dd></dl><aside>Кожен режим тренує окрему навичку, а разом вони допомагають краще закріпити мову.</aside>'],
        ['⚙','Панель тренування',
          'Налаштовуйте тренування під себе безпосередньо під час заняття.',
          '<dl><dt>Auto</dt><dd>автоматично переходить до наступного завдання</dd><dt>Reverse</dt><dd>змінює напрямок запитання та перекладу, якщо режим це підтримує</dd><dt>Focus</dt><dd>прибирає зайві елементи та допомагає зосередитися</dd><dt>Озвучення</dt><dd>вмикає вимову слів і прикладів</dd></dl><aside><b>Порада:</b> спробуйте Reverse, коли слова вже трохи знайомі. Самостійно згадати слово складніше — і корисніше.</aside>'],
        ['♡','Помилки та Вибране',
          'MOYAMOVA допомагає окремо працювати з тим, що важливо саме вам.',
          '<p><b>Помилки</b> поповнюються автоматично, коли ви відповідаєте неправильно. Повертайтеся до цього розділу, щоб закріпити складні слова.</p><p><b>Вибране</b> формуєте ви самі — натисніть ♡ на картці будь-якого слова.</p><ul><li>Помилки — те, що варто повторити</li><li>Вибране — те, що ви хочете зберегти</li><li>лічильники в меню показують кількість таких слів</li></ul>'],
        ['▥','Прогрес і статистика',
          'Ваш результат накопичується поступово — застосунок допомагає його побачити.',
          '<p>У Статистиці можна переглянути:</p><ul><li>загальний прогрес навчання</li><li>кількість вивчених слів</li><li>прогрес за частинами мови</li><li>активність занять</li><li>результати спеціальних тренажерів</li></ul><p>А на Головній завжди можна швидко продовжити останній словник.</p><aside>Навіть невеликий прогрес щодня з часом перетворюється на великий словниковий запас.</aside>'],
        ['↓','Дані та робота офлайн',
          'Ваше навчання не прив’язане до акаунта чи хмари. Основні функції MOYAMOVA працюють локально, а прогрес зберігається на вашому пристрої.',
          '<ul><li>основні тренування доступні офлайн</li><li>прогрес зберігається локально</li><li>дані можна експортувати та відновити</li><li>резервна копія допомагає перенести навчання на інший пристрій</li></ul><aside><b>Важливо:</b> перед очищенням браузера, перевстановленням застосунку або зміною пристрою створіть резервну копію в меню.</aside>']
      ],
      note:'<b>Ваш прогрес належить вам.</b> Час від часу створюйте резервну копію — це займе менше хвилини та захистить результати навчання.',
      back:'Назад на головну',
      nav:{home:'Головна',trainer:'Тренажер',dicts:'Словники',mistakes:'Помилки',fav:'Обране',stats:'Статистика',settings:'Налаштування'}
    };
    return {
      title:'Инструкция',
      sub:'Всё необходимое для работы с MOYAMOVA',
      start:'Начните отсюда',
      startText:'Не нужно изучать все функции сразу. Выберите словарь и начните тренировку — MOYAMOVA будет сохранять прогресс и помогать возвращаться к словам, которые требуют повторения.',
      flow:['Выберите словарь','Тренируйтесь','Получайте звёзды','Закрепляйте сложное'],
      cards:[
        ['◎','Как проходит обучение',
          'Учитесь небольшими сетами в удобном темпе. За правильные ответы слова получают звёзды и постепенно переходят в изученные.',
          '<ul><li>правильные ответы продвигают слово вперёд</li><li>ошибки помогают выявить сложные слова</li><li>прогресс сохраняется автоматически</li><li>можно продолжить с того места, где остановились</li></ul><aside>Не гонитесь за количеством — регулярные короткие тренировки работают лучше редких длинных занятий.</aside>'],
        ['▤','Режимы тренировки',
          'Используйте разные тренажёры, чтобы запоминать не только перевод, но и правильное употребление слов.',
          '<dl><dt>Слова</dt><dd>выберите правильный перевод из четырёх вариантов.</dd><dt>Артикли</dt><dd>закрепляйте род немецких существительных: <b>der, die, das</b>.</dd><dt>Предлоги</dt><dd>подбирайте правильный предлог прямо в контексте предложения.</dd></dl><aside>Каждый режим тренирует отдельный навык, а вместе они помогают лучше закрепить язык.</aside>'],
        ['⚙','Панель тренировки',
          'Настройте тренировку под себя прямо во время занятия.',
          '<dl><dt>Auto</dt><dd>автоматически переходит к следующему заданию</dd><dt>Reverse</dt><dd>меняет направление вопроса и перевода, если режим это поддерживает</dd><dt>Focus</dt><dd>убирает лишние элементы и помогает сосредоточиться</dd><dt>Озвучка</dt><dd>включает произношение слов и примеров</dd></dl><aside><b>Совет:</b> попробуйте Reverse после того, как слова уже немного знакомы. Вспоминать слово самостоятельно сложнее — и полезнее.</aside>'],
        ['♡','Ошибки и Избранное',
          'MOYAMOVA помогает отдельно работать с тем, что важно именно вам.',
          '<p><b>Ошибки</b> пополняются автоматически, когда вы отвечаете неправильно. Возвращайтесь к этому разделу, чтобы закрепить сложные слова.</p><p><b>Избранное</b> формируете вы сами — нажмите ♡ на карточке любого слова.</p><ul><li>Ошибки — то, что стоит повторить</li><li>Избранное — то, что вы хотите сохранить</li><li>счётчики в меню показывают количество таких слов</li></ul>'],
        ['▥','Прогресс и статистика',
          'Ваш результат складывается постепенно — приложение помогает его увидеть.',
          '<p>В Статистике можно посмотреть:</p><ul><li>общий прогресс обучения</li><li>количество изученных слов</li><li>прогресс по частям речи</li><li>активность занятий</li><li>результаты специальных тренажёров</li></ul><p>А на Главной всегда можно быстро продолжить последний словарь.</p><aside>Даже небольшой прогресс каждый день со временем превращается в большой словарный запас.</aside>'],
        ['↓','Данные и работа офлайн',
          'Ваше обучение не привязано к аккаунту или облаку. Основные функции MOYAMOVA работают локально, а прогресс хранится на вашем устройстве.',
          '<ul><li>основные тренировки доступны офлайн</li><li>прогресс сохраняется локально</li><li>данные можно экспортировать и восстановить</li><li>резервная копия помогает перенести обучение на другое устройство</li></ul><aside><b>Важно:</b> перед очисткой браузера, переустановкой приложения или сменой устройства создайте резервную копию в меню.</aside>']
      ],
      note:'<b>Ваш прогресс принадлежит вам.</b> Иногда создавайте резервную копию — это займёт меньше минуты и защитит результаты обучения.',
      back:'Назад на главную',
      nav:{home:'Главная',trainer:'Тренажёр',dicts:'Словари',mistakes:'Ошибки',fav:'Избранное',stats:'Статистика',settings:'Настройки'}
    };
  }

  function sideHtml(t,lg,c){
    const ver=(A().APP_VER||'1.10.11');
    return '<aside class="dash-side guide-side">'+
      '<div class="dash-brand"><img src="./img/logo_64.png" alt=""><div><strong>MOYAMOVA</strong><span>'+languageName(lg)+'</span></div></div>'+
      '<nav>'+
        '<button data-guide-route="home">⌂ <span>'+t.nav.home+'</span></button>'+
        '<button data-guide-route="trainer">▶ <span>'+t.nav.trainer+'</span></button>'+
        '<button data-guide-route="dicts">▤ <span>'+t.nav.dicts+'</span></button>'+
        '<button data-guide-route="mistakes">△ <span>'+t.nav.mistakes+'</span>'+(c.mistakes?'<b class="desktop-nav-count">'+c.mistakes+'</b>':'')+'</button>'+
        '<button data-guide-route="fav">♡ <span>'+t.nav.fav+'</span>'+(c.favs?'<b class="desktop-nav-count">'+c.favs+'</b>':'')+'</button>'+
        '<button data-guide-route="stats">▥ <span>'+t.nav.stats+'</span></button>'+
        '<div class="guide-side-sep"></div>'+
        '<button class="is-active" data-guide-route="settings">⚙ <span>'+t.nav.settings+'</span></button>'+
      '</nav>'+
      '<div class="dash-side-foot">v'+ver+' · Offline <i></i></div>'+
    '</aside>';
  }

  function cardsHtml(t){
    return t.cards.map((c,i)=>
      '<details class="guide-v3-card"'+(i===0?' open':'')+'>'+
        '<summary><i>'+c[0]+'</i><span><b>'+c[1]+'</b><small>'+c[2]+'</small></span><em>⌄</em></summary>'+
        '<div class="guide-v3-body">'+c[3]+'</div>'+
      '</details>'
    ).join('');
  }

  function contentHtml(t){
    return '<header class="guide-v3-head"><div><span>MOYAMOVA</span><h1>'+t.title+'</h1><p>'+t.sub+'</p></div>'+
      '<button class="guide-v3-back" data-guide-back>← '+t.back+'</button></header>'+
      '<section class="guide-v3-start"><div class="guide-v3-start-title"><i>✓</i><div><b>'+t.start+'</b><span>MOYAMOVA</span></div></div>'+
      '<p class="guide-v3-start-copy">'+t.startText+'</p>'+
      '<div class="guide-v3-flow">'+t.flow.map((x,i)=>'<div><i>'+(i+1)+'</i><span>'+x+'</span>'+(i<t.flow.length-1?'<em>→</em>':'')+'</div>').join('')+'</div></section>'+
      '<section class="guide-v3-grid">'+cardsHtml(t)+'</section>'+
      '<aside class="guide-v3-note">💡 '+t.note+'</aside>';
  }

  function mount(){
    const el=app(); if(!el) return;
    const t=T(), lg=currentLearnLang(), counts=navCounts(lg);
    const desktop=!!(root.matchMedia&&root.matchMedia('(min-width:900px)').matches);

    if(desktop){
      el.innerHTML='<div class="guide-v3-shell">'+sideHtml(t,lg,counts)+'<main class="guide-v3-main">'+contentHtml(t)+'</main></div>';
      try{ if(A().PageTips&&A().PageTips.mount) requestAnimationFrame(()=>A().PageTips.mount()); }catch(_){}
    }else{
      el.innerHTML='<main class="guide-v3-mobile">'+contentHtml(t)+'</main>';
    }

    el.querySelectorAll('[data-guide-route]').forEach(btn=>btn.addEventListener('click',()=>route(btn.getAttribute('data-guide-route'))));
    el.querySelector('[data-guide-back]')?.addEventListener('click',()=>route('home'));
    try{
      document.querySelectorAll('.app-footer .nav-btn').forEach(b=>b.classList.remove('active'));
    }catch(_){}
  }

  if(!root.__moyaGuideV3LangBind){
    root.__moyaGuideV3LangBind=true;
    document.addEventListener('lexitron:ui-lang-changed',()=>{
      try{ if(app()&&app().querySelector('.guide-v3-shell,.guide-v3-mobile')) mount(); }catch(_){}
    });
  }

  root.Guide={open:mount};
  A().ViewGuide={mount};
})(window);
