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
  
  /* schoolInfo 또는 mealServiceDietInfo 판단 */
  const type = params.get('type') || '';
  let neisUrl = '';
  
  /* 빈 값 파라미터 제거 (forEach 대신 filter 사용) */
  const filteredParams = new URLSearchParams();
  params.forEach((value, key) => {
    if (key === 'type') return; /* type은 NEIS로 전송하지 않음 */
    if (value && value.trim() && value !== 'undefined' && value !== 'null') {
      filteredParams.append(key, value);
    }
  });
  
  if (type === 'school') {
    /* schoolInfo API */
    neisUrl = `https://open.neis.go.kr/hub/schoolInfo?${filteredParams.toString()}`;
  } else {
    /* mealServiceDietInfo API (기본) */
    neisUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?${filteredParams.toString()}`;
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