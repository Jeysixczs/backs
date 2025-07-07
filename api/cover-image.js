// /api/cover-image.js
export default async function handler(req, res) {
  const { url } = req.query;
  try {
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://mangadex.org/',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    if (!response.ok) {
      return res.status(response.status).end();
    }
    res.setHeader('Content-Type', response.headers.get('Content-Type'));
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.body.pipe(res);
  } catch (e) {
    res.status(500).end();
  }
}