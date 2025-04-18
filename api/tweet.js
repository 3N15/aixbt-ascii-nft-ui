document.getElementById('editTweet').onclick = async () => {
  const raw = prompt('Paste full tweet URL:');
  if (!raw) return;

  let tweetId = null;

  try {
    const u = new URL(raw);
    const seg = u.pathname.split('/').filter(Boolean);
    const idx = seg.indexOf('status');
    if (idx >= 0 && seg[idx + 1]) tweetId = seg[idx + 1];
  } catch {}
  if (!tweetId) {
    const nums = raw.match(/\d+/g) || [];
    tweetId = nums.find(n => n.length > 10) || nums[0];
  }
  if (!tweetId) {
    alert('Cannot extract tweet ID.');
    return;
  }

  try {
    const resp = await fetch(`/api/tweet?id=${tweetId}`);
    const js = await resp.json();

    if (resp.status === 429) {
      alert(js.error);
      return;
    }
    if (!resp.ok) throw new Error(js.error || `HTTP ${resp.status}`);

    const tweetText = js.data.text;
    const pm = js.data.public_metrics;

    const lines = getLines();

    // Clear and insert tweet text into rows 12–16
    for (let i = 12; i <= 16; i++) {
      lines[i] = '|                                    |'; // reset
    }

    const contentLines = tweetText.match(/.{1,36}/g) || [];
    for (let i = 0; i < Math.min(5, contentLines.length); i++) {
      const text = contentLines[i];
      const pad = 36 - text.length;
      lines[12 + i] = `|${text}${' '.repeat(pad)}|`;
    }

    // Format metrics and center them on line 18
    const metrics = `C:${pm.reply_count}  R:${pm.retweet_count}  L:${pm.like_count}  B:${pm.quote_count}`;
    const pad = 36 - metrics.length;
    const lpad = Math.floor(pad / 2), rpad = pad - lpad;
    lines[18] = '|' + ' '.repeat(lpad) + metrics + ' '.repeat(rpad) + '|';

    updateLines(lines);

  } catch (err) {
    alert('Error fetching tweet: ' + err.message);
  }
};
