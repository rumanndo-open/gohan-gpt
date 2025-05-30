// api/gpt.js
const OpenAI = require("openai").default;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const { mood, range, budget, ingredients, genre, nutrition } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: { message: "OpenAI API key not configured." } });
  }

  const configuration = new OpenAI.Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAI.OpenAIApi(configuration);

  try {
    const systemMessage = `あなたは一人暮らし向けの食事提案アシスタントです。以下の条件をもとに、自炊メニューを10個提示してください。
- 各メニューは主食と主菜、または主食と汁物が揃って一食として完結する構成にしてください。
- メニュー名、調理時間（例：15分）、難易度（★〜★★★）、説明を含めてください。
- 出力フォーマットは以下を参考に整えてください。
  1. ■ メニュー名
     ■ 所要時間：○分 / 難易度：★☆☆
     ■ 説明
${nutrition === true ? "また、栄養バランスにも配慮してください。" : ""}`;

    const userMessage = `気分: ${mood}, 範囲: ${range}, 予算: ${budget}, 食材: ${ingredients}, ジャンル: ${genre}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.8,
    });

    const result = completion.data.choices[0].message.content;
    res.status(200).json({ result });
  } catch (error) {
    console.error("OpenAI fetch failed:", error);
    res.status(500).json({
      error: {
        message: error.message || "An error occurred during your request.",
      },
    });
  }
};
