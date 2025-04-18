// /api/tweet.js
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

  try {
    const resp = await fetch(
      `https://api.twitter.com/2/tweets/${id}?tweet.fields=public_metrics,text`,
      { headers: { Authorization: `Bearer ${BEARER}` } }
    );
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
}