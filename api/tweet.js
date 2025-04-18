// api/tweet.js
export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || !/^\d{10,}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid or missing tweet id' });
  }

  const BEARER = process.env.TWITTER_BEARER_TOKEN;
  if (!BEARER) {
    return res.status(500).json({ error: 'Bearer token not configured' });
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  try {
    const url = new URL(`https://api.twitter.com/2/tweets/${id}`);
    url.searchParams.set('tweet.fields', 'public_metrics,text');

    const twitterResp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${BEARER}` }
    });

    if (twitterResp.status === 429) {
      const reset = twitterResp.headers.get('x-rate-limit-reset');
      if (reset) {
        const now = Math.floor(Date.now() / 1000);
        const waitSeconds = +reset - now;
        const waitMins = Math.max(1, Math.ceil(waitSeconds / 60));
        return res.status(429).json({ error: `Rate limit exceeded; try again later (in ${waitMins} min${waitMins > 1 ? 's' : ''})` });
      } else {
        return res.status(429).json({ error: 'Rate limit exceeded; try again soon.' });
      }
    }


    const json = await twitterResp.json();

    if (!twitterResp.ok || json.errors) {
      return res.status(twitterResp.status).json({ error: json.errors?.[0]?.detail || 'Unknown Twitter API error' });
    }

    return res.status(200).json(json);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
