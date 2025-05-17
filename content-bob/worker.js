// content-bob/worker.js

// Keep a global array in the Worker to track recently shown images per mode
// NOTE: This will reset if the Worker restarts or scales.
let recentImages = [];

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

// ------------------------------
// Cloudinary Configuration
// ------------------------------
// We read these three values from your secret bindings (.env)
//   • CLOUDINARY_CLOUD_NAME            – same for all Workers
//   • CONTENTBOB_CLOUDINARY_API_KEY     – ContentBob-specific API key
//   • CONTENTBOB_CLOUDINARY_API_SECRET  – ContentBob-specific API secret
// Make sure you've set these exact names in your .env and bound them to the Worker.
const CLOUDINARY_CLOUD_NAME = CLOUDINARY_CLOUD_NAME;
const API_KEY               = CONTENTBOB_CLOUDINARY_API_KEY;
const API_SECRET            = CONTENTBOB_CLOUDINARY_API_SECRET;

// Mapping from mode to Cloudinary tag
const modeTagMapping = {
  engage:   "engage",
  meme:     "meme template",
  profiles: "profiles",
};

// ------------------------------
// Utility Functions
// ------------------------------
async function fetchCloudinaryImagesByTag(tag) {
  const url  = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/search`;
  const auth = btoa(`${API_KEY}:${API_SECRET}`);
  let allResources = [], nextCursor = null;

  do {
    const payload = {
      expression:    `tags:${tag}`,
      max_results:   500,
      resource_type: "image",
      ...(nextCursor && { next_cursor: nextCursor }),
    };
    const resp = await fetch(url, {
      method:  "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error("Failed to fetch images from Cloudinary");
    const data = await resp.json();
    allResources = allResources.concat(data.resources || []);
    nextCursor    = data.next_cursor;
  } while (nextCursor);

  return allResources;
}

function getDirectLink(publicId, format) {
  format = format || "jpg";
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}.${format}`;
}

function pickRandomImage(images) {
  let available = images.filter((img) => !recentImages.includes(img.public_id));
  if (available.length === 0) {
    recentImages = [];
    available    = images;
  }
  const picked = available[Math.floor(Math.random() * available.length)];
  recentImages.push(picked.public_id);
  if (recentImages.length > 55) recentImages.shift();
  return picked;
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ------------------------------
// Main Handler
// ------------------------------
async function handleRequest(request) {
  const url  = new URL(request.url);
  const path = url.pathname;

  if (path === "/random"  && request.method === "GET") return handleRandomRequest(url);
  if (path === "/dataurl" && request.method === "GET") return handleDataURLRequest(url);
  return serveMainPage();
}

// 1. /random?mode=...
async function handleRandomRequest(url) {
  try {
    const mode   = (url.searchParams.get("mode") || "engage").toLowerCase();
    const tag    = modeTagMapping[mode] || "";
    const images = await fetchCloudinaryImagesByTag(tag);

    if (!images.length) {
      return new Response(JSON.stringify({ error: "No images found" }), {
        status:  200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (mode === "meme") {
      const out = [];
      for (let i = 0; i < 2; i++) {
        const img = pickRandomImage(images);
        out.push(getDirectLink(img.public_id, img.format));
      }
      return new Response(JSON.stringify({ images: out }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      const img    = pickRandomImage(images);
      const urlImg = getDirectLink(img.public_id, img.format);
      return new Response(JSON.stringify({ image: urlImg }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status:  500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// 2. /dataurl?img=...
async function handleDataURLRequest(url) {
  try {
    const imgUrl = url.searchParams.get("img");
    if (!imgUrl) {
      return new Response(JSON.stringify({ error: "Missing img param" }), {
        status:  400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const resp = await fetch(imgUrl);
    if (!resp.ok) throw new Error("Failed to fetch image from Cloudinary");

    const buf    = await resp.arrayBuffer();
    const base64 = arrayBufferToBase64(buf);
    const ct     = resp.headers.get("Content-Type") || "image/jpeg";
    const dataUrl = `data:${ct};base64,${base64}`;

    return new Response(JSON.stringify({ dataUrl }), {
      status:  200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status:  500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// 3. Serve main UI
function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>…</head>
<body>…</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}
