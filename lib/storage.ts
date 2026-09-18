import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

// ============================================================
// Upload Thumbnail Produk
// Returns: download URL dari Firebase Storage
// ============================================================

export async function uploadThumbnail(file: File, productId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `produk/${productId}/thumbnail.${ext}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

// ============================================================
// Upload Satu Gambar Gallery
// Returns: download URL dari Firebase Storage
// ============================================================

export async function uploadGalleryImage(
  file: File,
  productId: string,
  index: number
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `produk/${productId}/gallery_${index}.${ext}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

// ============================================================
// Upload Multiple Gallery Images
// Returns: array download URLs
// ============================================================

export async function uploadGalleryImages(
  files: File[],
  productId: string,
  startIndex = 0
): Promise<string[]> {
  const uploads = files.map((file, i) =>
    uploadGalleryImage(file, productId, startIndex + i)
  );
  return await Promise.all(uploads);
}

// ============================================================
// Hapus File dari Storage berdasarkan URL
// ============================================================

export async function deleteStorageFile(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (err) {
    // File mungkin sudah tidak ada, abaikan error
    console.warn('[deleteStorageFile] File tidak ditemukan atau gagal dihapus:', err);
  }
}
