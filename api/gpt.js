import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();
    const body = JSON.parse(rawBody);

    const {
      mood,
      range,
      ingredients,
      budget,
      genre,
      nutritionCare,
      excludedIngredients,
      cookingTime
    } = body;

    const nutritionNote = nutritionCare ? '栄養バランスも考慮した' : '';
    const allergyNote = excludedIngredients
      ? `以下の食材を除外してください：${excludedIngredients}`
      : '';

    const prompt =
      "あなたは料理提案アドバイザーです。以下の条件に基づいて、" + nutritionNote + "自炊メニューを10件提案してください。\\n\\n" +
      "【条件】\\n" +
      "- 気分：" + mood + "\\n" +
      "- 動ける範囲：" + range + "\\n" +
      "- 所持食材：" + (ingredients || '指定なし') + "\\n" +
      "- 予算：" + budget + "\\n" +
      "- ジャンル：" + (genre || '指定なし') + "\\n" +
      "- 調理可能時間：" + (cookingTime || '指定なし') + "\\n" +
      "- " + allergyNote + "\\n\\n" +
      "※1食として完結すること。主食（ごはん・パン・麺など）を必ず含め、予算に余裕があれば主菜や汁物を追加してください。\\n" +
      "※副菜だけのメニュー（例：味噌汁だけ、サラダだけ）はNGです。\\n\\n" +
      "※出力形式は以下の通りで、JSON配列のみを返してください。説明文やコメント、コードブロック（```jsonなど）は不要です。\\n\\n" +
      "[" +
      "{\\"title\\":\\"メニュー名\\",\\"description\\":\\"簡潔な説明文（1文）\\",\\"time\\":\\"約10分\\",\\"difficulty\\":\\"★★\\"}," +
      "{...}" +
      "]";

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      result: chatResponse.choices[0].message.content
    }));

  } catch (error) {
    console.error('エラー:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'レシピ生成中にエラーが発生しました。',
      details: error.message
    }));
  }
}
