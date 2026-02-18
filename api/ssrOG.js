// api/ssrOG.js - Final Version
// Membuat HTML minimalis untuk crawler Facebook
// Redirect pengguna biasa langsung ke Shopee

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
      userAgent.includes('Pinterestbot');
    
    // ========== 3. VALIDASI DATA ==========
    if (!imageUrl) {
      return res.status(400).send('Parameter image wajib diisi');
    }
    
    // Decode URL parameter
    const decodedImageUrl = decodeURIComponent(imageUrl);
    const decodedProductUrl = productUrl ? decodeURIComponent(productUrl) : '';
    const decodedTitle = productTitle ? decodeURIComponent(productTitle) : ' ';
    
    // ========== 4. HANDLER UNTUK CRAWLER FACEBOOK ==========
    if (isFacebookCrawler) {
      // HTML SUPER MINIMALIS - HANYA META TAGS
      // Tidak ada konten visible, tidak ada teks, hanya meta tags untuk Facebook
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  
  <!-- Open Graph Tags - Minimalis -->
  <meta property="og:title" content="${decodedTitle}" />
  <meta property="og:image" content="${decodedImageUrl}" />
  <meta property="og:url" content="${decodedProductUrl}" />
  <meta property="og:type" content="website" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${decodedTitle}" />
  <meta name="twitter:image" content="${decodedImageUrl}" />
  
  <!-- Tidak ada title di browser tab -->
  <title></title>
  
  <!-- Sembunyikan SEMUA konten -->
  <style>
    * { display: none !important; }
    body { display: none !important; background: transparent; }
  </style>
</head>
<body>
  <!-- Halaman benar-benar kosong untuk pengguna yang membuka link -->
  <!-- Tapi crawler Facebook akan membaca meta tags di atas -->
</body>
</html>`;
      
      // Set header untuk crawler
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow'); // Cegah index oleh search engine
      
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
      
      // Redirect 302 (sementara) ke Shopee
      res.setHeader('Location', decodedProductUrl);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(302).end(); // 302 = Found (redirect sementara)
    }
    
  } catch (error) {
    // ========== 6. HANDLER ERROR ==========
    console.error('SSR OG Error:', error);
    
    // Tampilkan error sederhana
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