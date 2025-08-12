import { useEffect, useState } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';

function toSlug(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50);
}

export default function Bridge() {
  // Prefill vindo do Figma via URL, ex: .../bridge?title=Bolo&price=39
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    setTitle(qs.get('title') || '');
    setPrice(qs.get('price') || '');
    setWhatsapp(qs.get('whatsapp') || '');
    setDescription(qs.get('desc') || '');
    // expiração padrão (ex.: +24h)
    const defaultExp = new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,16);
    setExpiresAt(qs.get('expires') || defaultExp);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title || !price || !whatsapp || !file) {
      setError('Preencha título, preço, WhatsApp e selecione uma imagem.');
      return;
    }
    setBusy(true);
    try {
      // 1) upload imagem no Storage (bucket: ads-images, pasta: public/)
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${toSlug(title)}.${fileExt}`;
      const storagePath = `public/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from('ads-images')
        .upload(storagePath, file, { upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('ads-images').getPublicUrl(storagePath);
      const imageUrl = pub?.publicUrl;

      // 2) inserir anúncio na tabela
      const slug = `popx-${toSlug(title)}-${Math.random().toString(36).slice(2,6)}`;
      const expiresISO = new Date(expiresAt).toISOString();

      const { error: insErr } = await supabase
        .from('ads')
        .insert({
          title,
          description,
          price: Number(price),
          image_url: imageUrl,
          whatsapp,
          slug,
          expires_at: expiresISO,
          published: true
        });
      if (insErr) throw insErr;

      // 3) redirecionar para a landing real
      const base = process.env.NEXT_PUBLIC_SITE_URL || '';
      window.location.href = `${base.replace(/\/$/,'')}/${slug}`;
    } catch (err) {
      console.error(err);
      setError('Não foi possível publicar. Verifique as permissões do Storage/Policies e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>Gerar link real • PopX</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main style={{maxWidth: 640, margin:'40px auto', padding:'0 16px', fontFamily:'Inter, system-ui'}}>
        <h1 style={{marginBottom:16}}>Gerar link real</h1>
        <p style={{color:'#69707A', marginBottom:24}}>
          Esta tela é a única fora do Figma. Aqui o upload é real, o anúncio é salvo no Supabase e você é redirecionado para a landing pública.
        </p>

        <form onSubmit={handleSubmit} style={{display:'grid', gap:12}}>
          <label>Título* <input value={title} onChange={e=>setTitle(e.target.value)} required /></label>
          <label>Preço (R$)* <input value={price} onChange={e=>setPrice(e.target.value)} required type="number" step="0.01"/></label>
          <label>WhatsApp* <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="5511999999999" required /></label>
          <label>Descrição <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} /></label>
          <label>Expira em* <input type="datetime-local" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} required /></label>
          <label>Imagem* <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} required /></label>

          {error && <div style={{color:'#c0392b'}}>{error}</div>}

          <button disabled={busy} style={{padding:'12px 16px', background:'#16a34a', color:'#fff', border:0, borderRadius:8, cursor:'pointer'}}>
            {busy ? 'Publicando...' : 'Publicar e abrir link'}
          </button>
        </form>
      </main>

      <style jsx>{`
        input, textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          outline: none;
        }
        label {
          display: grid;
          gap: 6px;
          font-size: 14px;
          color: #111827;
        }
      `}</style>
    </>
  );
}
