export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const { messages, system, salvar, cidade, pedido_fechado } = req.body;

  /* ── Salvar conversa no Supabase ── */
  if (salvar && messages) {
    try {
      const { conversa_id, whatsapp, nome } = req.body;
      const payload = {
        mensagens: messages,
        cidade: cidade || null,
        pedido_fechado: pedido_fechado || false,
        whatsapp: whatsapp || null,
        nome: nome || null
      };

      if (conversa_id) {
        /* Upsert — atualiza se já existe, cria se não existe */
        payload.id = conversa_id;
        await fetch(`${process.env.SUPABASE_URL}/rest/v1/juca_conversas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${process.env.SUPABASE_URL}/rest/v1/juca_conversas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload)
        });
      }
    } catch(e) {
      console.error('Erro ao salvar conversa:', e);
    }
    return res.status(200).json({ ok: true });
  }

  /* ── Chamar Claude ── */
  if (!messages || !system) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        system,
        messages
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
}
