export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const params = new URLSearchParams(req.query);
  const neisUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?${params.toString()}`;

  try {
    const response = await fetch(neisUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return res.status(response.status).json({ error: 'NEIS API 오류' });
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=1800');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
