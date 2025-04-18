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

  // ensure it’s pure digits
  if (!/^\d+$/.test(id)) {
    res.status(400).json({ error: 'Invalid tweet id format' });
    return;
  }

  // cache for 60s at the edge
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  try {
    // build v2 URL
    const apiUrl = new URL(`https://api.twitter.com/2/tweets/${id}`);
    apiUrl.searchParams.set('tweet.fields', 'public_metrics,text');

    // use Node18+ built‑in fetch
    const resp = await fetch(apiUrl.toString(), {
      headers: { Authorization: `Bearer ${BEARER}` }
    });

    // handle rate limits
    if (resp.status === 429) {
      const reset = resp.headers.get('x-rate-limit-reset');
      let msg = 'Rate limit exceeded, try again later.';
      if (reset) {
        msg += ` (resets at ${new Date(+reset*1000).toLocaleTimeString()})`;
      }
      res.status(429).json({ error: msg });
      return;
    }

    const data = await resp.json();

    // if v2 returns an errors array, forward it
    if (Array.isArray(data.errors) && data.errors.length) {
      return res.status(resp.status).json({ error: data.errors[0].detail });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
