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
  
  /* 빈 값 파라미터 제거 */
  const filteredParams = new URLSearchParams();
  params.forEach((value, key) => {
    if (key === 'type') return;
    if (value && value.trim() && value !== 'undefined' && value !== 'null') {
      filteredParams.append(key, value);
    }
  });
  
  /* NEIS API URL 생성 */
  const endpoint = type === 'school' ? 'schoolInfo' : 'mealServiceDietInfo';
  const neisUrl = `https://open.neis.go.kr/hub/${endpoint}?${filteredParams.toString()}`;
  
  console.log('[DEBUG] NEIS URL:', neisUrl);
  
  try {
    const response = await fetch(neisUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });

    const status = response.status;
    const text = await response.text();
    
    console.log('[DEBUG] NEIS Status:', status);
    console.log('[DEBUG] NEIS Response:', text.substring(0, 500));
    
    if (!response.ok) {
      return res.status(status).json({ error: 'NEIS API 오류', detail: text });
    }

    const data = JSON.parse(text);
    res.setHeader('Cache-Control', 's-maxage=1800');
    return res.status(200).json(data);

  } catch (e) {
    console.log('[DEBUG] Error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}