// api/chat.js — Vercel Serverless Function
// Proxy para a API da Anthropic — usado pelo CRM CaçambaSP

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor' });
  }

  try {
    const { system, messages, model, max_tokens } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Campo messages é obrigatório' });
    }

    const payload = {
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: max_tokens || 1024,
      messages,
    };
    if (system) payload.system = system;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, data);
      return res.status(response.status).json({
        error: 'Erro na API Anthropic: ' + (data?.error?.message || JSON.stringify(data)),
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('chat.js exception:', err);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
}
