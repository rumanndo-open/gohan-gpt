// File: /api/gpt.js (Improved error logging and response check)
// trigger redeploy for OpenAI quota reset

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const { prompt } = body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();
    console.log("OpenAI response:", JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'OpenAI returned no choices', fullResponse: data });
    }

    res.status(200).json({ result: data.choices[0].message.content });
  } catch (err) {
    console.error('OpenAI fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch from OpenAI', details: err.message });
  }
}
