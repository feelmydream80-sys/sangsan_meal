export default async function handler(req, res) {
  /* CORS 헤더 */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  /* 쿼리 파라미터 */
  const params = new URLSearchParams(req.query);
  
  /* 빈 값이나 undefined인 파라미터 제거 */
  params.forEach((value, key) => {
    if (!value || value === 'undefined' || value === 'null' || value === '') {
      params.delete(key);
    }
  });
  
  /* schoolInfo 또는 mealServiceDietInfo 판단 */
  const type = params.get('type') || '';
  let neisUrl = '';
  
  if (type === 'school' || req.url.includes('schoolInfo')) {
    /* schoolInfo API */
    params.delete('type');
    neisUrl = `https://open.neis.go.kr/hub/schoolInfo?${params.toString()}`;
  } else {
    /* mealServiceDietInfo API (기본) */
    neisUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?${params.toString()}`;
  }

  try {
    const response = await fetch(neisUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'NEIS API 오류', detail: response.statusText });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=1800'); /* 30분 캐시 */
    return res.status(200).json(data);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
