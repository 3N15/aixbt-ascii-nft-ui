// api/tweet.js
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: 'Missing tweet id' });
    return;
  }

  const BEARER = process.env.TWITTER_BEARER_TOKEN;
  if (!BEARER) {
    res.status(500).json({ error: 'Bearer token not configured' });
    return;
  }

  // ensure digits only
  const m = id.match(/^(\d+)$/);
  if (!m) {
    res.status(400).json({ error: 'Invalid tweet id format' });
    return;
  }
  const cleanId = m[1];

  try {
    // build URL
    const apiUrl = new URL(`https://api.twitter.com/2/tweets/${cleanId}`);
    apiUrl.searchParams.set('tweet.fields', 'public_metrics,text');

    const resp = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${BEARER}` }
    });

    // rate limit?
    if (resp.status === 429) {
      const reset = resp.headers.get('x-rate-limit-reset');
      let msg = 'Rate limit exceeded, please try again later.';
      if (reset) {
        const resetDate = new Date(reset * 1000);
        msg += ` (resets at ${resetDate.toLocaleTimeString()})`;
      }
      res.status(429).json({ error: msg });
      return;
    }

    const data = await resp.json();

    if (data.errors && data.errors.length) {
      res.status(resp.status).json({ error: data.errors[0].detail });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
