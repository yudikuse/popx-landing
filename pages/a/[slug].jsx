// pages/a/[slug].jsx
import Head from 'next/head';
import { supabase } from '../../lib/supabaseClient';

export default function AdPage({ ad }) {
  const ogTitle = ad?.title ? `${ad.title} — R$ ${Number(ad.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Anúncio';
  const ogDesc  = ad?.description || 'Oferta válida por tempo limitado.';
  const ogImage = ad?.image_url || '/og-fallback.png';
  const url     = `${process.env.NEXT_PUBLIC_SITE_URL}/a/${ad?.slug}`;

  const whatsappMsg = ad
    ? `Olá! Vi seu anúncio *${ad.title}* por R$ ${Number(ad.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Ainda está disponível?`
    : '';

  const waHref = ad ? `https://wa.me/${ad.whatsapp}?text=${encodeURIComponent(whatsappMsg)}` : '#';

  return (
    <>
      <Head>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main style={{maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto'}}>
        <h1 style={{marginBottom: 8}}>{ad.title}</h1>
        <p style={{color: '#555', marginTop: 0}}>R$ {Number(ad.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>

        <img
          src={ogImage}
          alt={ad.title}
          style={{width: '100%', height: 'auto', borderRadius: 12, border: '1px solid #eee', margin: '16px 0'}}
        />

        <p style={{lineHeight: 1.6}}>{ad.description}</p>

        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            marginTop: 16,
            background: '#25D366',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Falar no WhatsApp
        </a>
      </main>
    </>
  );
}

export async function getServerSideProps({ params }) {
  // Busca o anúncio no Supabase a cada requisição
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return { notFound: true };
  }

  return { props: { ad: data } };
}
