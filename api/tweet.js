document.getElementById('editTweet').onclick = async function () {
  const raw = prompt('Paste tweet URL:');
  if (!raw) return;

  // ⏱️ Debounce: prevent back-to-back API hits
  if (window.__lastTweetFetch && Date.now() - window.__lastTweetFetch < 5000) {
    alert('Slow down, try again in a few seconds.');
    return;
  }
  window.__lastTweetFetch = Date.now();

  // 🧠 Cache: reuse previous lookups in browser
  window.__tweetCache = window.__tweetCache || {};
  let tweetId = null;

  // 🔍 Extract tweet ID
  try {
    const u = new URL(raw);
    const seg = u.pathname.split('/').filter(Boolean);
    const idx = seg.indexOf('status');
    if (idx >= 0 && seg[idx + 1]) tweetId = seg[idx + 1];
  } catch (e) {}

  if (!tweetId) {
    const nums = raw.match(/\d+/g) || [];
    tweetId = nums.find(n => n.length > 10) || nums[0];
  }

  if (!tweetId) return alert('Could not extract tweet ID.');

  // 🤖 Check cache first
  if (window.__tweetCache[tweetId]) {
    renderTweet(window.__tweetCache[tweetId]);
    return;
  }

  // 📡 Fetch from API
  try {
    const res = await fetch(`/api/tweet?id=${tweetId}`);
    const data = await res.json();

    if (res.status === 429) {
      alert(data.error || 'Rate limited. Try again later.');
      return;
    }

    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    // 🧠 Save in cache
    window.__tweetCache[tweetId] = data;
    renderTweet(data);
  } catch (err) {
    alert('Failed to fetch tweet: ' + err.message);
  }
};

// 🖼️ Renders data to ASCII card
function renderTweet(data) {
  const lines = document.getElementById('ascii').textContent.split('\n');
  const txt = data.data.text || '';

  const pm = data.data.public_metrics || {
    reply_count: 0,
    retweet_count: 0,
    like_count: 0,
    quote_count: 0
  };

  function centerLine(text, idx) {
    const width = lines[idx].length - 2;
    const pad = width - text.length;
    const left = Math.floor(pad / 2);
    const right = pad - left;
    lines[idx] = '|' + ' '.repeat(left) + text + ' '.repeat(right) + '|';
  }

  centerLine(txt.slice(0, 37), 12);
  centerLine(
    `C:${pm.reply_count} R:${pm.retweet_count} L:${pm.like_count} B:${pm.quote_count}`,
    18
  );

  document.getElementById('ascii').textContent = lines.join('\n');
}
