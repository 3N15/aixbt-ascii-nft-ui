document.getElementById('editTweet').onclick = async () => {
  const tweetUrl = prompt('Enter tweet URL:');
  if (!tweetUrl) return;

  const tweetId = tweetUrl.split('/').pop();
  try {
    const resp = await fetch(`/api/tweet?id=${tweetId}`);
    const data = await resp.json();
    if (resp.ok && data.data) {
      const txt = data.data.text;
      centerLine(txt.slice(0,37), 12);

      const m = data.data.public_metrics;
      const eng = `C:${m.reply_count} R:${m.retweet_count} L:${m.like_count} B:${m.quote_count}`;
      centerLine(eng, 18);

      asciiEl.innerText = lines.join('\n');
    } else {
      alert('Error loading tweet: ' + (data.error || JSON.stringify(data)));
    }
  } catch (e) {
    alert('Fetch failed: ' + e);
  }
};
