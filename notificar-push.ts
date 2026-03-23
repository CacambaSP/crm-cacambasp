// Edge Function: notificar-push
// Deploy: supabase functions deploy notificar-push
// Chamada pelo cadastro.html após criar ordem/orçamento

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ONESIGNAL_APP_ID  = 'c2dbdd20-6f19-433f-8106-f45d3e37714d';
const ONESIGNAL_API_KEY = 'os_v2_app_yln52idpdfbt7aig6rot4n3rjxvninjm5hiueg4gosxgw3cenxwybzz4ki7s3wszgqnsg4hctpuxvfoy3ca25dwancydpu6gi2uzdmi';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }});
  }

  try {
    const body = await req.json();
    const { tipo, ordem_id, crm_id, nome_cliente, bairro, usuario_id } = body;
    // tipo: 'nova_ordem' | 'novo_orcamento'

    if (!tipo) return json({ error: 'tipo obrigatório' }, 400);

    const sb = createClient(SUPA_URL, SUPA_KEY);

    // Busca todos os perfis ativos para pegar os external_ids OneSignal
    // Admins recebem tudo; operadores recebem só os seus
    const { data: perfis } = await sb
      .from('perfis')
      .select('id, nome, nivel, onesignal_id')
      .eq('ativo', true);

    if (!perfis || !perfis.length) {
      return json({ ok: true, enviados: 0, motivo: 'sem perfis' });
    }

    // Monta lista de destinatários
    // - admins recebem sempre
    // - operador dono da ordem recebe também
    const destinatarios = perfis.filter(p => {
      if (p.nivel === 'admin') return true;
      if (usuario_id && p.id === usuario_id) return true;
      return false;
    });

    // Filtra quem tem onesignal_id cadastrado
    const comId = destinatarios.filter(p => p.onesignal_id);

    if (!comId.length) {
      return json({ ok: true, enviados: 0, motivo: 'nenhum destinatário com onesignal_id' });
    }

    // Monta mensagem
    const isOrc = tipo === 'novo_orcamento';
    const title = isOrc ? '💰 Novo orçamento' : '🚛 Nova ordem de serviço';
    const clienteStr = nome_cliente ? nome_cliente.split(' ')[0] : 'Cliente';
    const bairroStr  = bairro ? ' · ' + bairro : '';
    const body_msg   = `${clienteStr}${bairroStr}${crm_id ? ' — ' + crm_id : ''}`;
    const url        = 'https://cacambasp-crm.vercel.app/';

    // Dispara para cada destinatário via OneSignal REST API
    let enviados = 0;
    for (const p of comId) {
      const payload = {
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [p.onesignal_id] },
        target_channel: 'push',
        headings: { en: title, pt: title },
        contents: { en: body_msg, pt: body_msg },
        url,
        chrome_web_icon: 'https://cacambasp-crm.vercel.app/icon-192.png',
        firefox_icon:    'https://cacambasp-crm.vercel.app/icon-192.png',
        data: { tipo, ordem_id, crm_id },
      };

      const res = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${ONESIGNAL_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) enviados++;
    }

    return json({ ok: true, enviados, total: comId.length });

  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
