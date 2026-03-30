export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const appPassword = process.env.APP_PASSWORD;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // 비밀번호 확인 전용 요청
  if (req.body && req.body._auth !== undefined) {
    if (!appPassword) return res.status(200).json({ _authOk: true }); // 비밀번호 미설정시 통과
    return res.status(200).json({ _authOk: req.body._auth === appPassword });
  }

  // API 키 확인
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  // 비밀번호 검증
  if (appPassword) {
    const pw = req.headers['x-app-password'];
    if (pw !== appPassword) return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
