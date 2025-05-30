import { OpenAI } from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mood, range, budget, ingredients, genre, nutrition, prompt } = req.body;
  let finalPrompt = '';

  if (prompt) {
    finalPrompt = prompt;
  } else {
    const nutritionNote = nutrition ? '栄養バランスを考慮した' : 'シンプルで家庭で作りやすい';

    if (range === '外で食べたい') {
      finalPrompt = `あなたは飲食店アドバイザーです。以下の条件に基づき、${nutritionNote}外食メニューを提案してください。

【条件】
- 気分：${mood}
- 予算：${budget}
- エリア情報：不明（全国チェーンを想定）

【指示】
- 実際に注文できる全国チェーンのメニューを前提
- ${nutrition ? '主食・主菜・副菜のバランスを考えた構成にしてください。' : '手軽さやコスパを重視してください。'}

【出力形式】
■ 提案タイプ（外食）
■ 店名 / メニュー名
■ 所要時間（目安）
■ 理由
■ アドバイス`;
    } else {
      finalPrompt = `あなたは料理提案アドバイザーです。以下の条件に基づいて、${nutritionNote}自炊メニューを10件提案してください。

【条件】
- 気分：${mood}
- 動ける範囲：${range}
- 所持食材：${ingredients || '指定なし'}
- 予算：${budget}
- ジャンル：${genre || '指定なし'}
- 1食として完結すること。主食（ごはん・パン・麺など）を必ず含め,予算の余裕があれば主菜または汁物を合わせて提案すること。
- 副菜や軽食（味噌汁のみ、酢の物のみ、サラダのみなど）だけの提案は禁止。

【指示】
- ${nutrition ? '栄養バランス（主食・主菜・副菜）を意識し、野菜を適度に含めてください。' : 'とにかく簡単で作りやすいものを中心にしてください。'}

【出力形式】
### 選択肢一覧
1. ■ メニュー名
   ■ 所要時間：●分 / 難易度：★〜★★★
   ■ 説明：...

（10個）`;
    }
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: finalPrompt }]
    });

    const reply = chatCompletion.choices?.[0]?.message?.content;
    res.status(200).json({ result: reply });
  } catch (error) {
    console.error('OpenAI fetch failed:', error);
    res.status(500).json({
      error: {
        message: error?.message || 'Unknown error',
      }
    });
  }
}
