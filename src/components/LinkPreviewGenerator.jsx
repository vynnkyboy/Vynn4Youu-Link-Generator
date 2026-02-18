import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiLink, FiCopy, FiCheck, FiUpload, FiRefreshCw, FiShare2 } from 'react-icons/fi';
import './LinkPreviewGenerator.css';

const LinkPreviewGenerator = () => {
  const [url, setUrl] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  
  // State untuk gambar custom
  const [customImage, setCustomImage] = useState(null);
  const [customImagePreview, setCustomImagePreview] = useState(null);
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // State untuk mode hosting/produksi
  const [isHostedMode, setIsHostedMode] = useState(false);
  const [shareableLink, setShareableLink] = useState('');

  // Konfigurasi ImgBB - GANTI DENGAN API KEY ANDA!
  const IMGBB_API_KEY = '401a168ddd24ce77b0d339fdd14876cd'; // Dapatkan dari https://api.imgbb.com/

  // Effect untuk membaca parameter dari URL saat komponen dimuat
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const imageParam = queryParams.get('image');
    const urlParam = queryParams.get('url');
    const titleParam = queryParams.get('title');
    const descParam = queryParams.get('desc');
    
    if (urlParam || imageParam || titleParam || descParam) {
      setIsHostedMode(true);
      
      if (urlParam) setUrl(decodeURIComponent(urlParam));
      if (imageParam) {
        setUploadedImageUrl(decodeURIComponent(imageParam));
        setUseCustomImage(true);
      }
      
      setPreviewData({
        title: titleParam ? decodeURIComponent(titleParam) : 'Produk Shopee',
        description: descParam ? decodeURIComponent(descParam) : 'Klik untuk melihat produk di Shopee',
        image: imageParam ? decodeURIComponent(imageParam) : 'https://via.placeholder.com/600x315?text=Produk+Shopee',
        url: urlParam ? decodeURIComponent(urlParam) : ''
      });
    }
  }, []);

  // Fungsi untuk fetch link preview
  const fetchLinkPreview = async (customUrl = null) => {
    const targetUrl = customUrl || url;
    if (!targetUrl) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}`);
      
      if (response.data && response.data.data) {
        setPreviewData({
          title: response.data.data.title || 'Judul tidak tersedia',
          description: response.data.data.description || 'Deskripsi tidak tersedia',
          image: response.data.data.image?.url || 'https://via.placeholder.com/600x315?text=No+Image',
          url: response.data.data.url
        });
        // Reset custom image
        setCustomImage(null);
        setCustomImagePreview(null);
        setUseCustomImage(false);
        setUploadedImageUrl('');
        setIsHostedMode(false);
      } else {
        setError('Gagal mengambil pratinjau. Coba URL lain.');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Pastikan URL valid.');
    } finally {
      setLoading(false);
    }
  };

  // FUNGSI UPLOAD KE IMGBB - IMPLEMENTASI NYATA
  const uploadToImgBB = async (file) => {
    // Validasi API Key
    if (!IMGBB_API_KEY || IMGBB_API_KEY === 'Y401a168ddd24ce77b0d339fdd14876cd') {
      throw new Error('API Key ImgBB belum diisi. Dapatkan API key gratis di https://api.imgbb.com/');
    }

    // Validasi file
    if (!file) throw new Error('Tidak ada file yang dipilih');

    // Validasi ukuran (max 32 MB sesuai dokumentasi ImgBB) [citation:8]
    const maxSize = 32 * 1024 * 1024; // 32MB
    if (file.size > maxSize) {
      throw new Error(`Ukuran file terlalu besar. Maksimal 32MB`);
    }

    // Konversi file ke base64
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Ambil hanya data base64-nya
      reader.onerror = error => reject(error);
    });

    // Siapkan parameter untuk ImgBB API [citation:9]
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Image);
    formData.append('name', file.name || 'custom_image');
    formData.append('expiration', '0'); // 0 = permanent

    try {
      console.log('Uploading to ImgBB...');
      
      // Kirim ke API ImgBB [citation:8]
      const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000, // 30 detik timeout
      });

      console.log('ImgBB response:', response.data);

      // Validasi respons
      if (response.data && response.data.success && response.data.data) {
        const imageUrl = response.data.data.url || response.data.data.display_url;
        console.log('Upload successful! URL:', imageUrl);
        return imageUrl;
      } else {
        throw new Error(response.data.error?.message || 'Gagal upload ke ImgBB');
      }
    } catch (error) {
      console.error('ImgBB upload error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle berbagai jenis error
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout: Koneksi ke ImgBB terlalu lambat');
      } else if (error.response?.status === 400) {
        throw new Error('API Key tidak valid atau file corrupt');
      } else if (error.response?.status === 413) {
        throw new Error('File terlalu besar (maks 32MB)');
      } else {
        throw new Error(error.response?.data?.error?.message || error.message || 'Gagal terhubung ke ImgBB');
      }
    }
  };

  // Fungsi untuk handle upload gambar
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format file tidak didukung. Gunakan: JPG, PNG, GIF, WEBP, BMP');
      return;
    }
    
    // Validasi ukuran (pre-upload check)
    if (file.size > 32 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 32MB');
      return;
    }

    setCustomImage(file);
    setUploading(true);
    setError('');

    // Buat preview lokal
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      // Upload ke ImgBB
      const imageUrl = await uploadToImgBB(file);
      
      // Simpan URL yang didapat dari ImgBB
      setUploadedImageUrl(imageUrl);
      setUseCustomImage(true);
      setError('');
      
      console.log('Image uploaded successfully:', imageUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload gagal: ${err.message}`);
      setUseCustomImage(false);
      setCustomImagePreview(null);
      setUploadedImageUrl('');
    } finally {
      setUploading(false);
    }
  };

  // Fungsi untuk reset ke gambar original
  const resetToOriginalImage = () => {
    setUseCustomImage(false);
    setCustomImage(null);
    setCustomImagePreview(null);
    setUploadedImageUrl('');
    document.getElementById('image-upload').value = '';
  };

  // Fungsi untuk mendapatkan gambar yang akan ditampilkan
  const getDisplayImage = () => {
    if (useCustomImage && uploadedImageUrl) {
      return uploadedImageUrl;
    }
    if (useCustomImage && customImagePreview) {
      return customImagePreview; // Fallback ke preview lokal
    }
    return previewData?.image || 'https://via.placeholder.com/600x315?text=Preview';
  };

  // Fungsi untuk membuat link shareable dengan URL gambar dari ImgBB
