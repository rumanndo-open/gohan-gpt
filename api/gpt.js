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

  // プロンプト作成（必要に応じて調整）
  const systemPrompt = `
あなたは一人暮らしの人の「ごはん選び」を手伝うアシスタントです。
ユーザーの以下の条件に基づき、「一食完結型（主食＋主菜 or 汁物）」となる料理を10個提案してください。
出力形式は次の通りで統一してください：

### 選択肢一覧
1. ■ メニュー名
   ■ 所要時間：〇分 / 難易度：★☆☆〜★★★
   ■ 説明文（簡単な理由やおすすめポイント）

【条件】
- 気分：${mood}
- 動ける範囲：${range}
- 予算：${budget}
- 所持食材：${ingredients || "特になし"}
- ジャンル：${genre || "指定なし"}
- 栄養バランスを考慮：${healthAware ? "はい" : "いいえ"}

料理は、現実的なコスト・工程で完結するものに限ります。
外食または市販惣菜・冷凍食品でも可。どれかに偏らずバリエーションを出してください。
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
