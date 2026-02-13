/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: ui.examples.hints.js
 * Назначение: Пример использования текущего слова
 * в зоне .home-hints под сетами
 * (Пример / Синонимы / Антонимы)
 * Версия: 3.0 (вкладки + общая логика показа перевода)
 * Обновлено: 2025-11-29
 * ========================================================== */

(function () {
 'use strict';

 const A = (window.App = window.App || {});

 let wordObserver = null; // наблюдатель за .trainer-word
 let wrongAttempts = 0; // счётчик неверных ответов для текущего слова
 let currentTab = 'examples'; // 'examples' | 'extra' (на сессию)
 let translationUnlocked = false; // во вкладке "Дополнительно" перевод раскрывается только после ответа

 /* ----------------------------- Вспомогательные функции ----------------------------- */

 // Язык интерфейса: ru / uk
 function getUiLang() {
 const s = (A.settings && (A.settings.lang || A.settings.uiLang)) || null;
 const attr = (document.documentElement.getAttribute('lang') || '').toLowerCase();
 const v = (s || attr || 'ru').toLowerCase();
 return (v === 'uk') ? 'uk' : 'ru';
 }

 // Reverse training toggle (word-trainer only).
 // In reverse mode:
 //  - before answer: show L1 (RU/UK)
 //  - after answer: reveal L2 (DE)
 // In forward mode (legacy):
 //  - before answer: show L2 (DE)
 //  - after answer: reveal L1 (RU/UK)
 function isReverseTraining(){
  try {
   var el = document.getElementById('trainReverse');
   return !!(el && el.checked);
  } catch(_){
   return false;
  }
 }

 function escapeHtml(str) {
 return String(str || '').replace(/[&<>"']/g, function (m) {
 return ({
 '&': '&amp;',
 '<': '&lt;',
 '>': '&gt;',
 '"': '&quot;',
 "'": '&#39;'
 })[m] || m;
 });
 }

 function escapeRegExp(str) {
 return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
 }

 // Определяем язык по ключу деки (de_verbs, en_nouns, ...)
 function detectLangFromDeckKey(deckKey) {
 if (!deckKey) return null;
 var k = String(deckKey).toLowerCase();
 var parts = k.split(/[_\.]/);
 return parts[0] || null;
 }


 // Подсветка тренируемого слова внутри предложения
 // Базовый слой: пытаемся найти точное совпадение леммы.
 // Если не находим — пробуем языкоспецифичный обработчик в App.ExampleHighlight[lang].
 function highlightSentence(raw, wordObj, deckKey) {
 if (!raw || !wordObj) return escapeHtml(raw);

 const w = wordObj && wordObj.word ? String(wordObj.word) : '';
 const lemma = w.trim().split(/\s+/).pop(); // отбрасываем артикль у существительных
 if (!lemma) return escapeHtml(raw);

 // 1) Пробуем точное совпадение по лемме
 let re = new RegExp('\\b' + escapeRegExp(lemma) + '\\b', 'i');
 let m = raw.match(re);

 if (!m) {
 // 2) Если не нашли — подключаем языкоспецифичный обработчик
 const lang = detectLangFromDeckKey(deckKey);
 const mod = A.ExampleHighlight && lang && A.ExampleHighlight[lang];

 if (typeof mod === 'function') {
 try {
 const adv = mod(raw, wordObj, deckKey, lemma);
 if (adv && typeof adv.index === 'number' && adv.index >= 0 &&
 typeof adv.length === 'number' && adv.length > 0) {

 const idxAdv = adv.index;
 const beforeAdv = raw.slice(0, idxAdv);
 const hitAdv = raw.slice(idxAdv, idxAdv + adv.length);
 const afterAdv = raw.slice(idxAdv + adv.length);

 return (
 escapeHtml(beforeAdv) +
 '<span class="hint-word">' + escapeHtml(hitAdv) + '</span>' +
 escapeHtml(afterAdv)
 );
 }
 } catch (e) {
 console.error('[examples.hints] lang-specific highlight error:', e);
 }
 }

 // 3) Ни точного, ни расширенного совпадения — просто текст
 return escapeHtml(raw);
 }

 const idx = m.index;
 const match = m[0];

 const before = raw.slice(0, idx);
 const after = raw.slice(idx + match.length);

 return (
 escapeHtml(before) +
 '<span class="hint-word">' + escapeHtml(match) + '</span>' +
 escapeHtml(after)
 );
 }

 // Названия вкладок
 function getTabLabels() {
 const lang = getUiLang();
 if (lang === 'uk') {
  return {
   examples: 'Приклад',
   extra: 'Додатково',
   // backward-compat (older code may ask for these)
   synonyms: 'Додатково',
   antonyms: 'Додатково'
  };
 }

 // ru (default)
 return {
  examples: 'Пример',
  extra: 'Дополнительно',
  // backward-compat
  synonyms: 'Дополнительно',
  antonyms: 'Дополнительно'
 };
}

// Активная дека (best-effort), нужна для выбора L2 (de/en/..) в синонимах/антонимах.
// Здесь нельзя тянуть home.js напрямую, поэтому делаем безопасный резолв из settings.
function getActiveDeckKeySafe() {
 try {
  const A = window.App || {};
  const s = A.settings || {};

  const last = s.lastDeckKey;
  if (typeof last === 'string' && last) return last;

  const prefer = s.preferredReturnKey;
  if (typeof prefer === 'string' && prefer) return prefer;

  // первый запуск: если есть StartupManager — берём оттуда
  if (window.StartupManager && typeof StartupManager.readSettings === 'function') {
   const ss = StartupManager.readSettings() || {};
   if (typeof ss.lastDeckKey === 'string' && ss.lastDeckKey) return ss.lastDeckKey;
   if (typeof ss.preferredReturnKey === 'string' && ss.preferredReturnKey) return ss.preferredReturnKey;
  }
 } catch (_) {}

 // fallback: не знаем деку
 return null;
}


 // Тексты "нет данных"
 function getNoDataText(kind) {
 const lang = getUiLang();

 if (lang === 'uk') {
  if (kind === 'examples') return 'Для цього слова немає прикладів.';
  if (kind === 'extra' || kind === 'synonyms' || kind === 'antonyms') return 'Для цього слова немає синонімів і антонімів.';
  return '';
 }

 // ru (default)
 if (kind === 'examples') return 'Для этого слова нет примеров.';
 if (kind === 'extra' || kind === 'synonyms' || kind === 'antonyms') return 'Для этого слова нет синонимов и антонимов.';
 return '';
}


 // Тексты заглушки для PRO (синонимы/антонимы)
 function getProLockText(kind) {
 const lang = getUiLang();
 if (lang === 'uk') {
  if (kind === 'examples') return 'Приклади доступні у версії PRO.';
  if (kind === 'extra') return 'Додаткові підказки (синоніми/антоніми) доступні у версії PRO.';
  // legacy keys (backward compatibility)
  if (kind === 'synonyms') return 'Синоніми доступні у версії PRO.';
  if (kind === 'antonyms') return 'Антоніми доступні у версії PRO.';
  return 'Функція доступна у версії PRO.';
 }

 // ru (default)
 if (kind === 'examples') return 'Примеры доступны в версии PRO.';
 if (kind === 'extra') return 'Дополнительные подсказки (синонимы/антонимы) доступны в версии PRO.';
 // legacy keys
 if (kind === 'synonyms') return 'Синонимы доступны в версии PRO.';
 if (kind === 'antonyms') return 'Антонимы доступны в версии PRO.';
 return 'Функция доступна в версии PRO.';
}


 // Заглушка для упражнения "Артикли" (примеры/синонимы/антонимы)
 function isArticlesTrainerMode() {
  return (
    typeof A !== 'undefined' &&
    A.ArticlesTrainer &&
    typeof A.ArticlesTrainer.isActive === 'function' &&
    A.ArticlesTrainer.isActive()
  );
 }

 function getExerciseLockText() {
  const lang = getUiLang();
  return (lang === 'uk')
    ? 'Недоступно в цій вправі.'
    : 'Не доступно в этом упражнении.';
 }

 // Синонимы по L2 и L1 (ru/uk)
// L2 определяется по активной деке (de_* / en_* / ...).
function getSynonyms(word, deckKey) {
 if (!word) return { l2: [], l1: [] };

 const uiLang = getUiLang();

 // L2 (язык деки)
 const lang = detectLangFromDeckKey(deckKey) || 'de';
 const l2Key = lang + 'Synonyms';
 const l2 = Array.isArray(word[l2Key]) ? word[l2Key] : [];

 // L1 (язык интерфейса)
 const ru = Array.isArray(word.ruSynonyms) ? word.ruSynonyms : [];
 const uk = Array.isArray(word.ukSynonyms) ? word.ukSynonyms : [];

 const l1 = (uiLang === 'uk') ? uk : ru;
 return { l2: l2, l1: l1 };
}

// Антонимы по L2 и L1 (ru/uk)
// L2 определяется по активной деке (de_* / en_* / ...).
function getAntonyms(word, deckKey) {
 if (!word) return { l2: [], l1: [] };

 const uiLang = getUiLang();

 // L2 (язык деки)
 const lang = detectLangFromDeckKey(deckKey) || 'de';
 const l2Key = lang + 'Antonyms';
 const l2 = Array.isArray(word[l2Key]) ? word[l2Key] : [];

 // L1 (язык интерфейса)
 const ru = Array.isArray(word.ruAntonyms) ? word.ruAntonyms : [];
 const uk = Array.isArray(word.ukAntonyms) ? word.ukAntonyms : [];

 const l1 = (uiLang === 'uk') ? uk : ru;
 return { l2: l2, l1: l1 };
}


 /* ----------------------------- Заголовок и вкладки ----------------------------- */

 // Создаём/обновляем заголовок с вкладками
 function ensureTitle(section) {
 const bodyEl = section.querySelector('#hintsBody');
 if (!bodyEl) return;

 let header = section.querySelector('.hints-header');
 if (!header) {
 header = document.createElement('div');
 header.className = 'hints-header';

 const titleEl = document.createElement('div');
 titleEl.className = 'hints-title';
 titleEl.id = 'hintsTabLabel';

 const pager = document.createElement('div');
 pager.className = 'hints-pager';

 header.appendChild(titleEl);
 header.appendChild(pager);

 section.insertBefore(header, bodyEl);
 }

 const labels = getTabLabels();
 const titleEl = header.querySelector('#hintsTabLabel');
 const pager = header.querySelector('.hints-pager');
 if (!titleEl || !pager) return;

 titleEl.textContent = labels[currentTab] || labels.examples;

 // индикаторы вкладок
 pager.innerHTML = '';
 ['examples', 'extra'].forEach(function (tab) {
 const btn = document.createElement('button');
 btn.type = 'button';
 btn.className = 'hints-dot' + (tab === currentTab ? ' is-active' : '');
 btn.dataset.tab = tab;

 btn.addEventListener('click', function () {
 if (currentTab === tab) return;
 currentTab = tab; // запоминаем выбор на сессию
 translationUnlocked = false;
 renderExampleHint(); // перерисовываем содержимое
 });

 pager.appendChild(btn);
 });
 }

 /* ----------------------------- Основной рендер ----------------------------- */

 function renderExamplesTab(word, body) {
 // В упражнении "Артикли" примеры недоступны
 if (isArticlesTrainerMode()) {
  body.innerHTML =
   '<div class="hint-example">' +
   '<p class="hint-tr hint-tr-inline is-visible">' +
   escapeHtml(getExerciseLockText()) +
   '</p>' +
   '</div>';
  return;
 }

 const examples = Array.isArray(word.examples) ? word.examples : [];
 if (!examples.length) {
 // если нет примеров — просто очищаем (как было раньше)
 body.innerHTML = '';
 return;
 }

 const ex = examples[0] || {};
 const de = ex.L2 || ex.de || ex.deu || '';
 if (!de) {
 body.innerHTML = '';
 return;
 }

 const uiLang = getUiLang();
 const tr = (uiLang === 'uk')
 ? (ex.uk || ex.ru || '')
 : (ex.ru || ex.uk || '');

 let deckKey = null;
 try {
 if (A.Trainer && typeof A.Trainer.getDeckKey === 'function') {
 deckKey = A.Trainer.getDeckKey();
 }
 } catch (_) {}

 const deHtml = highlightSentence(de, word, deckKey);
 const trHtml = escapeHtml(tr);

 // Reverse mode: show L1 first, reveal L2 after answer.
 // Forward mode (legacy): show L2 first, reveal L1 after answer.
 const reverse = isReverseTraining();

 // "hint-de" is always the visible line (before answer).
 // "hint-tr" is the revealed line (after answer), shown via showTranslation().
 const beforeHtml = reverse ? trHtml : deHtml;
 const afterHtml  = reverse ? deHtml : trHtml;

 body.innerHTML =
 '<div class="hint-example">' +
 (beforeHtml ? '<p class="hint-de">' + beforeHtml + '</p>' : '') +
 (afterHtml  ? '<p class="hint-tr">' + afterHtml  + '</p>' : '') +
 '</div>';
 }

 function renderSynonymsTab(word, body) {
 // В упражнении "Артикли" синонимы недоступны
 if (isArticlesTrainerMode()) {
  body.innerHTML =
   '<div class="hint-example">' +
   '<p class="hint-tr hint-tr-inline is-visible">' +
   escapeHtml(getExerciseLockText()) +
   '</p>' +
   '</div>';
  return;
 }

 if (!A.isPro || !A.isPro()) {
 body.innerHTML =
 '<div class="hint-example">' +
 '<p class="hint-tr hint-tr-inline is-visible">' +
 escapeHtml(getProLockText('synonyms')) +
 '</p>' +
 '</div>';
 return;
 }
 let deckKey = null;
 try {
  if (A.Trainer && typeof A.Trainer.getDeckKey === 'function') {
   deckKey = A.Trainer.getDeckKey();
  }
 } catch (_) {}

 const syn = getSynonyms(word, deckKey);
 const l2 = (syn.l2 || []).filter(Boolean);
 const l1 = (syn.l1 || []).filter(Boolean);

 // Если нет данных по L2 — считаем, что синонимов нет
 if (!l2.length) {
 body.innerHTML =
 '<div class="hint-example">' +
 '<p class="hint-tr hint-tr-inline is-visible">' +
 escapeHtml(getNoDataText('synonyms')) +
 '</p>' +
 '</div>';
 return;
 }

 const top = l2.join(', ');
 const bottom = l1.join(', ');

 const reverse = isReverseTraining();

 // Reverse mode: show L1 first, reveal DE after answer.
 // Forward mode: show DE first, reveal L1 after answer.
 const beforeText = reverse ? bottom : top;
 const afterText  = reverse ? top : bottom;

 // If the "before" side is missing in reverse, show the same RU/UK placeholder as today.
 // (Requested: keep RU/UK placeholders for now.)
 if (reverse && !beforeText) {
   body.innerHTML =
   '<div class="hint-example">' +
   '<p class="hint-tr hint-tr-inline is-visible">' +
   escapeHtml(getNoDataText('synonyms')) +
   '</p>' +
   '</div>';
   return;
 }

 body.innerHTML =
 '<div class="hint-example">' +
 (beforeText ? '<p class="hint-de">' + escapeHtml(beforeText) + '</p>' : '') +
 (afterText  ? '<p class="hint-tr">' + escapeHtml(afterText)  + '</p>' : '') +
 '</div>';
}

 function renderAntonymsTab(word, body) {
 // В упражнении "Артикли" антонимы недоступны
 if (isArticlesTrainerMode()) {
  body.innerHTML =
   '<div class="hint-example">' +
   '<p class="hint-tr hint-tr-inline is-visible">' +
   escapeHtml(getExerciseLockText()) +
   '</p>' +
   '</div>';
  return;
 }

 if (!A.isPro || !A.isPro()) {
 body.innerHTML =
 '<div class="hint-example">' +
 '<p class="hint-tr hint-tr-inline is-visible">' +
 escapeHtml(getProLockText('antonyms')) +
 '</p>' +
 '</div>';
 return;
 }
 let deckKey = null;
 try {
  if (A.Trainer && typeof A.Trainer.getDeckKey === 'function') {
   deckKey = A.Trainer.getDeckKey();
  }
 } catch (_) {}

 const ant = getAntonyms(word, deckKey);
 const l2 = (ant.l2 || []).filter(Boolean);
 const l1 = (ant.l1 || []).filter(Boolean);

 // Если нет данных по L2 — считаем, что антонимов нет
 if (!l2.length) {
 body.innerHTML =
 '<div class="hint-example">' +
 '<p class="hint-tr hint-tr-inline is-visible">' +
 escapeHtml(getNoDataText('antonyms')) +
 '</p>' +
 '</div>';
 return;
 }

 const top = l2.join(', ');
 const bottom = l1.join(', ');

 const reverse = isReverseTraining();

 // Reverse mode: show L1 first, reveal DE after answer.
 // Forward mode: show DE first, reveal L1 after answer.
 const beforeText = reverse ? bottom : top;
 const afterText  = reverse ? top : bottom;

 // If the "before" side is missing in reverse, show the same RU/UK placeholder as today.
 // (Requested: keep RU/UK placeholders for now.)
 if (reverse && !beforeText) {
   body.innerHTML =
   '<div class="hint-example">' +
   '<p class="hint-tr hint-tr-inline is-visible">' +
   escapeHtml(getNoDataText('antonyms')) +
   '</p>' +
   '</div>';
   return;
 }

 body.innerHTML =
 '<div class="hint-example">' +
 (beforeText ? '<p class="hint-de">' + escapeHtml(beforeText) + '</p>' : '') +
 (afterText  ? '<p class="hint-tr">' + escapeHtml(afterText)  + '</p>' : '') +
 '</div>';
}

 function renderExampleHint() {
 const section = document.querySelector('.home-hints');
 const body = document.getElementById('hintsBody');
 if (!section || !body) return;

 ensureTitle(section);

 const word = A.__currentWord;
 if (!word) {
 body.innerHTML = '';
 return;
 }

 if (currentTab === 'extra') {
  renderExtraTab(word, body);
 } else {
  renderExamplesTab(word, body);
 }
 }

 function renderExtraTab(word, body) {
 // В упражнении "Артикли" доп. контент недоступен
 if (isArticlesTrainerMode()) {
  body.innerHTML =
   '<div class="hint-example">' +
   '<p class="hint-tr hint-tr-inline is-visible">' +
   escapeHtml(getExerciseLockText()) +
   '</p>' +
   '</div>';
  return;
 }

 // PRO-gate: синонимы/антонимы доступны только в Pro (если такая логика включена)
 if (A.isPro && !A.isPro()) {
  body.innerHTML =
   '<div class="hint-example">' +
   '<p class="hint-tr hint-tr-inline is-visible">' +
   escapeHtml(getProLockText('extra')) +
   '</p>' +
   '</div>';
  return;
 }

 const deckKey = getActiveDeckKeySafe();
 const syn = getSynonyms(word, deckKey); // { l2, l1 }
 const ant = getAntonyms(word, deckKey); // { l2, l1 }

 const hasSyn = syn && Array.isArray(syn.l2) && syn.l2.length;
 const hasAnt = ant && Array.isArray(ant.l2) && ant.l2.length;

 if (!hasSyn && !hasAnt) {
  body.innerHTML =
   '<div class="hint-example">' +
   '<p class="hint-tr hint-tr-inline is-visible">' +
   escapeHtml(getNoDataText('extra')) +
   '</p>' +
   '</div>';
  return;
 }

 body.innerHTML = '';

 // Рендер в 1 строку: "Синонимы: ... — перевод" / "Антонимы: ... — перевод"
 // Перевод живёт в .hint-tr (inline) и раскрывается тапом/после верного ответа.
 function renderRow(labelText, l2Arr, l1Arr) {
  const l2Text = escapeHtml(l2Arr.join(', '));
  const l1Text = escapeHtml(l1Arr.join(', '));

  const hasL1 = !!l1Text;
  const dash = hasL1 ? ' — ' : '';

  body.innerHTML +=
   '<div class="hint-example hint-extra-row">' +
   '<p class="hint-de">' +
   '<span class="hint-label">' +
   escapeHtml(labelText) +
   '</span>' +
   ' ' +
   '<span class="hint-l2">' + l2Text + '</span>' +
   '<span class="hint-tr hint-tr-inline">' +
   dash +
   l1Text +
   '</span>' +
   '</p>' +
   '</div>';
 }

 const lang = getUiLang();
 const synLabelText = (lang === 'uk') ? 'Синоніми: ' : 'Синонимы: ';

 const antLabelText = (lang === 'uk') ? 'Антоніми: ' : 'Антонимы: ';


 if (hasSyn) renderRow(synLabelText, syn.l2, syn.l1);
 if (hasAnt) renderRow(antLabelText, ant.l2, ant.l1);
}


/* ----------------------------- Автопоказ + прокрутка перевода ----------------------------- */

 // Прокрутка внутри окна подсказок, если перевод вылез за нижнюю границу
 function ensureTranslationVisible(trEl) {
 const body = document.getElementById('hintsBody');
 if (!body || !trEl) return;

 const bodyRect = body.getBoundingClientRect();
 const trRect = trEl.getBoundingClientRect();

 // Уже полностью виден — ничего не крутим
 if (trRect.top >= bodyRect.top && trRect.bottom <= bodyRect.bottom) {
 return;
 }

 // Если нижний край ушёл вниз — прокручиваем так, чтобы он оказался в зоне видимости
 const delta = trRect.bottom - bodyRect.bottom;
 body.scrollTop += delta + 14; // небольшой запас
 }

 // Показ перевода (для активной вкладки)
 function showTranslation() {
 const body = document.getElementById('hintsBody');
 if (!body) return;

 // После ответа разрешаем раскрытие переводов (тапом) во вкладке "Дополнительно"
 translationUnlocked = true;

 if (currentTab === 'extra') {
  const rows = body.querySelectorAll('.hint-example.hint-extra-row');
  if (!rows || !rows.length) return;

  rows.forEach(function(row){
   const tr = row.querySelector('.hint-tr');
   if (tr) tr.classList.add('is-visible');
  });

  // прокрутим к последнему переводу, если он вылезает
  const lastTr = rows[rows.length - 1].querySelector('.hint-tr');
  if (lastTr) ensureTranslationVisible(lastTr);
  return;
 }

 const root = body.querySelector('.hint-example');
 if (!root) return;
 const trEl = root.querySelector('.hint-tr');
 if (!trEl) return;

 trEl.classList.add('is-visible');
 ensureTranslationVisible(trEl);
}

 /* ----------------------------- Наблюдение за тренером ----------------------------- */

 function setupWordObserver() {
 const wordEl = document.querySelector('.trainer-word');

 // если нет тренера — отключаем observer и хотя бы один раз рендерим
 if (!wordEl || typeof MutationObserver === 'undefined') {
 if (wordObserver) {
 wordObserver.disconnect();
 wordObserver = null;
 }
 renderExampleHint();
 return;
 }

 // отключаем старый observer, чтобы не плодить
 if (wordObserver) {
 wordObserver.disconnect();
 wordObserver = null;
 }

 let last = wordEl.textContent || '';

 wordObserver = new MutationObserver(function () {
 const t = wordEl.textContent || '';
 if (t === last) return;
 last = t;

 // новое слово → сбрасываем счётчик неверных попыток
 wrongAttempts = 0;
 translationUnlocked = false;

 const body = document.getElementById('hintsBody');
 if (body) body.scrollTop = 0;

 renderExampleHint();
 });

 wordObserver.observe(wordEl, {
 childList: true,
 subtree: true,
 characterData: true
 });

 // первый рендер для уже выведенного слова
 wrongAttempts = 0;
 translationUnlocked = false;
 const body = document.getElementById('hintsBody');
 if (body) body.scrollTop = 0;
 renderExampleHint();
 }

 // глобальный observer: следим только за появлением НОВОГО .trainer-word
 function setupGlobalHomeObserver() {
 if (typeof MutationObserver === 'undefined') {
 return;
 }

 const obs = new MutationObserver(function (mutations) {
 let needSetup = false;

 for (let i = 0; i < mutations.length; i++) {
 const m = mutations[i];
 if (!m.addedNodes || !m.addedNodes.length) continue;

 for (let j = 0; j < m.addedNodes.length; j++) {
 const node = m.addedNodes[j];
 if (node.nodeType !== 1) continue; // только элементы

 // сам .trainer-word
 if (node.matches && node.matches('.trainer-word')) {
 needSetup = true;
 break;
 }

 // или внутри добавленного узла есть .trainer-word
 if (node.querySelector && node.querySelector('.trainer-word')) {
 needSetup = true;
 break;
 }
 }

 if (needSetup) break;
 }

 if (needSetup) {
 setupWordObserver();
 }
 });

 obs.observe(document.body, {
 childList: true,
 subtree: true
 });
 }

 /* ----------------------------- Обработка кликов ----------------------------- */

 function attachClickHandlers() {
 document.addEventListener('click', function (evt) {
 const target = evt.target;

 // 1) Тап по блоку подсказки — показать/скрыть "вторую строку" (перевод/обратную сторону)
 // Почему так: у синонимов/антонимов строка часто короткая и попасть точно в текст сложнее.
 // Поэтому расширяем зону тапа до всего блока .hint-example (кроме пагинатора/кнопок).
 const hintRoot = target.closest('.hint-example');
 if (hintRoot && !target.closest('.hint-pager') && !target.closest('button')) {
  // anti-cheat guard removed: allow manual reveal anytime

  const trEl = hintRoot.querySelector('.hint-tr');
  if (trEl) {
   const willShow = !trEl.classList.contains('is-visible');

   trEl.classList.toggle('is-visible');

   // Если перевод только что показали — следим, чтобы он не спрятался под скролл
   if (willShow) {
    ensureTranslationVisible(trEl);
   }
   return;
  }
 }

 // 2) Клик по вариантам ответов / "Не знаю"
 const answersGrid = document.querySelector('.home-trainer .answers-grid');
 const idkBtn = document.querySelector('.home-trainer .idk-btn');

 if (!answersGrid && !idkBtn) return;

 const answerBtn = target.closest('.answers-grid button');
 const isIdk = idkBtn && target.closest('.idk-btn');

 // 2.1) Клик по варианту ответа
 if (answerBtn && answersGrid && answersGrid.contains(answerBtn)) {
 const isCorrect = answerBtn.classList.contains('is-correct');
 const isWrong = answerBtn.classList.contains('is-wrong');

 // корректный ответ → сразу показываем перевод
 if (isCorrect) {
 setTimeout(showTranslation, 0);
 return;
 }

 // неправильный ответ → считаем попытки, на 2-й показываем перевод
 if (isWrong) {
 wrongAttempts += 1;
 if (wrongAttempts >= 2) {
 setTimeout(showTranslation, 0);
 }
 }

 return;
 }

 // 2.2) Клик по "Не знаю" → как раньше, сразу показываем перевод
 if (isIdk) {
 setTimeout(showTranslation, 0);
 return;
 }
 });
 }

 /* ----------------------------- Инициализация ----------------------------- */

 function init() {
 attachClickHandlers();
 setupWordObserver(); // следим за сменой слова в тренере
 setupGlobalHomeObserver(); // восстанавливаем observer после навигации

 // ручной хук, если понадобится
 (A.HintsExamples = A.HintsExamples || {}).refresh = renderExampleHint;
 }

 if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', init, { once: true });
 } else {
 init();
 }
})();
