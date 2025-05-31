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

  if (!people || !mood || !budget || !cookingTime) {
    return res.status(400).json({ error: '必須項目が不足しています。' });
  }

  const optionalLines = [];
  if (genre) optionalLines.push(`- 希望ジャンル：${genre}`);
  if (nutritionCare === 'on') optionalLines.push(`- 栄養バランスを考慮`);
  if (hasAllergy === 'on' && excludedIngredients)
    optionalLines.push(`- 除外したい食材：${excludedIngredients}`);
  if (Array.isArray(tools) && tools.length > 0)
    optionalLines.push(`- 利用可能な調理器具：${tools.join('、')}`);
  if (ingredients) optionalLines.push(`- 消費したい食材：${ingredients}`);

  const isSnack = mood === 'お酒に合う';
  const fixedGuidelines = isSnack
    ? ''
    : `\n- 1食として完結したメニューであること。\n- 必ず「主食（ごはん・パン・麺など）」を含めること。\n- 主食を含まないメニュー（例：ポテトサラダ、きんぴらごぼう、サラダ、スープなど単体の副菜・汁物）は絶対に提案しないこと。\n- 主食＋副菜、主食＋汁物などのように、主食がメインとなる構成で提案すること。`;

  const prompt = `あなたは料理提案アドバイザーです。以下の条件に基づいて、ユーザーがすぐに作れるようなレシピを10件提案してください。

【条件】
- 人数：${people}人分
- 気分：${mood}
- 予算：${budget}円以内
- 調理可能時間：${cookingTime === 'unlimited' ? '制限なし' : `${cookingTime}分以内`}
${optionalLines.length > 0 ? optionalLines.join('\n') : ''}
${fixedGuidelines}

【出力形式】
HTMLで整形し、次のように出力してください：
<h2>おすすめメニュー</h2>
<ol>
  <li>
    <details>
      <summary><strong>メニュー名</strong></summary>
      <p><strong>材料：</strong><br>材料一覧（箇条書き）</p>
      <p><strong>手順：</strong><br>手順（番号付き）</p>
    </details>
  </li>
  ...（以下略）
</ol>

CSSで各メニューをタイル形式（カード風）に表示するには、以下のようなHTML構造にしてください：
<div class="menu-grid">
  <div class="menu-card">
    <h3>メニュー名</h3>
    <p><strong>材料：</strong><br>材料一覧</p>
    <p><strong>手順：</strong><br>番号付き手順</p>
  </div>
  ...（繰り返し）
</div>

CSSも併せて整形してください。

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'あなたは優秀な料理メニューアドバイザーです。' },
        { role: 'user', content: prompt }
      ],
      model: 'gpt-4'
    });

    const response = chatCompletion.choices?.[0]?.message?.content;
    if (!response || response.trim() === '') {
      return res.status(200).json({ result: '' });
    }
    res.status(200).json({ result: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'API呼び出しに失敗しました。' });
  }
}
  }

