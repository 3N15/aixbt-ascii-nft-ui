document.getElementById('editTweet').addEventListener('click', async () => {
  const tweetUrl = prompt('Enter tweet URL:');
  if (!tweetUrl) return;

  // 1) Extract only the digits after '/status/'
  const match = tweetUrl.match(/status\/(\d+)/);
  if (!match) {
    alert('Invalid tweet URL – expected a link containing "/status/<tweet_id>".');
    return;
  }
  const tweetId = match[1];

  try {
    // 2) Fetch via your own API route
    const resp = await fetch(`/api/tweet?id=${tweetId}`);
    const json = await resp.json();
    if (!resp.ok || !json.data) {
      throw new Error(json.error || JSON.stringify(json));
    }

    // 3) Update ASCII lines as before
    const lines = asciiEl.textContent.split('\n');
    centerLine(json.data.text.slice(0,37), 12, lines);
    const m = json.data.public_metrics;
    centerLine(
      `C:${m.reply_count} R:${m.retweet_count} L:${m.like_count} B:${m.quote_count}`,
      18, lines
    );
    asciiEl.textContent = lines.join('\n');
  } catch (err) {
    alert('Fetch error: ' + err.message);
  }
});