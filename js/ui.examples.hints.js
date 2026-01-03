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
 let currentTab = 'examples'; // 'examples' | 'synonyms' | 'antonyms' (на сессию)

 /* ----------------------------- Вспомогательные функции ----------------------------- */

 // Язык интерфейса: ru / uk
 function getUiLang() {
 const s = (A.settings && (A.settings.lang || A.settings.uiLang)) || null;
 const attr = (document.documentElement.getAttribute('lang') || '').toLowerCase();
 const v = (s || attr || 'ru').toLowerCase();
 return (v === 'uk') ? 'uk' : 'ru';
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
 synonyms: 'Синоніми',
 antonyms: 'Антоніми'
 };
 }
 return {
 examples: 'Пример',
 synonyms: 'Синонимы',
 antonyms: 'Антонимы'
 };
 }

 // Тексты "нет данных"
 function getNoDataText(kind) {
 const lang = getUiLang();
 if (lang === 'uk') {
 if (kind === 'examples') return 'Для цього слова немає прикладів.';
 if (kind === 'synonyms') return 'Для цього слова немає синонімів.';
 if (kind === 'antonyms') return 'Для цього слова немає антонімів.';
 return '';
 }
 // ru
 if (kind === 'examples') return 'Для этого слова нет примеров.';
 if (kind === 'synonyms') return 'Для этого слова нет синонимов.';
 if (kind === 'antonyms') return 'Для этого слова нет антонимов.';
 return '';
 }


 // Тексты заглушки для PRO (синонимы/антонимы)
 function getProLockText(kind) {
 const lang = getUiLang();
 if (lang === 'uk') {
 if (kind === 'synonyms') return 'Синоніми доступні у версії PRO. ';
 if (kind === 'antonyms') return 'Антоніми доступні у версії PRO. ';
 return 'Функція доступна у версії PRO. ';
 }
 // ru
 if (kind === 'synonyms') return 'Синонимы доступны в версии PRO. ';
 if (kind === 'antonyms') return 'Антонимы доступны в версии PRO. ';
 return 'Функция доступна в версии PRO. ';
 }

 // Синонимы по L2 и L1 (ru/uk)
 function getSynonyms(word) {
  if (!word) return { de: [], l1: [] };

  const ui = getUiLang();
  const l2 = word.deSynonyms || word.enSynonyms || word.synonyms || word.l2Synonyms || [];
  const l1 = (ui === 'uk' ? (word.ukSynonyms || []) : (word.ruSynonyms || [])) || [];

  return {
    de: Array.isArray(l2) ? l2 : [l2].filter(Boolean),
    l1: Array.isArray(l1) ? l1 : [l1].filter(Boolean),
  };
}

 // Антонимы по L2 и L1 (ru/uk)
 function getAntonyms(word) {
  if (!word) return { de: [], l1: [] };

  const ui = getUiLang();
  const l2 = word.deAntonyms || word.enAntonyms || word.antonyms || word.l2Antonyms || [];
  const l1 = (ui === 'uk' ? (word.ukAntonyms || []) : (word.ruAntonyms || [])) || [];

  return {
    de: Array.isArray(l2) ? l2 : [l2].filter(Boolean),
    l1: Array.isArray(l1) ? l1 : [l1].filter(Boolean),
  };
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
 ['examples', 'synonyms', 'antonyms'].forEach(function (tab) {
 const btn = document.createElement('button');
 btn.type = 'button';
 btn.className = 'hints-dot' + (tab === currentTab ? ' is-active' : '');
 btn.dataset.tab = tab;

 btn.addEventListener('click', function () {
 if (currentTab === tab) return;
 currentTab = tab; // запоминаем выбор на сессию
 renderExampleHint(); // перерисовываем содержимое
 });

 pager.appendChild(btn);
 });
 }

 /* ----------------------------- Основной рендер ----------------------------- */

 function renderExamplesTab(word, body) {
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

 body.innerHTML =
 '<div class="hint-example">' +
 '<p class="hint-de">' + deHtml + '</p>' +
 (trHtml ? '<p class="hint-tr">' + trHtml + '</p>' : '') +
 '</div>';
 }

 function renderSynonymsTab(word, body) {
 if (!A.isPro || !A.isPro()) {
 body.innerHTML =
 '<div class="hint-example">' +
 '<p class="hint-tr is-visible">' +
 escapeHtml(getProLockText('synonyms')) +
 '</p>' +
 '</div>';
 return;
 }
 const syn = getSynonyms(word);
 const de = (syn.de || []).filter(Boolean);
 const l1 = (syn.l1 || []).filter(Boolean);

 // ВРЕМЕННО: если нет немецких синонимов — считаем, что синонимов нет вообще
 if (!de.length) {
 body.innerHTML =
 '<div class="hint-example">' +
 '<p class="hint-tr is-visible">' +
 escapeHtml(getNoDataText('synonyms')) +
 '</p>' +
 '</div>';
 return;
 }

 const top = de.join(', ');
 const bottom = l1.join(', ');

 body.innerHTML =
 '<div class="hint-example">' +
 (top ? '<p class="hint-de">' + escapeHtml(top) + '</p>' : '') +
 (bottom ? '<p class="hint-tr">' + escapeHtml(bottom) + '</p>' : '') +
 '</div>';
}

 function renderAntonymsTab(word, body) {
 if (!A.isPro || !A.isPro()) {
 body.innerHTML =
 '<div class="hint-example">' +
 '<p class="hint-tr is-visible">' +
 escapeHtml(getProLockText('antonyms')) +
 '</p>' +
 '</div>';
 return;
 }
 const ant = getAntonyms(word);
 const de = (ant.de || []).filter(Boolean);
 const l1 = (ant.l1 || []).filter(Boolean);

 // ВРЕМЕННО: если нет немецких антонимов — считаем, что антонимов нет вообще
 if (!de.length) {
 body.innerHTML =
 '<div class="hint-example">' +
 '<p class="hint-tr is-visible">' +
 escapeHtml(getNoDataText('antonyms')) +
 '</p>' +
 '</div>';
 return;
 }

 const top = de.join(', ');
 const bottom = l1.join(', ');

 body.innerHTML =
 '<div class="hint-example">' +
 (top ? '<p class="hint-de">' + escapeHtml(top) + '</p>' : '') +
 (bottom ? '<p class="hint-tr">' + escapeHtml(bottom) + '</p>' : '') +
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

 if (currentTab === 'synonyms') {
 renderSynonymsTab(word, body);
 } else if (currentTab === 'antonyms') {
 renderAntonymsTab(word, body);
 } else {
 // 'examples' или любые другие значения по умолчанию → примеры
 renderExamplesTab(word, body);
 }
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

 // 1) Клик по немецкому примеру — показать/скрыть перевод вручную
 const deEl = target.closest('.hint-de');
 if (deEl) {
 const root = deEl.closest('.hint-example');
 if (!root) return;

 const trEl = root.querySelector('.hint-tr');
 if (!trEl) return;

 const willShow = !trEl.classList.contains('is-visible');

 trEl.classList.toggle('is-visible');

 // Если перевод только что показали — следим, чтобы он не спрятался под скролл
 if (willShow) {
 ensureTranslationVisible(trEl);
 }
 return;
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
