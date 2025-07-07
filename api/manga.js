export default async function handler(req, res) {
  // For Vercel, req.url is like /api/manga?...
  const params = req.url.split('?')[1] || '';
  const url = `https://api.mangadex.org/manga?${params}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // User-Agent for compliance (optional but recommended)
        'User-Agent': 'ToonVault-Relay/1.0 (Jeysixczs)'
      }
    });
    if (!response.ok) {
      // Forward MangaDex error status and body
      return res.status(response.status).json({ error: await response.text() });
    }
    const data = await response.json();
    // Allow CORS for frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}