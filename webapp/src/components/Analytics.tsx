import Script from "next/script";

/**
 * Loads Yandex Metrika / Google Analytics only if the corresponding env
 * var is set — nothing is loaded (no third-party request, no cookie) by
 * default, since neither counter ID exists yet.
 */
export default function Analytics() {
  const ymId = process.env.NEXT_PUBLIC_YM_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {ymId && (
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            ym(${JSON.stringify(ymId)}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true });
          `}
        </Script>
      )}
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', ${JSON.stringify(gaId)});
            `}
          </Script>
        </>
      )}
    </>
  );
}
