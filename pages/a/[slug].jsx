// pages/a/[slug].jsx
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function getServerSideProps({ params }) {
  const { data: ad, error } = await supabase
    .from('ads')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!ad || error) return { notFound: true };
  return { props: { ad } };
}

export default function AdPage({ ad }) {
  const price = Number(ad.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const img = ad.image_url || '/og-fallback.png';
  const wa = `https://wa.me/${ad.whatsapp}?text=${encodeURIComponent(`Oi! Tenho interesse no ${ad.title}.`)}`;

  return (
    <>
      <Head>
        <title>{`${ad.title} — R$ ${price}`}</title>
        <meta name="description" content={ad.description || ad.title} />
        <meta property="og:title" content={`${ad.title} — R$ ${price}`} />
        <meta property="og:description" content={ad.description || ad.title} />
        <meta property="og:image" content={img} />
        <meta property="og:type" content="product" />
      </Head>

      <main style={{
        minHeight:'100vh', background:'#0b0d10', color:'#fff', padding:'32px 16px'
      }}>
        <div style={{
          maxWidth:960, margin:'0 auto'
        }}>
          <h1 style={{fontSize:32, margin:'0 0 8px'}}> {ad.title} </h1>
          <div style={{opacity:.9, marginBottom:16}}>R$ {price}</div>

          <div style={{
            background:'#12161c', border:'1px solid #1e242c', borderRadius:12, overflow:'hidden'
          }}>
            <div style={{position:'relative', paddingTop:'62%', background:'#0f1318'}}>
              {/* imagem responsiva */}
              <img
                src={img}
                alt={ad.title}
                style={{
                  position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'
                }}
              />
            </div>

            <div style={{padding:20}}>
              {ad.description && (
                <p style={{lineHeight:1.6, color:'#cfd6df', marginTop:0}}>{ad.description}</p>
              )}

              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                style={{
                  display:'inline-block', padding:'12px 16px', borderRadius:8,
                  background:'#25D366', color:'#0b0d10', textDecoration:'none', fontWeight:700
                }}
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
