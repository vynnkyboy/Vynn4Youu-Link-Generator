// api/ssrOG.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // Baca file index.html hasil build
    const htmlPath = path.join(process.cwd(), 'dist', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Ambil parameter dari URL query
    const { 
      url: productUrl, 
      image: imageUrl, 
      title: productTitle, 
      desc: productDesc 
    } = req.query;
    
    // Data untuk Open Graph tags (decode dulu)
    const ogData = {
      title: productTitle ? decodeURIComponent(productTitle) : 'Produk Shopee',
      description: productDesc ? decodeURIComponent(productDesc) : 'Lihat produk menarik ini di Shopee',
      image: imageUrl ? decodeURIComponent(imageUrl) : 'https://via.placeholder.com/1200x630',
      url: productUrl ? decodeURIComponent(productUrl) : req.headers.host || '',
    };
    
    // Ganti placeholder di HTML
    html = html.replace(/__OG_TITLE__/g, ogData.title);
    html = html.replace(/__OG_DESCRIPTION__/g, ogData.description);
    html = html.replace(/__OG_IMAGE__/g, ogData.image);
    html = html.replace(/__OG_URL__/g, ogData.url);
    
    // Set header dan kirim HTML
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).send('Error generating page');
  }
}