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

  // Ensure id is only digits
  const match = id.match(/^(\d+)$/);
  if (!match) {
    res.status(400).json({ error: 'Invalid tweet id format' });
    return;
  }
  const cleanId = match[1];

  try {
    // Build the Twitter API URL
    const apiUrl = new URL(`https://api.twitter.com/2/tweets/${cleanId}`);
    apiUrl.searchParams.set('tweet.fields', 'public_metrics,text');

    // Use the global fetch
    const resp = await fetch(apiUrl.toString(), {
      headers: { Authorization: `Bearer ${BEARER}` }
    });
    const data = await resp.json();

    // Surface any Twitter errors
    if (data.errors && data.errors.length) {
      res.status(resp.status).json({ error: data.errors[0].detail });
      return;
    }

    res.status(resp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
