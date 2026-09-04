/* ==========================================================
 * MOYAMOVA 1.10.17 — Contextual page tips
 * One stable random tip per page visit. RU/UK.
 * ========================================================== */
(function(){
  'use strict';
  const A=(window.App=window.App||{});

  const POOLS={
    home:{
      ru:['Лучше понемногу каждый день, чем много изредка.','Если есть всего 5 минут — этого уже достаточно для короткой тренировки.','Чередуйте слова, артикли и предлоги: разные режимы закрепляют язык с разных сторон.'],
      uk:['Краще потроху щодня, ніж багато зрідка.','Якщо є лише 5 хвилин — цього вже достатньо для короткого тренування.','Чергуйте слова, артиклі та прийменники: різні режими закріплюють мову з різних боків.']
    },
    words:{
      ru:['Не спешите угадывать: сначала попробуйте вспомнить ответ самостоятельно.','Reverse полезнее включать, когда слова уже немного знакомы.','Ошибки — нормальная часть тренировки: сложные слова стоит встретить несколько раз.'],
      uk:['Не поспішайте вгадувати: спочатку спробуйте згадати відповідь самостійно.','Reverse корисніше вмикати, коли слова вже трохи знайомі.','Помилки — нормальна частина тренування: складні слова варто зустріти кілька разів.']
    },
    articles:{
      ru:['Учите существительное сразу вместе с артиклем — как одну языковую единицу.','Обращайте внимание не только на перевод, но и на род слова.','Если артикль постоянно путается, добавьте слово в Избранное и вернитесь к нему позже.'],
      uk:['Вчіть іменник одразу разом з артиклем — як одну мовну одиницю.','Звертайте увагу не лише на переклад, а й на рід слова.','Якщо артикль постійно плутається, додайте слово до Обраного й поверніться до нього пізніше.']
    },
    prepositions:{
      ru:['Предлоги лучше запоминаются в целой фразе, а не отдельно.','После ответа перечитайте предложение целиком — так связь закрепляется лучше.','Не переводите предлог буквально: запоминайте конструкцию вместе с контекстом.'],
      uk:['Прийменники краще запам’ятовуються в цілій фразі, а не окремо.','Після відповіді перечитайте речення повністю — так зв’язок закріплюється краще.','Не перекладайте прийменник буквально: запам’ятовуйте конструкцію разом із контекстом.']
    },
    dicts:{
      ru:['Начинайте с небольшого словаря и возвращайтесь к нему регулярно.','Не обязательно проходить все словари подряд — выбирайте то, что полезно вам сейчас.','Лучше хорошо закрепить один набор, чем поверхностно открыть сразу несколько.'],
      uk:['Починайте з невеликого словника й повертайтеся до нього регулярно.','Не обов’язково проходити всі словники поспіль — обирайте те, що корисно вам зараз.','Краще добре закріпити один набір, ніж поверхово відкрити одразу кілька.']
    },
    mistakes:{
      ru:['Раздел Ошибки — это готовый персональный список для повторения.','Повторяйте ошибки короткими подходами: так сложные слова перестают быть сложными.','Если слово снова вызывает трудности, не спешите — несколько повторений полезнее одного угадывания.'],
      uk:['Розділ Помилки — це готовий персональний список для повторення.','Повторюйте помилки короткими підходами: так складні слова перестають бути складними.','Якщо слово знову викликає труднощі, не поспішайте — кілька повторень корисніші за одне вгадування.']
    },
    fav:{
      ru:['Используйте Избранное как свой личный мини-словарь.','Добавляйте сюда слова, которые хотите встретить ещё несколько раз.','Периодически очищайте Избранное от слов, которые уже хорошо закрепились.'],
      uk:['Використовуйте Обране як свій особистий міні-словник.','Додавайте сюди слова, які хочете зустріти ще кілька разів.','Періодично очищайте Обране від слів, які вже добре закріпилися.']
    },
    stats:{
      ru:['Смотрите на прогресс за недели, а не за один день.','Небольшая регулярная активность важнее редких длинных занятий.','Статистика нужна не для гонки за цифрами, а чтобы видеть, что обучение действительно движется.'],
      uk:['Дивіться на прогрес за тижні, а не за один день.','Невелика регулярна активність важливіша за рідкісні довгі заняття.','Статистика потрібна не для гонитви за цифрами, а щоб бачити, що навчання справді рухається.']
    },
    settings:{
      ru:['Перед очисткой браузера или сменой устройства сделайте резервную копию.','Настройте приложение один раз под себя — дальше можно просто учиться.','Прогресс хранится локально, поэтому резервная копия особенно полезна перед переустановкой.'],
      uk:['Перед очищенням браузера або зміною пристрою зробіть резервну копію.','Налаштуйте застосунок один раз під себе — далі можна просто вчитися.','Прогрес зберігається локально, тому резервна копія особливо корисна перед перевстановленням.']
    },
    guide:{
      ru:['Не нужно запоминать все функции сразу — начните тренировку и возвращайтесь к инструкции по мере необходимости.','Большинство настроек можно менять прямо по ходу обучения.','Если что-то кажется непонятным, сначала попробуйте обычный режим слов — он знакомит с основной логикой приложения.'],
      uk:['Не потрібно запам’ятовувати всі функції одразу — почніть тренування й повертайтеся до інструкції за потреби.','Більшість налаштувань можна змінювати прямо під час навчання.','Якщо щось здається незрозумілим, спочатку спробуйте звичайний режим слів — він знайомить з основною логікою застосунку.']
    }
  };

  let activeRoot=null, activeKey='', activeIndex=0;

  function isUk(){
    try{
      const v=String((A.settings&&(A.settings.uiLang||A.settings.lang))||document.documentElement.lang||'ru').toLowerCase();
      return v==='uk'||v==='ua'||v.startsWith('uk-');
    }catch(_){ return false; }
  }

  function locate(){
    const settings=document.querySelector('.desktop-settings');
    if(settings) return {key:'settings', root:settings.closest('.desktop-pages-main,.trainer-desktop-main,.dash-main') || settings.parentElement};

    const guide=document.querySelector('.guide-v3-main,.guide-v3-mobile');
    if(guide) return {key:'guide',root:guide};

    const dash=document.querySelector('.dashboard .dash-main');
    if(dash) return {key:'home',root:dash};

    /* Mobile pages do not get wrapped in .desktop-pages-main.
       Detect their real content roots so tips match desktop coverage. */
    if(window.matchMedia && window.matchMedia('(max-width:899px)').matches){
      const stats=document.querySelector('.stats-mobile-dashboard');
      if(stats) return {key:'stats',root:stats};

      const dicts=document.querySelector('.home--dicts');
      if(dicts) return {key:'dicts',root:dicts};

      const mistakes=document.querySelector('.home--mistakes');
      if(mistakes) return {key:'mistakes',root:mistakes};

      const fav=document.querySelector('.home--favorites');
      if(fav) return {key:'fav',root:fav};
    }

    const page=document.querySelector('.desktop-pages-main');
    if(page){
      if(page.classList.contains('desktop-pages-main--dicts')) return {key:'dicts',root:page};
      if(page.classList.contains('desktop-pages-main--mistakes')) return {key:'mistakes',root:page};
      if(page.classList.contains('desktop-pages-main--fav')) return {key:'fav',root:page};
      if(page.classList.contains('desktop-pages-main--stats')) return {key:'stats',root:page};
    }

    const trainer=document.querySelector('.trainer-desktop-main');
    if(trainer){
      let kind='words';
      try{ kind=String((A.settings&&A.settings.trainerKind)||'words').toLowerCase(); }catch(_){}
      if(kind!=='articles'&&kind!=='prepositions') kind='words';
      return {key:kind,root:trainer};
    }
    return null;
  }

  function mount(){
    const info=locate();
    if(!info || !POOLS[info.key]) return;
    const existing=info.root.querySelector(':scope > .mm-page-tip');
    if(existing){
      if(info.root===activeRoot && info.key===activeKey){
        const pool=POOLS[info.key][isUk()?'uk':'ru'];
        existing.querySelector('span').textContent=pool[activeIndex%pool.length];
      }
      return;
    }

    if(info.root!==activeRoot || info.key!==activeKey){
      const pool=POOLS[info.key][isUk()?'uk':'ru'];
      activeIndex=Math.floor(Math.random()*pool.length);
      activeRoot=info.root;
      activeKey=info.key;
    }

    const pool=POOLS[info.key][isUk()?'uk':'ru'];
    const tip=document.createElement('div');
    tip.className='mm-page-tip';
    tip.innerHTML='<i aria-hidden="true">💡</i><span></span>';
    tip.querySelector('span').textContent=pool[activeIndex%pool.length];
    info.root.appendChild(tip);
  }

  A.PageTips={mount};

  function boot(){
    const app=document.getElementById('app');
    if(!app) return;
    const mo=new MutationObserver(()=>requestAnimationFrame(mount));
    mo.observe(app,{childList:true,subtree:false});
    document.addEventListener('lexitron:ui-lang-changed',()=>requestAnimationFrame(mount));
    window.addEventListener('resize',()=>requestAnimationFrame(mount));
    requestAnimationFrame(mount);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
