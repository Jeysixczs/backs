// /api/manga/[id].js
export default async function handler(req, res) {

  const { id } = req.query;
  const url = `https://api.mangadex.org/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ToonVault-Relay/1.0 (Jeysixczs)'
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: await response.text() });
    }
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}