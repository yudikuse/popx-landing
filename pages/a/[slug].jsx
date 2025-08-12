// pages/a/[slug].jsx
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

  if (!ad || error) {
    return { notFound: true };
  }

  return { props: { ad } };
}

export default function AdPage({ ad }) {
  return (
    <main style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
      <h1>{ad.title}</h1>
      <p>R$ {Number(ad.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      <img
        src={ad.image_url || '/og-fallback.png'}
        alt={ad.title}
        style={{ maxWidth: '100%', borderRadius: 8 }}
      />
      <p>{ad.description}</p>
      <a
        href={`https://wa.me/${ad.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-block',
          padding: '10px 16px',
          background: '#25D366',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: 6,
          marginTop: 16
        }}
      >
        Falar no WhatsApp
      </a>
    </main>
  );
}
