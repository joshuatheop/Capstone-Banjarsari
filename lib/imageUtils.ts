// ============================================================
// imageUtils.ts — Client-side image compression (no Firebase Storage)
//
// Alur:
//   File → FileReader → HTMLImageElement → Canvas (resize) →
//   canvas.toDataURL('image/webp', quality) → Base64 string
//
// Ukuran estimasi hasil: ~30–80 KB untuk foto produk biasa
// (bandingkan dengan aslinya yang bisa 2–5 MB)
// ============================================================

/**
 * Kompresi gambar menggunakan HTML5 Canvas.
 *
 * 1. Baca file → decode jadi HTMLImageElement
 * 2. Hitung dimensi target: lebar maks `maxWidth`, height proporsional
 * 3. Gambar ke Canvas → export sebagai WebP dengan kualitas `quality`
 * 4. Return Data URL (string Base64 siap simpan ke Firestore)
 *
 * @param file      - File gambar yang dipilih admin
 * @param maxWidth  - Lebar piksel maksimal (default: 800)
 * @param quality   - Kualitas WebP 0.0–1.0 (default: 0.6 = 60%)
 * @returns Promise<string> - Data URL format: "data:image/webp;base64,..."
 */
export function compressToWebPBase64(
  file: File,
  maxWidth = 800,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    // --- Step 1: Baca file sebagai Data URL menggunakan FileReader ---
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));

    reader.onload = (readerEvent) => {
      const dataUrl = readerEvent.target?.result as string;

      // --- Step 2: Decode Data URL ke HTMLImageElement ---
      const img = new Image();

      img.onerror = () => reject(new Error('Gagal memuat gambar dari file.'));

      img.onload = () => {
        // --- Step 3: Hitung dimensi target ---
        // Jika lebar asli ≤ maxWidth, biarkan ukuran aslinya
        const srcWidth  = img.naturalWidth;
        const srcHeight = img.naturalHeight;

        let targetWidth  = srcWidth;
        let targetHeight = srcHeight;

        if (srcWidth > maxWidth) {
          // Scale down secara proporsional
          const ratio   = maxWidth / srcWidth;
          targetWidth   = maxWidth;
          targetHeight  = Math.round(srcHeight * ratio);
        }

        // --- Step 4: Gambar ke Canvas ---
        const canvas = document.createElement('canvas');
        canvas.width  = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Browser tidak mendukung Canvas 2D.'));
          return;
        }

        // Gambar ulang dengan dimensi yang sudah di-scale
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // --- Step 5: Export sebagai WebP Base64 ---
        // toDataURL() menghasilkan: "data:image/webp;base64,XXXXX..."
        const base64 = canvas.toDataURL('image/webp', quality);

        // Validasi ukuran: Base64 string 1 char ≈ 0.75 byte
        // Firestore limit 1 MB per dokumen; target aman < 700 KB
        const estimatedBytes = Math.round((base64.length * 3) / 4);
        const KB = Math.round(estimatedBytes / 1024);

        if (estimatedBytes > 700 * 1024) {
          reject(
            new Error(
              `Gambar masih terlalu besar setelah kompresi (${KB} KB). ` +
              `Gunakan gambar yang lebih sederhana atau kurangi resolusi.`
            )
          );
          return;
        }

        console.log(
          `[imageUtils] Kompresi selesai: ${srcWidth}×${srcHeight}px → ` +
          `${targetWidth}×${targetHeight}px | ~${KB} KB (WebP ${quality * 100}%)`
        );

        resolve(base64);
      };

      img.src = dataUrl;
    };

    // Mulai baca file
    reader.readAsDataURL(file);
  });
}

/**
 * Download string Base64 (Data URL) sebagai file .webp ke perangkat lokal.
 *
 * Cara kerja:
 * - Buat elemen <a> sementara dengan href = base64 string
 * - Set atribut `download` untuk memaksa browser menyimpan file
 * - Trigger klik programatik → browser unduh file
 * - Hapus elemen sementara dari DOM
 *
 * @param base64DataUrl - String "data:image/webp;base64,..." dari Firestore
 * @param filename      - Nama file yang diunduh (tanpa ekstensi, default: "foto-produk")
 *
 * @example
 * // Contoh penggunaan di halaman detail produk:
 * <button onClick={() => downloadBase64AsWebP(product.thumbnail_url, product.slug)}>
 *   ⬇ Download Foto
 * </button>
 */
export function downloadBase64AsWebP(
  base64DataUrl: string | null | undefined,
  filename = 'foto-produk'
): void {
  if (!base64DataUrl) {
    console.warn('[imageUtils] downloadBase64AsWebP: tidak ada data gambar.');
    return;
  }

  // Pastikan string adalah Data URL yang valid
  if (!base64DataUrl.startsWith('data:')) {
    console.warn('[imageUtils] downloadBase64AsWebP: bukan format Data URL yang valid.');
    return;
  }

  // Buat elemen <a> sementara
  const link = document.createElement('a');
  link.href     = base64DataUrl;
  link.download = `${filename}.webp`;

  // Perlu append ke DOM agar Firefox bisa trigger download
  document.body.appendChild(link);
  link.click();

  // Bersihkan elemen sementara
  document.body.removeChild(link);
}

/**
 * Helper: hitung ukuran perkiraan Base64 string dalam KB.
 * Berguna untuk ditampilkan di UI sebagai info ukuran file.
 *
 * @param base64DataUrl - String Data URL
 * @returns Ukuran perkiraan dalam KB (dibulatkan)
 */
export function estimateBase64SizeKB(base64DataUrl: string): number {
  // Hapus prefix "data:image/webp;base64," sebelum hitung
  const base64 = base64DataUrl.split(',')[1] ?? base64DataUrl;
  const bytes   = Math.round((base64.length * 3) / 4);
  return Math.round(bytes / 1024);
}
