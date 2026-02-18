# Facebook Link Preview Generator - Serverless Version

Serverless function untuk menghasilkan preview gambar custom di Facebook dengan redirect ke Shopee.

## Cara Penggunaan

1. Buat link dengan format:

https://domain-anda.vercel.app/?image=URL_GAMBAR&url=URL_SHOPEE&title=JUDUL


2. Parameter:
- `image`: URL gambar dari ImgBB (wajib)
- `url`: URL Shopee tujuan (wajib)
- `title`: Judul produk (opsional)

3. Posting link di Facebook:
- Crawler Facebook akan melihat gambar
- Pengguna yang klik akan redirect ke Shopee

## Deploy

```bash
vercel --prod


---

## 📁 Struktur Folder Final

Setelah semua file dibuat, struktur folder Anda harus seperti ini:
Vynn4Youu-Link-Generator/
├── api/
│ └── ssrOG.js
├── vercel.json
├── package.json
├── .gitignore
└── README.md (opsional)
text


## 🚀 Langkah Deploy

### **1. Push ke GitHub**
```bash
git add .
git commit -m "Update to serverless only version"
git push origin main

2. Deploy ke Vercel
bash

vercel --prod --force

3. Testing
bash

# Test dengan crawler Facebook (simulasi)
curl -A "facebookexternalhit/1.1" "https://project-anda.vercel.app/?image=https://i.ibb.co/gambar.jpg&url=https://shopee.co.id/produk"

# Test dengan browser biasa (harus redirect)
curl "https://project-anda.vercel.app/?image=https://i.ibb.co/gambar.jpg&url=https://shopee.co.id/produk"

✅ Verifikasi di Facebook Debugger

    Buka https://developers.facebook.com/tools/debug/

    Masukkan link Anda: https://project-anda.vercel.app/?image=...&url=...

    Klik Debug

    Pastikan:

        og:title = (kosong)

        og:image = URL gambar Anda

        og:url = URL Shopee

        Tidak ada description

    Klik "Scrape Again" untuk refresh cache

⚠️ Catatan Penting

    Tidak perlu build karena ini serverless function

    Tidak perlu folder src atau dist

    Pastikan API key ImgBB sudah benar di aplikasi frontend (jika masih menggunakan generator)

    Cache Facebook mungkin perlu 5-10 menit untuk update