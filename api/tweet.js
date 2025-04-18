// api/tweet.js
import fetch from 'node-fetch';

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

  // sanitize to digits only
  const cleanIdMatch = id.match(/^(\d+)$/);
  if (!cleanIdMatch) {
    res.status(400).json({ error: 'Invalid tweet id format' });
    return;
  }
  const cleanId = cleanIdMatch[1];

  try {
    // build URL with proper encoding
    const apiUrl = new URL(`https://api.twitter.com/2/tweets/${cleanId}`);
    apiUrl.searchParams.set('tweet.fields', 'public_metrics,text');

    const resp = await fetch(apiUrl.toString(), {
      headers: { Authorization: `Bearer ${BEARER}` }
    });

    const data = await resp.json();

    // if Twitter returned an errors array, surface the first detail
    if (data.errors && data.errors.length) {
      res.status(resp.status).json({ error: data.errors[0].detail });
      return;
    }

    res.status(resp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}