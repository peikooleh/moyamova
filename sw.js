/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: sw.js
 * Назначение: Service Worker (PWA, офлайн, обновления)
 * Версия SW: 1.12.50
 * Обновлено: 2026-01-08
 * ========================================================== */

'use strict';

// Текущая версия SW / кэша
const SW_VERSION = '1.12.50';
const CACHE_NAME = 'moyamova-cache-v1.12.50';

// Преобразуем относительные пути в абсолютные URL на основе scope SW
const toUrl = (path) => new URL(path, self.registration.scope).toString();

/**
 * Набор файлов, которые гарантированно попадут в кэш при install.
 * Это "минимальный рабочий офлайн": index, манифест, темы, ключевые CSS и основные JS-модули.
 *
 * Если добавишь новые критичные файлы — расширяй этот список
 * и (желательно) увеличивай CACHE_NAME.
 */
const APP_SHELL = [
  // HTML + манифест
  'index.html',
  'manifest.webmanifest',

  // SEO + ассеты для TWA
  'robots.txt',
  'sitemap.xml',
  '.well-known/assetlinks.json',

  // CSS – темы, оверрайды, статистика, модальное окно сетапа
  'css/theme.light.css',
  'css/theme.dark.css',
  'css/overrides.css',
  'css/trainer.v2.css',
  'css/articles.desktop.css',
  'css/prepositions.desktop.css',
  'css/desktop.trainers.unified.css',
  'css/guide.desktop.css',
  'css/desktop.palette.css',
  'css/home.dashboard.css',
  'css/dicts.v2.css',
  'css/desktop.pages.css',
  'css/desktop.settings.css',
  'css/page.tips.css',
  'css/ui.toast.css',
  'css/ui.modal.css',
  'img/flags/de.svg',
  'img/flags/en.svg',
  'img/flags/sr.svg',
  'img/flags/ru.svg',
  'img/flags/uk.svg',
  'img/flags/es.svg',
  'img/flags/fr.svg',
  'img/moyamova-share-qr.png',
  'css/view.stats.css',
  'css/stats.v2.css',
  'css/stats.v3.css',
  'css/ui.setup.modal.css',
  'css/mobile.foundation.css',
  'css/mobile.home.css',
  'css/mobile.navigation.css',
  'css/mobile.trainer.css',
  'css/mobile.articles.css',
  'css/mobile.prepositions.css',
  'css/mobile.trainer.info.css',
  'css/mobile.dicts.css',
  'css/mobile.collections.css',
  'css/mobile.stats.css',
  'css/mobile.menu.unified.css',
  'img/setup-logo-ru.png',
  'img/setup-logo-uk.png',
  'css/ui.filters.css',

  // Базовое ядро приложения
  'js/app.core.js',
  'js/app.shell.view.js',
  'js/app.shell.logic.js',
  'js/mobile.viewport.js',
  'js/mobile.navigation.js',
  'js/mobile.trainer.js',
  'js/mobile.articles.js',
  'js/mobile.prepositions.js',
  'js/mobile.trainer.info.js',
  'js/mobile.dicts.js',
  'js/mobile.collections.js',
  'js/mobile.stats.js',
  'js/home.js',
  'js/desktop.pages.js',
  'js/desktop.settings.js',
  'js/ui.page.tips.js',
  'js/dicts.js',
  'js/app.decks.js',
  'js/app.trainer.js',
  'js/app.favorites.js',
  'js/app.mistakes.js',
  'js/app.filters.js',

  // Важные UI-модули и жизненный цикл
  'js/ui.lifecycle.js',
  'js/ui.state.js',
  'js/ui.options.safe.js',
  'js/ui.progress.scope.js',
  'js/ui.sets.done.js',
  'js/ui.stats.core.js',
  'js/ui.swipe.js',
  'js/ui.setup.modal.js',
  'js/ui.legal.modal.js',
  'js/ui.audio.tts.js',
  'audio/answer-correct.wav',
  'audio/answer-wrong.wav',
  'js/ui.examples.hints.js',
  'js/ui.scroll.guard.js',

  // Экраны
  'js/view.stats.js',
  'js/view.dicts.js',
  'js/view.favorites.js',
  'js/view.mistakes.js',
  'js/view.guide.js',
  'js/view.home.dashboard.js',
  'js/donate.js',

  // Инфраструктура
  'js/i18n.js',
  'js/theme.js',
  'js/updates.js',
  'js/ga.consent.js',
  'js/analytics.js',
  'js/legal.js',
  'legal/terms.ru.html',
  'legal/terms.uk.html',
  'legal/privacy.ru.html',
  'legal/privacy.uk.html',
  'legal/impressum.ru.html',
  'legal/impressum.uk.html',
  // JSON data layer + словари – обязательно для первого офлайн-запуска
  'js/deck.loader.js',
  'dicts/decks.manifest.json',
  'dicts/data/de/nouns.json',
  'dicts/data/de/verbs.json',
  'dicts/data/de/adjectives.json',
  'dicts/data/de/adverbs.json',
  'dicts/data/de/prepositions.json',
  'dicts/data/de/conjunctions.json',
  'dicts/data/de/particles.json',
  'dicts/data/de/pronouns.json',
  'dicts/data/de/numbers.json',
  'dicts/data/en/nouns.json',
  'dicts/data/en/adjectives.json',
  'dicts/data/en/verbs.json',
  'dicts/data/en/adverbs.json',
  'dicts/data/en/pronouns.json',
  'dicts/data/en/prepositions.json',
  'dicts/data/en/conjunctions.json',
  'dicts/data/en/particles.json',
  'dicts/data/en/numbers.json',
  'dicts/data/de/nouns.lernpunkt.json',
  'dicts/data/de/verbs.lernpunkt.json',
  'dicts/data/de/adjectives.lernpunkt.json',
  'dicts/data/de/adverbs.lernpunkt.json',
  'dicts/data/de/pronouns.lernpunkt.json',
  'dicts/data/de/prepositions.lernpunkt.json',
  'dicts/data/de/numbers.lernpunkt.json',
  'dicts/data/de/conjunctions.lernpunkt.json',
  'dicts/data/de/particles.lernpunkt.json',
  'dicts/data/sr/verbs.json',
  'dicts/data/sr/nouns.json',
  'dicts/data/sr/adverbs.json',
  'dicts/data/sr/adjectives.json',
  'dicts/data/sr/prepositions.json',
  'dicts/data/sr/pronouns.json',
  'dicts/data/sr/numbers.json',
  'dicts/data/sr/conjunctions.json',
  'dicts/data/sr/particles.json',
  'dicts/trainer.prepositions.en.js',
  'dicts/trainer.prepositions.de.js',
  'js/prepositions.trainer.logic.js',

  // Тренер артиклей (логика/прогресс/избранное/ошибки/статистика)
  'js/articles.card.shell.js',
  'js/articles.trainer.logic.js',
  'js/articles.progress.js',
  'js/articles.stats.js',
  'js/articles.favorites.js',
  'js/articles.mistakes.js',

  // Инфраструктура/хелперы, используемые новыми фичами
  'js/ui.bus.js',
  'js/ui.notify.js',
  'js/ui.examples.highlight.de.js',
  'js/ui.examples.highlight.en.js',
  'js/app.decks.bridge.js',
  'js/app.backup.js',
  'js/pro.js',

  // Иконки приложения (для стабильного офлайн и установки)
  'img/android-chrome-192x192.png',
  'img/android-chrome-512x512.png',
  'img/apple-touch-icon-120x120.png',
  'img/apple-touch-icon-152x152.png',
  'img/apple-touch-icon-180x180.png',
  'img/apple-touch-icon-76x76.png',
  'img/favicon.ico',
  'img/logo_32.png',
  'img/logo_64.png',
  'img/logo_128.png',
  'img/logo_512.png',

  // UI-иконки и open-graph
  'img/book.svg',
  'img/book_active.svg',
  'img/book_dark.svg',
  'img/book_hover.svg',
  'img/home.svg',
  'img/home_active.svg',
  'img/home_dark.svg',
  'img/home_hover.svg',
  'img/star.svg',
  'img/star_active.svg',
  'img/star_dark.svg',
  'img/star_hover.svg',
  'img/stats.svg',
  'img/stats_active.svg',
  'img/stats_dark.svg',
  'img/stats_hover.svg',
  'img/warning.svg',
  'img/warning_active.svg',
  'img/warning_dark.svg',
  'img/warning_hover.svg',
  'img/favicon-16x16.png',
  'img/favicon-32x32.png',
  'img/favicon-48x48.png',
  'img/favicon-128x128.png',
  'img/favicon-192x192.png',
  'img/favicon-256x256.png',
  'img/favicon-512x512.png',
  'img/og-cover.PNG'
].map(toUrl);

