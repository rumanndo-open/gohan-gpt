import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    people,
    mood,
    budget,
    cookingTime,
    genre,
    nutritionCare,
    hasAllergy,
    excludedIngredients,
    tools,
    ingredients
  } = req.body;

  // 必須バリデーション
  if (!people || !mood || !budget || !cookingTime) {
    return res.status(400).json({ error: '必須項目が不足しています。' });
  }

  // 任意条件の文言構築
  const optionalLines = [];
  if (genre) optionalLines.push(`- 希望ジャンル：${genre}`);
  if (nutritionCare === 'on') optionalLines.push(`- 栄養バランスを考慮`);
  if (hasAllergy === 'on' && excludedIngredients)
    optionalLines.push(`- 除外したい食材：${excludedIngredients}`);
  if (Array.isArray(tools) && tools.length > 0)
    optionalLines.push(`- 利用可能な調理器具：${tools.join('、')}`);
  if (ingredients) optionalLines.push(`- 消費したい食材：${ingredients}`);

  const prompt = `あなたは料理提案アドバイザーです。以下の条件に基づいて、自炊メニューを10件提案してください。

【条件】
- 人数：${people}人分
- 気分：${mood}
- 予算：${budget}円以内
- 調理可能時間：${cookingTime === 'unlimited' ? '制限なし' : `${cookingTime}分以内`}
${optionalLines.length > 0 ? optionalLines.join('\n') : ''}
※すべて1食として完結する料理とし、主食（ごはん・パン・麺など）を必ず含めてください。`;

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'あなたは優秀な料理メニューアドバイザーです。' },
        { role: 'user', content: prompt }
      ],
      model: 'gpt-4'
    });

    const response = chatCompletion.choices[0]?.message?.content || '提案が生成できませんでした。';
    res.status(200).json({ result: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'API呼び出しに失敗しました。' });
  }
}
