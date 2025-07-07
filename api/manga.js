export default async function handler(req, res) {
  const params = req.url.split('?')[1] || '';
  const url = `https://api.mangadex.org/manga?${params}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ToonVault-Relay/1.0 (Jeysixczs)'
      }
    });
    if (!response.ok) {
     res.status(200).json({ status: "ok", message: "Manga endpoint is working." });
    }
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
