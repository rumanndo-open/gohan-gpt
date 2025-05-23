// File: /api/gpt.js (Dynamic prompt with 10-option self-cook mode only)
// trigger redeploy for refined self-cook options

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const { mood, range, budget, ingredients, genre } = body;

  if (!mood || !range || !budget) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let prompt = '';

  // 自炊プロンプト（選択肢10個、後で選択して展開）
  prompt = `あなたは家庭料理のアドバイザーです。以下の条件に基づき、ユーザーが選べるように簡単な自炊メニューを10個提示してください：\n\n` +
    `【気分】：${mood}\n【予算】：${budget}\n【所持食材】：${ingredients || '特になし'}\n【ジャンル】：${genre || '指定なし'}\n` +
    `\n【指示】：\n・各提案は15分以内で調理可能なものにしてください。\n・調理工程がシンプルで疲れていても対応できる内容を選んでください。\n・各提案には以下の情報を含めてください：\n  - メニュー名\n  - 所要時間\n  - 難易度（★〜★★★）\n  - 概要（どんな料理かの説明）\n\n【出力形式】：\n### 選択肢一覧\n1. ■ メニュー名\n   ■ 所要時間 / 難易度\n   ■ 概要\n...（10個）`;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();
    console.log("OpenAI response:", JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'OpenAI returned no choices', fullResponse: data });
    }

    res.status(200).json({ result: data.choices[0].message.content });
  } catch (err) {
    console.error('OpenAI fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch from OpenAI', details: err.message });
  }
}
