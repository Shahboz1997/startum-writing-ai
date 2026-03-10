import axios from 'axios';

// Промпты лучше держать здесь или импортировать
const IELTS_PROMPTS = {
  'Task 1': "You are an IELTS Task 1 Expert...", 
  'Task 2': "You are an IELTS Task 2 Expert..."
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { userTask, userPrompt } = req.body;

  try {
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(401).json({ error: 'Server Configuration Error: Missing API Key' });
    }
    const baseURL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim().replace(/\/?$/, '');
    const url = baseURL.endsWith('/v1') ? `${baseURL}/chat/completions` : `${baseURL}/v1/chat/completions`;

    const systemMessage = IELTS_PROMPTS[userTask];

    const response = await axios.post(url, {
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ result: response.data.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate' });
  }
}
