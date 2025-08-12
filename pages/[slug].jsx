import Head from 'next/head';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

export async function getServerSideProps({ params }) {
  const slug = params.slug;
  const { data, error } = await supabase
    .from('ads')
    .select('title, description, price, image_url, whatsapp, slug, expires_at, published')
    .eq('slug', slug)
    .single();

  const expired = data?.expires_at ? new Date(data.expires_at) < new Date() : false;
  if (error || !data || !data.published || expired) return { notFound: true };
  return { props: { ad: data, baseUrl: process.env.NEXT_PUBLIC_SITE_URL || '' } };
}

export default function AdPage({ ad, baseUrl }) {
  const url = `${baseUrl}/${ad.slug}`;
  const ogTitle = `${ad.title} — R$ ${Number(ad.price).toFixed(2).replace('.', ',')}`;
  const ogDesc = ad.description?.slice(0, 180) || 'Oferta válida por tempo limitado.';
  const ogImage = ad.image_url || `${baseUrl}/og-fallback.png`;

  const whatsappMsg = encodeURIComponent(
    `Olá! Vi seu anúncio "${ad.title}" por R$ ${Number(ad.price).toFixed(2)}. Ainda está disponível?`
  );
  const waHref = `https://wa.me/${ad.whatsapp}?text=${whatsappMsg}`;

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
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDesc} />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <main className="container">
        <div className="row">
          <div className="card" style={{ flex: '1 1 520px' }}>
            <div className="imgwrap">
              <Image src={ogImage} alt={ad.title} width={920} height={560} style={{ width: '100%', height: 'auto' }} priority/>
            </div>
            <h1 className="title" style={{ marginTop: 16 }}>{ad.title}</h1>
            <div className="price">R$ {Number(ad.price).toFixed(2).replace('.', ',')}</div>
            <p className="meta" style={{ marginTop: 8 }}>{ad.description}</p>
            <a className="btn" href={waHref} target="_blank" rel="noreferrer">💬 Entrar em contato</a>
            <div className="meta" style={{ marginTop: 8 }}>Link: {url}</div>
          </div>
        </div>
      </main>
    </>
  );
}
