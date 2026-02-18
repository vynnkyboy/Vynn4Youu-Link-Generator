// api/ssrOG.js - Final Version
// Serverless function untuk menangani crawler Facebook dan redirect ke Shopee

export default async function handler(req, res) {
  try {
    // ========== 1. AMBIL PARAMETER DARI URL ==========
    const { 
      url: productUrl,      // URL Shopee tujuan
      image: imageUrl,       // URL gambar dari ImgBB
      title: productTitle    // Judul produk (opsional)
    } = req.query;
    
    // ========== 2. DETEKSI CRAWLER FACEBOOK ==========
    const userAgent = req.headers['user-agent'] || '';
    const isFacebookCrawler = 
      userAgent.includes('facebookexternalhit') || 
      userAgent.includes('Facebot') || 
      userAgent.includes('Twitterbot') ||
      userAgent.includes('LinkedInBot') ||
      userAgent.includes('Slackbot') ||
      userAgent.includes('Pinterestbot') ||
      userAgent.includes('Googlebot');
    
    // ========== 3. VALIDASI DATA ==========
    if (!imageUrl) {
      return res.status(400).json({ error: 'Parameter image wajib diisi' });
    }
    
    // Decode URL parameter
    const decodedImageUrl = decodeURIComponent(imageUrl);
    const decodedProductUrl = productUrl ? decodeURIComponent(productUrl) : '';
    const decodedTitle = productTitle ? decodeURIComponent(productTitle) : ' ';
    
    // ========== 4. HANDLER UNTUK CRAWLER FACEBOOK ==========
    if (isFacebookCrawler) {
      // HTML SUPER MINIMALIS - HANYA META TAGS
      // Tidak ada konten visible, tidak ada teks
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  
  <!-- Open Graph Tags - Minimalis -->
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
  
  <!-- Meta tag lain yang mungkin dibaca crawler -->
  <meta name="title" content=" " />
  <meta name="description" content=" " />
  <link rel="canonical" href="${decodedProductUrl}" />
  
  <!-- Title tag - dikosongkan -->
  <title> </title>
  
  <!-- CSS untuk memastikan tidak ada yang tampil -->
  <style>
    /* Sembunyikan absolut semua konten */
    * {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
    }
    
    body {
        display: none !important;
        background: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
    }
  </style>
</head>
<body>
  <!-- Halaman benar-benar kosong -->
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
    
    // ========== 5. HANDLER UNTUK PENGGUNA BIASA ==========
    else {
      // Validasi URL produk
      if (!decodedProductUrl) {
        return res.status(400).send(`
          <html>
            <body style="font-family: sans-serif; padding: 20px;">
              <h2>Link Tidak Valid</h2>
              <p>URL produk tidak ditemukan. Silakan buat link ulang.</p>
              <p><a href="/">Kembali ke Generator</a></p>
            </body>
          </html>
        `);
      }
      
      // Redirect 302 ke Shopee
      res.setHeader('Location', decodedProductUrl);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(302).end();
    }
    
  } catch (error) {
    // ========== 6. HANDLER ERROR ==========
    console.error('SSR OG Error:', error);
    
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2>Terjadi Kesalahan</h2>
          <p>${error.message}</p>
          <p><a href="/">Kembali ke Generator</a></p>
        </body>
      </html>
    `);
  }
}