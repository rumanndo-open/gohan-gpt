import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    mood,
    range,
    budget,
    ingredients,
    genre,
    prompt
  } = req.body;

  let finalPrompt = '';

  // ❶ 直接 prompt 指定があれば優先（レシピ詳細生成用）
  if (prompt) {
    finalPrompt = prompt;
  } else {
    // ❷ 通常の自炊／外食提案プロンプトを構築
    if (range === '外で食べたい') {
      finalPrompt = `あなたは飲食店アドバイザーです。以下の条件に基づき、現実的で実行可能な「外食」の提案をしてください。

【条件】
- 気分：${mood}
- 予算：${budget}
- エリア情報：不明（全国チェーンを想定）

【指示】
- 非現実的な価格設定（例：500円でラーメン）を避けてください。
- 実際に全国チェーンなどで注文できそうな食事と店舗名を提案してください。
- 移動や価格を考慮し、手軽さ・満足度を重視してください。

【出力形式】
■ 提案タイプ（外食）
■ 店名 / メニュー名
■ 所要時間（目安）
■ 理由
■ アドバイス`;
    } else {
      finalPrompt = `あなたは料理提案アドバイザーです。以下の条件に基づき、冷蔵庫にありそうな素材を活かした簡単な自炊メニューを10件提案してください。

【条件】
- 気分：${mood}
- 動ける範囲：${range}
- 所持食材：${ingredients || '指定なし'}
- 予算：${budget}
- ジャンル：${genre || '指定なし'}

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
