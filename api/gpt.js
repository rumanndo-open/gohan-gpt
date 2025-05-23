// File: /api/gpt.js (Dynamic prompt by range/self-cook split)
// trigger redeploy for OpenAI prompt split

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

  if (range === '外で食べたい') {
    // 外食プロンプト
    prompt = `あなたは飲食店アドバイザーです。以下の条件に基づき、現実的な外食の提案をしてください：\n\n` +
      `【気分】：${mood}\n【予算】：${budget}\n【ジャンル】：${genre || '指定なし'}\n` +
      `\n【指示】：\n・500円以下でラーメンなど非現実的な提案は避ける\n・全国チェーンや定番の業態でコスパ・満足度重視の提案を\n\n【出力形式】：\n■ 提案タイプ（外食）\n■ 店名 / メニュー名\n■ 所要時間（目安）\n■ 理由\n■ アドバイス`;
  } else {
    // 自炊プロンプト
    prompt = `あなたは家庭料理のアドバイザーです。以下の条件に基づき、疲れていても作れる自炊メニューを提案してください：\n\n` +
      `【気分】：${mood}\n【予算】：${budget}\n【所持食材】：${ingredients || '特になし'}\n【ジャンル】：${genre || '指定なし'}\n` +
      `\n【指示】：\n・調理時間15分以内\n・洗い物が少なく簡単に作れること\n・指定された食材内で作れる料理を\n\n【出力形式】：\n■ 提案タイプ（自炊）\n■ メニュー名\n■ 所要時間 / 難易度\n■ 調理手順（簡潔に）\n■ 理由\n■ アドバイス`;
  }

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