// Di LinkPreviewGenerator.jsx
const generateShareableLink = () => {
  if (!previewData) return '';
  
  const imageToUse = useCustomImage && uploadedImageUrl ? uploadedImageUrl : previewData.image;
  
  // GANTI: Gunakan endpoint API, bukan halaman utama
  const baseUrl = window.location.origin + '/api/ssrOG'; // PENTING: panggil API langsung
  
  const params = new URLSearchParams();
  
  params.append('url', encodeURIComponent(previewData.url));
  params.append('image', encodeURIComponent(imageToUse));
  params.append('title', encodeURIComponent(previewData.title || 'Produk Shopee'));
  params.append('desc', encodeURIComponent(previewData.description || 'Klik untuk lihat produk'));
  
  return `${baseUrl}?${params.toString()}`;
};

  // Fungsi untuk membuat link dan menyalinnya
  const createAndCopyShareableLink = () => {
  if (!previewData) {
    alert('Preview data belum tersedia');
    return;
  }
  
  const link = generateShareableLink();
  setShareableLink(link);
  navigator.clipboard.writeText(link).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    alert('✅ Link shareable disalin!\n\nLink ini sudah mengarah ke API server.\n\nGunakan link ini untuk posting di Facebook.');
  });
};

  const generatePostText = () => {
    return `${caption}\n\n${url}`;
  };

  const copyToClipboard = () => {
    const textToCopy = generatePostText();
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openPreview = () => {
    if (previewData) {
      window.open(previewData.url, '_blank');
    }
  };

  return (
    <div className="preview-container">
      <div className="header">
        <h1 className="title">
          <FiLink className="icon" />
          Vynn4Youu Link Preview Generator
        </h1>
        <p className="subtitle">Buat postingan Facebook dengan pratinjau tautan Shopee + Upload ke ImgBB</p>
      </div>
      
      {/* Mode Indicator */}
      {isHostedMode && (
        <div className="mode-indicator">
          <span className="badge info">🔗 Mode: Link Shareable Aktif</span>
          <p className="mode-description">
            Anda sedang melihat pratinjau dari link shareable. Gambar dan data sudah terkunci sesuai parameter URL.
          </p>
        </div>
      )}
      
      {/* Input URL */}
      {!isHostedMode && (
        <div className="input-section">
          <label className="label">Masukkan URL Shopee/Produk</label>
          <div className="input-group">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://shopee.co.id/..."
              className="input-field"
            />
            <button
              onClick={() => fetchLinkPreview()}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Memuat...' : 'Preview'}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      )}

      {/* Pratinjau Hasil */}
      {previewData && (
        <div className="preview-section">
          <h2 className="section-title">Pratinjau Postingan Facebook</h2>
          
          {/* Image Upload Section dengan ImgBB */}
          {!isHostedMode && (
            <div className="image-upload-section">
              <label className="label">Upload Gambar Custom ke ImgBB</label>
              <div className="image-controls">
                <div className="upload-group">
                  <label htmlFor="image-upload" className={`btn btn-secondary ${uploading ? 'disabled' : ''}`}>
                    <FiUpload className="icon" />
                    {uploading ? 'Uploading...' : (useCustomImage ? 'Ganti Gambar' : 'Pilih & Upload Gambar')}
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp"
                    onChange={handleImageUpload}
                    className="file-input"
                    disabled={uploading}
                  />
                  {useCustomImage && (
                    <button
                      onClick={resetToOriginalImage}
                      className="btn btn-outline"
                      disabled={uploading}
                    >
                      <FiRefreshCw className="icon" />
                      Reset
                    </button>
                  )}
                </div>
                <div className="image-info">
                  {uploading ? (
                    <span className="badge warning">⏳ Mengupload ke ImgBB...</span>
                  ) : useCustomImage ? (
                    <span className="badge success">✅ Gambar tersimpan di ImgBB</span>
                  ) : (
                    <span className="badge info">Menggunakan gambar dari link</span>
                  )}
                </div>
              </div>
              {uploadedImageUrl && (
                <div className="upload-success">
                  <small>URL gambar: {uploadedImageUrl.substring(0, 50)}...</small>
                </div>
              )}
            </div>
          )}

          {/* Card Preview */}
          <div className="facebook-card" onClick={openPreview}>
            <div className="card-image">
              <img 
                src={getDisplayImage()} 
                alt={previewData.title}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x315?text=Gambar+Tidak+Tersedia';
                }}
              />
              {useCustomImage && (
                <div className="custom-image-badge">
                  Custom Image
                </div>
              )}
            </div>
            
            <div className="card-content">
              <h3 className="card-title">{previewData.title}</h3>
              <p className="card-description">{previewData.description.substring(0, 120)}...</p>
              <p className="card-url">{previewData.url}</p>
            </div>
          </div>

          {/* Caption Input */}
          {!isHostedMode && (
            <div className="caption-section">
              <label className="label">Caption Postingan</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tulis caption menarik di sini..."
                rows="4"
                className="textarea-field"
              />
            </div>
          )}

          {/* Shareable Link Section */}
          <div className="shareable-section">
            <h3 className="shareable-title">
              <FiShare2 className="icon" />
              Link untuk Diposting di Facebook
            </h3>
            <p className="shareable-description">
              Gunakan link di bawah ini untuk posting di Facebook. Gambar dari ImgBB akan terbaca oleh crawler!
            </p>
            
            <div className="shareable-controls">
              <button
                onClick={createAndCopyShareableLink}
                className="btn btn-shareable"
                disabled={!previewData}
              >
                <FiShare2 />
                {copied ? ' Link Tersalin!' : ' Buat & Salin Link Shareable'}
              </button>
            </div>
            
            {shareableLink && (
              <div className="shareable-result">
                <label className="label">Link Shareable:</label>
                <div className="input-group">
                  <input
                    type="text"
                    value={shareableLink}
                    readOnly
                    className="input-field"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareableLink);
                      alert('Link disalin!');
                    }}
                    className="btn btn-primary"
                  >
                    <FiCopy />
                  </button>
                </div>
              </div>
            )}
            
            <div className="shareable-warning">
              <strong>📌 Petunjuk Penting:</strong>
              <ul>
                <li>Dapatkan API Key gratis di <strong>https://api.imgbb.com/</strong></li>
                <li>Ganti <code>YOUR_IMGBB_API_KEY_HERE</code> dengan API key Anda</li>
                <li>Upload gambar akan langsung tersimpan di server ImgBB</li>
                <li>Link shareable hanya berfungsi jika aplikasi di-hosting di server publik (Netlify/Vercel)</li>
                <li>Untuk testing localhost, gunakan Facebook Sharing Debugger setelah deploy</li>
              </ul>
            </div>
          </div>

          {/* Hasil Akhir */}
          {!isHostedMode && (
            <div className="result-section">
              <div className="result-header">
                <span className="result-label">Teks Postingan (Alternatif):</span>
                <button
                  onClick={copyToClipboard}
                  className="copy-button"
                >
                  {copied ? <FiCheck /> : <FiCopy />}
                  {copied ? ' Tersalin!' : ' Salin'}
                </button>
              </div>
              <div className="result-text">
                {generatePostText()}
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div className="tips-section">
            <h4 className="tips-title">💡 Info ImgBB:</h4>
            <ul className="tips-list">
              <li><strong>Ukuran maksimal:</strong> 32MB per file [citation:8]</li>
              <li><strong>Format didukung:</strong> JPG, PNG, GIF, BMP, WEBP [citation:5]</li>
              <li><strong>Penyimpanan:</strong> Permanen (bisa diatur auto-delete)</li>
              <li><strong>Rate limit:</strong> Standar dari ImgBB (fair use)</li>
              <li><strong>API Key:</strong> Wajib diisi agar upload berfungsi</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkPreviewGenerator;