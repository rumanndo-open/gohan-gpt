
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    const promptTemplate = fs.readFileSync(path.resolve('./api/prompt.txt'), 'utf-8');

    const prompt = promptTemplate
      .replace('{nutritionNote}', nutritionCare ? '栄養バランスも考慮した' : '')
      .replace('{mood}', mood || '指定なし')
      .replace('{range}', range || '指定なし')
      .replace('{ingredients}', ingredients || '指定なし')
      .replace('{budget}', budget || '指定なし')
      .replace('{genre}', genre || '指定なし')
      .replace('{cookingTime}', cookingTime || '指定なし')
      .replace('{allergyNote}', excludedIngredients ? `以下の食材を除外してください：${excludedIngredients}` : '');

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    res.status(200).json({
      result: chatResponse.choices[0].message.content
    });

  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({
      error: 'レシピ生成中にエラーが発生しました。',
      details: error.message
    });
  }
}
