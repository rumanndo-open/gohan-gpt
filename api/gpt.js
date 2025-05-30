import { OpenAIApi, Configuration } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  const { mood, range, budget, ingredients, genre, healthAware } = req.body;

  const systemPrompt = `
あなたは一人暮らしの人に向けて、食事メニューを提案するAIアシスタントです。
以下のルールを必ず守って、現実的かつ実行しやすい提案を10個行ってください。

【共通ルール】
- 1食として完結すること。主食（ごはん・パン・麺など）＋主菜または汁物を必ず含めること。
- 副菜や軽食（味噌汁のみ、酢の物のみ、サラダのみなど）だけの提案は禁止。
- 各提案には以下の情報を含めてください：
  - ■ メニュー名（料理名または店名）
  - ■ 所要時間：○分（自炊の場合）または「目安時間」
  - ■ 難易度：★〜★★★（自炊のみ）
  - ■ 解説（疲れ・気分・条件へのマッチ理由）
- 提案は以下のフォーマットで出力すること：
  ### 選択肢一覧
  1. ■ ○○○
     ■ 所要時間：○分 / 難易度：★☆☆
     ■ ○○○○○○○○

【条件別ルール】
- 自炊時：
  - 予算500円 → 材料費ベースで家庭にある食材も活用する形で収めること
- 外食時：
  - 予算500円 → 牛丼・立ち食いそばなど現実的なワンコイン店舗のみ
  - 予算1,000円 → チェーンランチ、定食屋、ファストフードなど
- 「栄養バランスを気にする」場合：
  - タンパク質・野菜・炭水化物がバランス良く含まれる構成にすること

【入力】
- 気分: ${mood}
- 動ける範囲: ${range}
- 予算: ${budget}
- 所持食材: ${ingredients || '指定なし'}
- ジャンル: ${genre || '指定なし'}
- 栄養バランス重視: ${healthAware === true ? 'はい' : 'いいえ'}
`;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.8
    });

    const result = completion.data.choices[0].message.content;
    res.status(200).json({ result });
  } catch (err) {
    console.error('OpenAI API Error:', err);
    res.status(500).json({ error: { message: err.message } });
  }
}
