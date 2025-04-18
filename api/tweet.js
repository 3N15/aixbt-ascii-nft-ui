// api/tweet.js
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid or missing tweet id' });
  }
  const BEARER = process.env.TWITTER_BEARER_TOKEN;
  if (!BEARER) {
    return res.status(500).json({ error: 'Bearer token not configured' });
  }

  // Edge‑cache for 60s
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  try {
    const apiUrl = new URL(`https://api.twitter.com/2/tweets/${id}`);
    apiUrl.searchParams.set('tweet.fields', 'public_metrics,text');

    const resp = await fetch(apiUrl.toString(), {
      headers: { Authorization: `Bearer ${BEARER}` }
    });

    if (resp.status === 429) {
      const reset = resp.headers.get('x-rate-limit-reset');
      let msg = 'Rate limit exceeded; try again later.';
      if (reset) {
        msg += ` (resets at ${new Date(+reset * 1000).toLocaleTimeString()})`;
      }
      return res.status(429).json({ error: msg });
    }

    const data = await resp.json();
    if (data.errors && data.errors.length) {
      return res.status(resp.status).json({ error: data.errors[0].detail });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
