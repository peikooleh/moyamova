/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: sw.js
 * Назначение: Service Worker (PWA, офлайн, обновления)
 * Версия SW: 1.3.7.5
 * Обновлено: 2026-01-08
 * ========================================================== */

'use strict';

// Текущая версия SW / кэша
const SW_VERSION = '1.3.7.5';
const CACHE_NAME = 'moyamova-cache-v1.3.7.5';

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
  'css/view.stats.css',
  'css/ui.setup.modal.css',
  'css/ui.filters.css',

  // Базовое ядро приложения
  'js/app.core.js',
  'js/app.shell.view.js',
  'js/app.shell.logic.js',
  'js/home.js',
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
  'js/ui.examples.hints.js',

  // Экраны
  'js/view.stats.js',
  'js/view.dicts.js',
  'js/view.favorites.js',
  'js/view.mistakes.js',
  'js/view.guide.js',
  'js/donate.js',

  // Инфраструктура
  'js/i18n.js',
  'js/theme.js',
  'js/updates.js',
  'js/ga.consent.js',
  'js/analytics.js',
  'js/legal.js',
  // Словари (деки) – обязательно для первого офлайн-запуска
  'dicts/deck.de.js',
  'dicts/deck.de.lernpunkt.js',
  'dicts/deck.en.js',
  'dicts/deck.sr.js',

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

