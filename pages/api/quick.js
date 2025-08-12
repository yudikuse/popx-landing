// pages/api/quick.js
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

function slugify(text) {
  return (text || '')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 60);
}

function parseExpires(expires) {
  // Aceita ISO (2025-08-31T23:59) ou duração tipo "24h"
  if (!expires) {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    return d.toISOString();
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(expires)) return new Date(expires).toISOString();
  const match = /^(\d+)\s*h$/.exec(expires.trim());
  if (match) {
    const d = new Date();
    d.setHours(d.getHours() + Number(match[1]));
    return d.toISOString();
  }
  return new Date(expires).toISOString();
}

export default async function handler(req, res) {
  try {
    const { title, price, whatsapp, desc, expires, image_url } = req.query;

    if (!title || !price || !whatsapp) {
      return res.status(400).json({ ok: false, error: 'Missing required params' });
    }

    const ad = {
      title: String(title).trim(),
      price: Number(price),
      whatsapp: String(whatsapp).trim(),
      description: (desc || '').toString().trim(),
      expires_at: parseExpires(expires),
      published: true,
      image_url: image_url || '/og-fallback.png',
      slug: `${slugify(title)}-${Date.now().toString().slice(-6)}`,
    };

    const { data, error } = await supabase.from('ads').insert(ad).select().single();
    if (error) throw error;

    // Redireciona direto para a landing final
    res.setHeader('Location', `/a/${data.slug}`);
    res.statusCode = 302;
    res.end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
