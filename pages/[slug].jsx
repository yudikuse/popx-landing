// pages/[slug].jsx
import Head from 'next/head';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import styles from '../styles/ad.module.css'; // opcional (ver nota no final)

export async function getServerSideProps({ params, req }) {
  const { slug } = params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // busca 1 anúncio pelo slug
  const { data, error } = await supabase
    .from('ads')
    .select('id, title, description, price, image_url, whatsapp, slug, expires_at, published')
    .eq('slug', slug)
    .single();

  // base URL do site (para OG e canônicos)
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${req.headers.host}`.replace(/\/$/, '');

  // não achou ou não publicado
  if (error || !data || !data.published) {
    return { notFound: true };
  }

  // expirado?
  const expired =
    data.expires_at ? new Date(data.expires_at) < new Date() : false;
  if (expired) {
    // retornar 410 - Gone (página de expiração)
    return {
      props: {
        expired: true,
        ad: {
          title: data.title,
          slug: data.slug,
        },
        baseUrl,
      },
    };
  }

  return { props: { ad: data, baseUrl, expired: false } };
}

export default function AdPage({ ad, baseUrl, expired }) {
  // Se o anúncio expirou, renderiza uma tela clean
  if (expired) {
    return (
      <>
        <Head>
          <title>Link expirado • PopX</title>
          <meta name="robots" content="noindex" />
        </Head>
        <main style={{maxWidth: 720, margin: '64px auto', padding: 24}}>
          <h1>Este link expirou</h1>
          <p>O vendedor definiu um prazo para este anúncio e ele já passou.</p>
          <a href="/" style={{display:'inline-block', marginTop: 16}}>Ver outros anúncios</a>
        </main>
      </>
    );
  }

  const pageUrl = `${baseUrl}/${ad.slug}`;
  const ogTitle = `${ad.title} — R$ ${Number(ad.price).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const ogDesc =
    (ad.description || '').slice(0, 180) ||
    'Oferta válida por tempo limitado.';
  const ogImage = ad.image_url || `${baseUrl}/og-fallback.png`;

  const whatsappMsg = encodeURIComponent(
    `Olá! Vi seu anúncio "${ad.title}" por R$ ${Number(ad.price).toLocaleString(
      'pt-BR',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    )}. Ainda está disponível?`
  );
  // número deve estar em formato internacional (5511999999999)
  const waHref = `https://wa.me/${ad.whatsapp}?text=${whatsappMsg}`;

  // JSON-LD (Rich Snippet básico)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: ad.title,
    image: ogImage,
    description: ogDesc,
    offers: {
      '@type': 'Offer',
      price: Number(ad.price),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
    },
  };

  return (
    <>
      <Head>
        <title>{ogTitle}</title>
        <link rel="canonical" href={pageUrl} />
        {/* Open Graph */}
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={ogImage} />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDesc} />
        <meta name="twitter:image" content={ogImage} />
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main style={{ maxWidth: 960, margin: '40px auto', padding: '0 16px' }}>
        <article style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden', background: '#111' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ogImage}
                alt={ad.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          <div>
            <h1 style={{ margin: '0 0 8px' }}>{ad.title}</h1>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
              R$ {Number(ad.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {ad.description || 'Sem descrição.'}
            </p>

            <a
              href={waHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 20,
                background: '#25D366',
                color: '#111',
                padding: '12px 18px',
                borderRadius: 8,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Conversar no WhatsApp
            </a>

            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
              Link: {pageUrl}
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
