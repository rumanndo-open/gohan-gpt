const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Method not allowed" } });
    return;
  }

  const { mood, range, budget, ingredients, genre, healthAware } = req.body;

  const systemPrompt = `
あなたは一人暮らしの人の「ごはん選び」を手伝うアシスタントです。
ユーザーの以下の条件に基づき、一食完結型（主食＋主菜 or 汁物）となる料理を10個提案してください。

【条件】
- 気分：${mood}
- 動ける範囲：${range}
- 予算：${budget}
- 所持食材：${ingredients || "なし"}
- ジャンル：${genre || "特になし"}
- 栄養バランスを考慮：${healthAware ? "はい" : "いいえ"}

出力形式は以下で統一：
### 選択肢一覧
1. ■ メニュー名
   ■ 所要時間：○分 / 難易度：★☆☆〜★★★
   ■ 説明文（理由・おすすめポイント）
`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.8,
    });

    const result = completion.data.choices[0].message.content;
    res.status(200).json({ result });
  } catch (err) {
    console.error("OpenAI API Error:", err);
    res.status(500).json({ error: { message: err.message } });
  }
};
