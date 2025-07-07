export default async function handler(req, res) {
  // Forward the full query string, including repeated params like includes[]
  const query = req.url.split('?')[1] || '';
  const url = `https://api.mangadex.org/manga?${query}&includes[]=cover_art`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'YourAppName/1.0'
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: await response.text() });
    }
    const data = await response.json();
    // Enable CORS for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}