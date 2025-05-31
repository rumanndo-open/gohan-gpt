import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Vercel Edge Functions 用に default export を使用
export default async function handler(req) {
  try {
    const body = await req.json();

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

    const prompt = `
あなたは料理提案アドバイザーです。以下の条件に基づいて、${nutritionNote}自炊メニューを10件提案してください。

【条件】
- 気分：${mood}
- 動ける範囲：${range}
- 所持食材：${ingredients || '指定なし'}
- 予算：${budget}
- ジャンル：${genre || '指定なし'}
- 調理可能時間：${cookingTime || '指定なし'}
- ${allergyNote}

※1食として完結すること。主食（ごはん・パン・麺など）を必ず含め、予算に余裕があれば主菜または汁物を加える。
※副菜や軽食のみ（例：味噌汁・サラダのみ）はNG。
    `;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    return new Response(JSON.stringify({
      result: chatResponse.choices[0].message.content
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('エラー:', error);
    return new Response(JSON.stringify({
      error: 'レシピ生成中にエラーが発生しました。',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
