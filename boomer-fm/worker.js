export default {
  async fetch(request) {
    // 1) Our API endpoints
    const apiEndpoints = {
      current:   'https://api.radioking.io/widget/radio/boomerfm-web3/track/current',
      next:      'https://api.radioking.io/widget/radio/boomerfm-web3/track/next?limit=1',
      recent:    'https://api.radioking.io/widget/radio/boomerfm-web3/track/ckoi?limit=3',
      allTracks: 'https://api.radioking.io/widget/radio/boomerfm-web3/track/top?limit=5',
    };

    // 2) Safe defaults
    let songData = {
      current:   { title: 'Unknown', artist: 'Unknown', url: null },
      next:      { title: 'Unknown', artist: 'Unknown', url: null },
      recent:    [],
      allTracks: [],
    };

    try {
      // 3) Fetch in parallel
      const [currentRes, nextRes, recentRes, allTracksRes] = await Promise.all([
        fetch(apiEndpoints.current),
        fetch(apiEndpoints.next),
        fetch(apiEndpoints.recent),
        fetch(apiEndpoints.allTracks),
      ]);

      // --- CURRENT ---
      if (currentRes.ok) {
        let d = null;
        try { d = await currentRes.json() } catch {}
        if (d?.title) songData.current = d;
      }

      // --- NEXT ---
      if (nextRes.ok) {
        let d = null;
        try { d = await nextRes.json() } catch {}
        if (Array.isArray(d) && d[0]) songData.next = d[0];
      }

      // --- RECENT ---
      if (recentRes.ok) {
        let d = null;
        try { d = await recentRes.json() } catch {}
        if (Array.isArray(d)) songData.recent = d;
      }

      // --- TOP TRACKS ---
      if (allTracksRes.ok) {
        let d = null;
        try { d = await allTracksRes.json() } catch {}
        songData.allTracks = Array.isArray(d)
          ? d
          : Array.isArray(d?.items)
            ? d.items
            : [];
      }
    } catch (e) {
      console.error('Error fetching song data:', e);
    }

    // 4) Parse M3U → MP3 URL (unchanged)
    let streamUrl = 'https://api.radioking.io/radio/736730/listen.m3u';
    try {
      const txt = await fetch(streamUrl).then(r => r.text());
      const lines = txt
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'));
      if (lines[0]) streamUrl = lines[0];
    } catch {}

    // 5) Return HTML – only things changed below are:
    //    • <button onclick="openAllTracks()">All Tracks</button> → "Top Tracks"
    //    • Download buttons → <a href=... download>
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Boomer FM Radio</title>
  <style>
    body { font-family:Arial,sans-serif; background:#1E1E2F; color:#FFF; margin:0; padding:20px; text-align:center }
    h1 { color:#FFD700; font-size:2rem; margin-bottom:10px }
    h2 { margin:0; font-size:1.2rem; color:#FFAA33 }
    p { font-size:1rem; margin:5px 0 }
    .container { display:flex; flex-direction:column; align-items:center; gap:15px }
    .box { background:#2C2C3C; border-radius:10px; padding:10px; width:80%; max-width:600px;
           box-shadow:0 4px 6px rgba(0,0,0,0.2); margin:0 auto }
    .recent { background:#33334D; border-radius:10px; padding:10px; text-align:left }
    .recent h2 { color:#FFAA33; margin-bottom:10px }
    .recent p { margin:5px 0; padding:8px; background:#44445A; border-radius:5px;
                font-size:.9rem; display:flex; justify-content:space-between; align-items:center }
    .recent p>span { flex:1; margin-right:10px; text-align:left }
    audio { width:100%; max-width:300px; border:2px solid #FFD700; border-radius:10px;
            background:#222; padding:5px; margin:10px auto }
    a.download-btn, button {
      background:#FFD700; border:none; color:#1E1E2F; padding:5px 10px; border-radius:5px;
      cursor:pointer; font-size:.8rem; margin-left:5px; text-decoration:none; display:inline-block
    }
    a.download-btn:hover, button:hover { background:#FFC700 }
    footer { margin-top:20px; font-size:.8rem; color:#AAA }
    .all-tracks-popup { position:fixed; top:0; left:0; width:100%; height:100%;
                        background:rgba(0,0,0,0.8); color:#FFF; display:flex; flex-direction:column;
                        align-items:center; justify-content:center; z-index:1000 }
    .all-tracks-popup ul { list-style:none; padding:0; max-height:80%; overflow-y:auto }
    .all-tracks-popup li { margin:5px 0 }
    .close-popup { margin-top:20px; background:red; color:#FFF; border:none; padding:10px 20px;
                   border-radius:5px; cursor:pointer }
  </style>
</head>
<body>
  <h1>Welcome to Boomer FM Radio 🎵</h1>
  <p>Your 24/7 live boomer station</p>

  <div class="container">
    <!-- Up Next -->
    <div class="box">
      <h2>Up Next</h2>
      <p>
        ${songData.next.title} - ${songData.next.artist}
        ${
          songData.next.url
            ? `<a class="download-btn" href="${songData.next.url}" download>Download</a>`
            : `<button onclick="alert('Download coming soon!')">Download</button>`
        }
      </p>
    </div>

    <!-- Now Playing -->
    <div class="box">
      <h2>Now Playing</h2>
      <p>
        ${songData.current.title} - ${songData.current.artist}
        ${
          songData.current.url
            ? `<a class="download-btn" href="${songData.current.url}" download>Download</a>`
            : `<button onclick="alert('Download coming soon!')">Download</button>`
        }
      </p>
    </div>

    <!-- Stream Player -->
    <audio controls autoplay>
      <source src="${streamUrl}" type="audio/mpeg"/>
      Your browser does not support the audio element.
    </audio>

    <!-- Top Tracks Button -->
    <button onclick="openAllTracks()">Top Tracks</button>

    <!-- Recently Played -->
    <div class="box recent">
      <h2>Recently Played</h2>
      ${songData.recent.map(song => `
        <p>
          <span>${song.title} - ${song.artist}</span>
          ${
            song.url
              ? `<a class="download-btn" href="${song.url}" download>Download</a>`
              : `<button onclick="alert('Download coming soon!')">Download</button>`
          }
        </p>
      `).join('')}
    </div>
  </div>

  <footer>
    &copy; 2025 Boomer FM. All rights reserved.<br>
    For entertainment purposes only, NFA
  </footer>

  <!-- Top Tracks Popup -->
  <div id="allTracksPopup" class="all-tracks-popup" style="display:none;">
    <h2>Top Tracks</h2>
    <ul>
      ${
        songData.allTracks.length > 0
          ? songData.allTracks.map(t => `<li>${t.title} - ${t.artist}</li>`).join('')
          : '<li>No top tracks available.</li>'
      }
    </ul>
    <button class="close-popup" onclick="closeAllTracks()">Close</button>
  </div>

  <script>
    function openAllTracks() {
      document.getElementById('allTracksPopup').style.display = 'flex';
    }
    function closeAllTracks() {
      document.getElementById('allTracksPopup').style.display = 'none';
    }
  </script>
</body>
</html>
`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  },
};
