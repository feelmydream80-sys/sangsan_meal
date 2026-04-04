export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const params = new URLSearchParams(req.query);
    const neisUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?${params.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(neisUrl, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!response.ok) {
      return res.status(response.status).json({ error: `NEIS 오류: ${response.status}` });
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      return res.status(500).json({ error: 'JSON 파싱 실패', raw: text.slice(0, 200) });
    }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (e) {
    return res.status(500).json({ error: e.message || '알 수 없는 오류' });
  }
}
