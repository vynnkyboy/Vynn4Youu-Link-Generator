// api/ssrOG.js - ULTIMATE VERSION
// Menghapus SEMUA kemungkinan teks yang muncul di Facebook

export default async function handler(req, res) {
  try {
    // Ambil parameter
    const { url: productUrl, image: imageUrl } = req.query;
    
    // Deteksi crawler
    const userAgent = req.headers['user-agent'] || '';
    const isFacebookCrawler = userAgent.includes('facebookexternalhit') || 
                              userAgent.includes('Facebot');
    
    // Validasi
    if (!imageUrl) {
      return res.status(400).send('Image parameter required');
    }
    
    const decodedImageUrl = decodeURIComponent(imageUrl);
    const decodedProductUrl = productUrl ? decodeURIComponent(productUrl) : '';
    
    // ========== UNTUK CRAWLER FACEBOOK ==========
    if (isFacebookCrawler) {
      // HTML dengan pendekatan berbeda - menggunakan comment untuk menyembunyikan title
      const html = `<!DOCTYPE html>
<html>
<head>
  <!-- Meta tags untuk Facebook -->
  <meta property="og:title" content=" " />
  <meta property="og:image" content="${decodedImageUrl}" />
  <meta property="og:url" content="${decodedProductUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content=" " />
  <meta property="og:description" content=" " />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content=" " />
  <meta name="twitter:description" content=" " />
  <meta name="twitter:image" content="${decodedImageUrl}" />
  
  <!-- Meta tag lain yang mungkin dibaca Facebook -->
  <meta name="title" content=" " />
  <meta name="description" content=" " />
  <link rel="canonical" href="${decodedProductUrl}" />
  
  <!-- Title tag - disembunyikan dengan CSS -->
  <title> </title>
  
  <!-- CSS untuk memastikan tidak ada yang tampil -->
  <style>
    /* Sembunyikan absolut semua konten */
    html, body, div, span, applet, object, iframe,
    h1, h2, h3, h4, h5, h6, p, blockquote, pre,
    a, abbr, acronym, address, big, cite, code,
    del, dfn, em, img, ins, kbd, q, s, samp,
    small, strike, strong, sub, sup, tt, var,
    b, u, i, center, dl, dt, dd, ol, ul, li,
    fieldset, form, label, legend,
    table, caption, tbody, tfoot, thead, tr, th, td,
    article, aside, canvas, details, embed, 
    figure, figcaption, footer, header, hgroup, 
    menu, nav, output, ruby, section, summary,
    time, mark, audio, video {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
    }
    
    /* Pastikan body benar-benar kosong */
    body {
        display: none !important;
        background: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
    }
  </style>
  
  <!-- Tidak ada judul di tab browser -->
  <title> </title>
</head>
<body>
  <!-- Halaman benar-benar kosong -->
  <!-- Bahkan tidak ada spasi atau newline yang tidak perlu -->
</body>
</html>`;
      
      // Set header super ketat
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
      
      return res.status(200).send(html);
    } 
    
    // ========== UNTUK PENGGUNA BIASA ==========
    else {
      if (!decodedProductUrl) {
        return res.redirect('/');
      }
      
      // Redirect ke Shopee
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Location', decodedProductUrl);
      return res.status(302).end();
    }
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error');
  }
}