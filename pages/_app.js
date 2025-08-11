import '@/styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <header className="container">
        <div className="logo">PopX</div>
      </header>
      <Component {...pageProps} />
      <div className="footer">© PopX — links rápidos com prazo e WhatsApp</div>
    </>
  );
}
