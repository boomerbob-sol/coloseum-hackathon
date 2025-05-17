"use strict";

/**********************************************************************
 * Cloudflare Worker: Boomerverse Lore Application
 *
 * Uses env vars from .env:
 *   TELEGRAM_TOKEN
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 **********************************************************************/

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

const TELEGRAM_TOKEN        = TELEGRAM_TOKEN;        // from .env
const CLOUDINARY_CLOUD_NAME = CLOUDINARY_CLOUD_NAME; // from .env
const API_KEY               = CLOUDINARY_API_KEY;    // from .env
const API_SECRET            = CLOUDINARY_API_SECRET; // from .env

async function handleRequest(request) {
  const url = new URL(request.url);
  switch (url.pathname) {
    case "/telegram":      return handleTelegramUpdate(request);
    case "/lore":          return serveLoreMenu();
    case "/history":       return serveHistoryPage();
    case "/movies":        return serveMoviesPage();
    case "/images":        return serveImagesByTag(request);
    case "/moviesImages":  return serveMoviesImages(request);
    default:               return serveMainPage();
  }
}

// ————————————————————————————————————————————————————————————————
// 1) Main Page ("/")
// ————————————————————————————————————————————————————————————————
function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>…</head>
<body>
  <!-- your HTML/CSS/JS as before -->
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}

// ————————————————————————————————————————————————————————————————
// 2) Lore Menu ("/lore")
// ————————————————————————————————————————————————————————————————
function serveLoreMenu() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>…</head>
<body>
  <!-- your lore menu HTML -->
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}

// ————————————————————————————————————————————————————————————————
// 3) History Timeline ("/history")
// ————————————————————————————————————————————————————————————————
function serveHistoryPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>…</head>
<body>
  <!-- your history timeline HTML/JS -->
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}

// ————————————————————————————————————————————————————————————————
// 4) Movies/Books Page ("/movies")
// ————————————————————————————————————————————————————————————————
function serveMoviesPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>…</head>
<body>
  <!-- your movies/books HTML/JS -->
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}

// ————————————————————————————————————————————————————————————————
// 5) /images?tag=
// ————————————————————————————————————————————————————————————————
async function serveImagesByTag(request) {
  const tag = new URL(request.url).searchParams.get("tag");
  if (!tag) return new Response(JSON.stringify({ error: "Missing tag" }), { status: 400 });
  try {
    const resources = await searchCloudinaryByTag(tag);
    return new Response(JSON.stringify({ resources }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// ————————————————————————————————————————————————————————————————
// 6) /moviesImages?tag=
// ————————————————————————————————————————————————————————————————
async function serveMoviesImages(request) {
  return serveImagesByTag(request);
}

// ————————————————————————————————————————————————————————————————
// 7) Cloudinary Search Utility
// ————————————————————————————————————————————————————————————————
async function searchCloudinaryByTag(tagValue) {
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/search`;
  const auth = btoa(API_KEY + ":" + API_SECRET);
  let all = [], cursor = null;
  do {
    const payload = { expression: `tags:${tagValue}`, max_results: 100, resource_type: "image" };
    if (cursor) payload.next_cursor = cursor;
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + auth
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error("Cloudinary search failed");
    const data = await resp.json();
    all = all.concat(data.resources||[]);
    cursor = data.next_cursor;
  } while (cursor);
  return all;
}

// ————————————————————————————————————————————————————————————————
// 8) Telegram Handler
// ————————————————————————————————————————————————————————————————
async function handleTelegramUpdate(request) {
  let upd;
  try { upd = await request.json(); } catch {
    return new Response("Bad Request", { status: 400 });
  }
  const chatId = upd.message?.chat?.id;
  if (chatId) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "Hello from Boomerverse Lore!" })
    });
  }
  return new Response("Done", { status: 200 });
}
