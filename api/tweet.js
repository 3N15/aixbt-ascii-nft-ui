export default async function handler(req, res) {
  const { id } = req.query;
  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid or missing tweet id' });
  }

  const BEARER = process.env.TWITTER_BEARER_TOKEN;
  if (!BEARER) {
    return res.status(500).json({ error: 'Bearer token not configured' });
  }

  // Cache response for 60 seconds
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  try {
    const apiUrl = new URL(`https://api.twitter.com/2/tweets/${id}`);
    apiUrl.searchParams.set('tweet.fields', 'public_metrics,text');

    const response = await fetch(apiUrl.toString(), {
      headers: { Authorization: `Bearer ${BEARER}` }
    });

    if (response.status === 429) {
      const reset = response.headers.get('x-rate-limit-reset');
      let msg = 'Rate limit exceeded.';
      if (reset) {
        const secondsLeft = Math.ceil((+reset * 1000 - Date.now()) / 1000);
        const minutes = Math.ceil(secondsLeft / 60);
        msg = `Rate limit exceeded; try again in ${minutes} minute(s).`;
      }
      return res.status(429).json({ error: msg });
    }

    const data = await response.json();
    if (data.errors && data.errors.length) {
      return res.status(response.status).json({ error: data.errors[0].detail });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
