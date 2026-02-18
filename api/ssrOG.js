// api/ssrOG.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
  try {
    // Ambil parameter dari URL query
    const { 
      url: productUrl, 
      image: imageUrl, 
      title: productTitle, 
      desc: productDesc 
    } = req.query;
    
    // Cek apakah ini crawler Facebook atau pengguna biasa
    const userAgent = req.headers['user-agent'] || '';
    const isFacebookCrawler = userAgent.includes('facebookexternalhit') || 
                              userAgent.includes('Facebot') || 
                              userAgent.includes('Twitterbot') ||
                              userAgent.includes('LinkedInBot') ||
                              userAgent.includes('Slackbot');
    
    // Data untuk Open Graph tags
    const ogData = {
      title: productTitle ? decodeURIComponent(productTitle) : '',
      description: productDesc ? decodeURIComponent(productDesc) : '', // Kosongkan deskripsi jika tidak perlu
      image: imageUrl ? decodeURIComponent(imageUrl) : 'https://via.placeholder.com/1200x630?text=Produk+Shopee',
      url: productUrl ? decodeURIComponent(productUrl) : `https://${req.headers.host || 'localhost'}`,
    };
    
    // JIKA INI CRAWLER FACEBOOK: kirim HTML dengan Open Graph tags
    if (isFacebookCrawler) {
      // Baca file index.html hasil build
      const htmlPath = path.join(process.cwd(), 'dist', 'index.html');
      
      // Cek apakah file ada
      if (!fs.existsSync(htmlPath)) {
        return res.status(404).send('Build not found. Please run build first.');
      }
      
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      // Ganti placeholder di HTML
// Di bagian setelah membaca file HTML, ganti placeholder dengan ini:
      html = html.replace(/__OG_TITLE__/g, ogData.title);
      html = html.replace(/__OG_DESCRIPTION__/g, ogData.description);
      html = html.replace(/__OG_IMAGE__/g, ogData.image);
      html = html.replace(/__OG_URL__/g, ogData.url);
      html = html.replace(/__OG_SITE_NAME__/g, ''); // Kosongkan site name
      html = html.replace(/__OG_IMAGE_ALT__/g, ogData.title); // Alt text untuk gambar
      
      // Set header untuk crawler
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.status(200).send(html);
    } 
    
    // JIKA INI PENGGUNA BIASA: redirect langsung ke Shopee
    else {
      // Validasi URL Shopee
      if (!ogData.url || ogData.url === '') {
        return res.status(400).send('URL produk tidak ditemukan');
      }
      
      // Redirect ke URL Shopee
      res.setHeader('Location', ogData.url);
      return res.status(302).end(); // 302 = redirect sementara
    }
    
  } catch (error) {
    console.error('SSR Error:', error);
    
    // Jika error, redirect ke halaman utama atau tampilkan error
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Server Error</h1>
          <p>${error.message}</p>
          <p><a href="/">Kembali ke halaman utama</a></p>
        </body>
      </html>
    `);
  }
}