// ========================================
// Установка SW: кэшируем APP_SHELL
// ========================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(APP_SHELL);
      })
      .catch((err) => {
        // Чтобы из-за одной ошибки не упасть насмерть
        console.warn('[SW] Failed to precache APP_SHELL:', err);
      })
  );

  // Сразу переходим в состояние waiting (будем активировать через SKIP_WAITING)
  self.skipWaiting();
});

// ========================================
// Активация SW: чистим старые кэши
// ========================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Чистим все старые кэши MOYAMOVA, оставляем только актуальный
          if (key !== CACHE_NAME && key.indexOf('moyamova-cache-') === 0) {
            return caches.delete(key);
          }
          return null;
        })
      );
    })
  );

  // Берём управление сразу, без перезагрузки
  self.clients.claim();
});

// ========================================
// Fetch: стратегия для HTML и статики
// ========================================
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Нас интересуют только GET-запросы
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // --------- 1) Навигация (HTML) → network-first с fallback в кэш ---------
  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    event.respondWith(handleNavigateRequest(request));
    return;
  }

  // --------- 2) Статика нашего домена → cache-first + запись в кэш ---------
  if (url.origin === self.location.origin) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // --------- 3) Всё остальное → просто сеть (без кэша) ---------
  // (можно донастроить по желанию)
});

