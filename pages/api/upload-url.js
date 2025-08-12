// pages/api/upload-url.js
export const config = { api: { bodyParser: true } };

import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { slug, contentType } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!slug || !contentType) {
      return res.status(400).json({ ok: false, error: 'Missing slug or contentType' });
    }

    const ext = (contentType.split('/')[1] || 'jpg').toLowerCase(); // ex.: image/jpeg -> jpg
    const path = `${slug}/${Date.now()}.${ext}`;

    // url assinada para upload
    const { data, error } = await supabaseAdmin
      .storage.from('ad-images')
      .createSignedUploadUrl(path, 60); // 60s para subir

    if (error) throw error;

    // url pública que usaremos na landing
    const { data: pub } = supabaseAdmin.storage.from('ad-images').getPublicUrl(path);

    return res.json({
      ok: true,
      token: data.token,   // token do upload
      path,                // caminho do arquivo no bucket
      publicUrl: pub.publicUrl
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
