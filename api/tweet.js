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

  // Validate ID is digits only
  const m = id.match(/^(\d+)$/);
  if (!m) {
    res.status(400).json({ error: 'Invalid tweet id format' });
    return;
  }
  const cleanId = m[1];

  // Tell Vercel’s edge CDN to cache for 60s, stale‑while‑revalidate up to 5m
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  try {
    // Build Twitter API URL
    const apiUrl = new URL(`https://api.twitter.com/2/tweets/${cleanId}`);
    apiUrl.searchParams.set('tweet.fields', 'public_metrics,text');

    // Use global fetch in Node 18+ (no node‑fetch import needed)
    const resp = await fetch(apiUrl.toString(), {
      headers: { Authorization: `Bearer ${BEARER}` }
    });

    // Rate‑limit handling
    if (resp.status === 429) {
      const reset = resp.headers.get('x-rate-limit-reset');
      let msg = 'Rate limit exceeded, please try again later.';
      if (reset) {
        const when = new Date(Number(reset) * 1000).toLocaleTimeString();
        msg += ` (resets at ${when})`;
      }
      res.status(429).json({ error: msg });
      return;
    }

    const data = await resp.json();

    // Surface any Twitter errors array
    if (data.errors && data.errors.length) {
      res.status(resp.status).json({ error: data.errors[0].detail });
      return;
    }

    // Finally return the tweet JSON
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