// Network-first для навигации (index.html)
async function handleNavigateRequest(request) {
  try {
    const response = await fetch(request);
    // Успешный ответ — обновляем index.html в кэше
    const copy = response.clone();
    const cache = await caches.open(CACHE_NAME);
    await cache.put(toUrl('index.html'), copy);
    return response;
  } catch (err) {
    // Сети нет или ошибка — берём index.html из кэша
    const cached = await caches.match(toUrl('index.html'));
    if (cached) {
      return cached;
    }
    // На всякий случай — пробуем обычный match по запросу
    const fallback = await caches.match(request);
    if (fallback) {
      return fallback;
    }
    // Если ничего нет — отдаём простой ответ
    return new Response('Offline mode: no cached index.html', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// Cache-first для статики нашего домена
async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    const copy = response.clone();

    // Динамически докидываем новые ресурсы в актуальный кэш
    caches.open(CACHE_NAME)
      .then((cache) => cache.put(request, copy))
      .catch(() => { /* молча игнорим ошибки записи в кэш */ });

    return response;
  } catch (err) {
    // Если сети нет, пытаемся вернуть что-то из кэша (если было)
    if (cached) {
      return cached;
    }

    // В крайнем случае — "пустой" ответ
    return new Response('', { status: 504, statusText: 'Gateway Timeout' });
  }
}

// ========================================
// Сообщения от страницы (SKIP_WAITING)
// ========================================
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

