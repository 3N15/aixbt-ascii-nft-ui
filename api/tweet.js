// /api/tweet.js
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id || !/^[0-9]{5,}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid or missing tweet id' });
  }

  const BEARER = process.env.TWITTER_BEARER_TOKEN;
  if (!BEARER) {
    return res.status(500).json({ error: 'Bearer token not configured' });
  }

  // TEMP: Disable caching for debug
  res.setHeader('Cache-Control', 'no-store');

  try {
    const apiUrl = new URL(`https://api.twitter.com/2/tweets/${id}`);
    apiUrl.searchParams.set('tweet.fields', 'public_metrics,text');

    const resp = await fetch(apiUrl.toString(), {
      headers: { Authorization: `Bearer ${BEARER}` }
    });

    const headers = Object.fromEntries(resp.headers.entries());
    const body = await resp.text();

    console.log('DEBUG: Response status:', resp.status);
    console.log('DEBUG: Response headers:', headers);
    console.log('DEBUG: Response body:', body);

    if (resp.status === 429) {
      const reset = resp.headers.get('x-rate-limit-reset');
      let msg = 'Rate limit exceeded; try again later.';
      if (reset) {
        const resetTime = new Date(parseInt(reset, 10) * 1000).toLocaleTimeString();
        msg += ` (resets at ${resetTime})`;
      }
      return res.status(429).json({ error: msg, debug: headers });
    }

    const json = JSON.parse(body);
    if (json.errors && json.errors.length) {
      return res.status(resp.status).json({ error: json.errors[0].detail || 'Unknown Twitter API error', debug: headers });
    }

    return res.status(200).json(json);

  } catch (err) {
    console.error('DEBUG: Unexpected error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
