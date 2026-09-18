'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

import { getCategories, getBusinesses } from '@/lib/firestore/data-loader';
import { createProduk } from '@/lib/firestore/produk';
import type { Category, Business } from '@/lib/firestore/types';
import { generateSlug } from '@/lib/firestore/types';

import styles from './import.module.css';

interface ParsedRow {
  index: number; // row number (1-indexed for spreadsheet users)
  product_name: string;
  business_name: string;
  category_name: string;
  product_price: number;
  product_description: string | null;
  whatsapp_number: string | null;
  marketplace: string | null;
  media_sosial: string | null;
  is_active: boolean;
  business_id: string;
  category_id: string;
  isValid: boolean;
  errors: string[];
}

type ImportState = 'UPLOAD' | 'PREVIEW' | 'IMPORTING' | 'RESULT';

export default function BulkImportProdukPage() {
  const router = useRouter();

  // Reference lists from Firestore
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Import flow state
  const [importState, setImportState] = useState<ImportState>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Processing state
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active UMKM and Product categories from Firestore
  useEffect(() => {
    Promise.all([getCategories(), getBusinesses()])
      .then(([cats, bizs]) => {
        // Only active categories of type PRODUCT
        setCategories(cats.filter((c) => c.category_type === 'PRODUCT' && c.is_active !== false));
        setBusinesses(bizs.filter((b) => b.is_active !== false));
      })
      .catch((err) => {
        console.error('Failed to load businesses or categories:', err);
      })
      .finally(() => {
        setLoadingConfig(false);
      });
  }, []);

  // --- 1. Download Static Excel Template ---
  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/Template Produk.xlsx';
    link.download = 'Template Produk.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 2. Parsing and Validation ---
  const parseFile = (targetFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse sheet to 2D Array of rows
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rawRows.length <= 1) {
          alert('File kosong atau hanya memiliki baris header.');
          return;
        }

        const parsed: ParsedRow[] = [];

        // Loop rows (skipping index 0 which is header)
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];

          // Skip if row is completely empty
          if (!row || row.length === 0 || row.every((cell) => cell === undefined || cell === null || String(cell).trim() === '')) {
            continue;
          }

          const product_name = String(row[0] || '').trim();
          const business_name = String(row[1] || '').trim();
          const category_name = String(row[2] || '').trim();
          const rawPrice = row[3];
          const product_description = row[4] ? String(row[4]).trim() : null;
          const whatsapp_number = row[5] ? String(row[5]).trim() : null;
          const marketplace = row[6] ? String(row[6]).trim() : null;
          const media_sosial = row[7] ? String(row[7]).trim() : null;
          const rawActive = row[8];

          // Validation container
          const rowErrors: string[] = [];
          let isValid = true;
          let matchedBusinessId = '';
          let matchedCategoryId = '';
          let finalWhatsapp = whatsapp_number;

          // Validate: Product Name
          if (!product_name) {
            rowErrors.push('Nama Produk wajib diisi.');
            isValid = false;
          }

          // Validate & Map: Business
          if (!business_name) {
            rowErrors.push('Nama UMKM wajib diisi.');
            isValid = false;
          } else {
            const matchedBiz = businesses.find(
              (b) => b.business_name.trim().toLowerCase() === business_name.toLowerCase()
            );
            if (!matchedBiz) {
              rowErrors.push(`UMKM "${business_name}" tidak ditemukan di database.`);
              isValid = false;
            } else {
              matchedBusinessId = matchedBiz.business_id;
              // Fallback WhatsApp if empty
              if (!whatsapp_number || whatsapp_number === '') {
                finalWhatsapp = matchedBiz.business_phone || null;
              }
            }
          }

          // Validate & Map: Category
          if (!category_name) {
            rowErrors.push('Kategori wajib diisi.');
            isValid = false;
          } else {
            const matchedCat = categories.find(
              (c) => c.category_name.trim().toLowerCase() === category_name.toLowerCase()
            );
            if (!matchedCat) {
              rowErrors.push(`Kategori "${category_name}" tidak ditemukan di database.`);
              isValid = false;
            } else {
              matchedCategoryId = matchedCat.category_id;
            }
          }

          // Validate: Price
          const parsedPrice = Number(rawPrice);
          if (rawPrice === undefined || rawPrice === null || rawPrice === '') {
            rowErrors.push('Harga wajib diisi.');
            isValid = false;
          } else if (isNaN(parsedPrice) || parsedPrice <= 0) {
            rowErrors.push('Harga harus berupa angka lebih besar dari 0.');
            isValid = false;
          }

          // Map: is_active status (Default YES/YA)
          let finalActive = true;
          if (rawActive !== undefined && rawActive !== null) {
            const activeStr = String(rawActive).trim().toLowerCase();
            if (activeStr === 'tidak' || activeStr === 'no' || activeStr === 'false' || activeStr === '0') {
              finalActive = false;
            }
          }

          parsed.push({
            index: i + 1, // original Excel line number
            product_name,
            business_name,
            category_name,
            product_price: isNaN(parsedPrice) ? 0 : parsedPrice,
            product_description: product_description || null,
            whatsapp_number: finalWhatsapp || null,
            marketplace: marketplace || null,
            media_sosial: media_sosial || null,
            is_active: finalActive,
            business_id: matchedBusinessId,
            category_id: matchedCategoryId,
            isValid,
            errors: rowErrors
          });
        }

        setParsedRows(parsed);
        // Pre-select valid rows by default
        const validIndices = parsed.filter((r) => r.isValid).map((r) => r.index);
        setSelectedIndices(validIndices);
        setImportState('PREVIEW');
      } catch (err) {
        console.error('Parsing error:', err);
        alert('Gagal membaca file Excel. Harap periksa format file Anda.');
      }
    };
    reader.readAsBinaryString(targetFile);
  };

  // --- 3. Drag and Drop handlers ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'csv') {
        setFile(droppedFile);
        parseFile(droppedFile);
      } else {
        alert('Hanya file .xlsx (Excel) atau .csv yang didukung.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setParsedRows([]);
    setSelectedIndices([]);
    setImportState('UPLOAD');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- 4. Selection helpers ---
  const toggleSelectRow = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all valid rows
      setSelectedIndices(parsedRows.filter((r) => r.isValid).map((r) => r.index));
    } else {
      setSelectedIndices([]);
    }
  };

  // --- 5. Bulk Database Execution ---
  const runImport = async () => {
    const rowsToImport = parsedRows.filter((row) => selectedIndices.includes(row.index));
    if (rowsToImport.length === 0) {
      alert('Tidak ada baris valid yang dipilih untuk di-import.');
      return;
    }

    setImportState('IMPORTING');
    setProgress({ current: 0, total: rowsToImport.length });
    setImportResults({ success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rowsToImport.length; i++) {
      const row = rowsToImport[i];
      try {
        await createProduk({
          business_id: row.business_id,
          category_id: row.category_id,
          product_name: row.product_name,
          product_description: row.product_description,
          product_price: row.product_price,
          slug: generateSlug(row.product_name),
          whatsapp_number: row.whatsapp_number,
          marketplace: row.marketplace,
          media_sosial: row.media_sosial,
          thumbnail_url: null, // excel imports starts with no image thumbnail
          is_active: row.is_active,
        });
        successCount++;
      } catch (err) {
        console.error(`Gagal mengimpor produk pada baris Excel ${row.index}:`, err);
        failedCount++;
      }
      setProgress((p) => ({ ...p, current: i + 1 }));
    }

    setImportResults({ success: successCount, failed: failedCount });
    setImportState('RESULT');
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;
  const allValidChecked = selectedIndices.length === validCount && validCount > 0;

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <a onClick={() => router.push('/admin/produk')}>Produk</a>
        <span className={styles.sep}>›</span>
        <span>Bulk Import Excel / CSV</span>
      </nav>

      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.title}>Bulk Import Produk</h1>
          <p className={styles.subtitle}>Tambahkan puluhan produk UMKM sekaligus menggunakan spreadsheet.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.btnSecondary}
            onClick={() => router.push('/admin/produk')}
            disabled={importState === 'IMPORTING'}
          >
            Kembali
          </button>
        </div>
      </div>

      {loadingConfig ? (
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div>Memuat data konfigurasi UMKM & Kategori...</div>
        </div>
      ) : (
        <div className={importState === 'UPLOAD' ? styles.importGrid : ''}>
          
          {/* UPLOAD STATE - Left Column: Instructions */}
          {importState === 'UPLOAD' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Langkah Penggunaan</h3>
                <p className={styles.cardDesc}>Ikuti panduan berikut agar proses import sukses.</p>
              </div>

              <ul className={styles.instructionList}>
                <li className={styles.instructionItem}>
                  <div className={styles.stepNumber}>1</div>
                  <div>
                    <strong>Unduh Template</strong>
                    <p style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>
                      Dapatkan template Excel terbaru dengan daftar nama UMKM dan Kategori yang valid di dalamnya.
                    </p>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      style={{ marginTop: 8, padding: '6px 14px', fontSize: '12px' }}
                      onClick={downloadTemplate}
                    >
                      📥 Unduh Template Excel
                    </button>
                  </div>
                </li>
                <li className={styles.instructionItem}>
                  <div className={styles.stepNumber}>2</div>
                  <div>
                    <strong>Isi Data Produk</strong>
                    <p style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>
                      Isi data produk pada sheet pertama. Pastikan nama UMKM dan Kategori ditulis persis (tanpa typo) sesuai daftar referensi pada sheet kedua.
                    </p>
                  </div>
                </li>
                <li className={styles.instructionItem}>
                  <div className={styles.stepNumber}>3</div>
                  <div>
                    <strong>Unggah & Verifikasi</strong>
                    <p style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>
                      Unggah file di sini. Tinjau baris data yang valid dan perbaiki baris dengan error sebelum melanjutkan.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          )}

          {/* UPLOAD STATE - Right Column: Dropzone */}
          {importState === 'UPLOAD' && (
            <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div
                className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className={styles.fileInput}
                  accept=".xlsx, .csv"
                  onChange={handleFileChange}
                />
                <span className={styles.dropzoneIcon}>xls</span>
                <span className={styles.dropzoneText}>Tarik & letakkan file Excel atau CSV di sini</span>
                <span className={styles.dropzoneSubtext}>atau klik untuk memilih file dari komputer (.xlsx, .csv)</span>
              </div>
            </div>
          )}

          {/* PREVIEW STATE */}
          {importState === 'PREVIEW' && (
            <div className={styles.previewSection}>
              {/* File Info Alert */}
              <div className={styles.fileMeta}>
                <span className={styles.fileIcon}>📄</span>
                <div className={styles.fileDetails}>
                  <div className={styles.fileName}>{file?.name}</div>
                  <div className={styles.fileSize}>
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : ''} • {parsedRows.length} baris terdeteksi
                  </div>
                </div>
                <button className={styles.btnRemoveFile} onClick={removeFile} title="Hapus file">
                  ✕ Hapus
                </button>
              </div>

              {/* Status Alert Summary */}
              {invalidCount > 0 ? (
                <div className={`${styles.alert} ${styles.alertWarning}`}>
                  <strong>Perhatian:</strong> Ditemukan <strong>{invalidCount} baris tidak valid</strong> dari total {parsedRows.length} baris. Baris yang salah ketik / error tidak akan di-import. Anda bisa melanjutkan import untuk baris yang valid saja.
                </div>
              ) : (
                <div className={`${styles.alert} ${styles.alertInfo}`}>
                  <strong>Semua baris valid!</strong> Seluruh {parsedRows.length} produk siap dimasukkan ke database.
                </div>
              )}

              {/* Preview Table Card */}
              <div className={styles.card} style={{ padding: 18 }}>
                <div className={styles.previewToolbar}>
                  <div className={styles.previewStats}>
                    Pilih produk untuk di-import: <span className={styles.statValid}>{selectedIndices.length} Valid</span> / <span className={styles.statInvalid}>{invalidCount} Invalid</span>
                  </div>
                  <button
                    className={styles.btnPrimary}
                    onClick={runImport}
                    disabled={selectedIndices.length === 0}
                  >
                    🚀 Mulai Import ({selectedIndices.length} Produk)
                  </button>
                </div>

                <div className={styles.tableWrap} style={{ marginTop: 14 }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: 40, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            className={styles.rowCheckbox}
                            checked={allValidChecked}
                            onChange={(e) => toggleSelectAll(e.target.checked)}
                            disabled={validCount === 0}
                          />
                        </th>
                        <th style={{ width: 60, textAlign: 'center' }}>Baris</th>
                        <th style={{ width: 100 }}>Status</th>
                        <th>Nama Produk</th>
                        <th>UMKM Pemilik</th>
                        <th>Kategori</th>
                        <th>Harga</th>
                        <th>No WA (WhatsApp)</th>
                        <th>Detail Validasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row) => (
                        <tr
                          key={row.index}
                          className={row.isValid ? styles.rowValid : styles.rowInvalid}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              className={styles.rowCheckbox}
                              checked={selectedIndices.includes(row.index)}
                              onChange={() => toggleSelectRow(row.index)}
                              disabled={!row.isValid}
                            />
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.index}</td>
                          <td>
                            {row.isValid ? (
                              <span className={`${styles.badge} ${styles.badgeSuccess}`}>VALID</span>
                            ) : (
                              <span className={`${styles.badge} ${styles.badgeDanger}`}>ERROR</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600 }}>{row.product_name || '-'}</td>
                          <td>
                            {row.business_name || '-'}
                            {row.business_id && (
                              <span className={styles.badge} style={{ fontSize: 9, marginLeft: 6, background: '#e1ebe5', color: '#163c26' }}>MAPPED</span>
                            )}
                          </td>
                          <td>
                            <span className={styles.badge} style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                              {row.category_name || '-'}
                            </span>
                          </td>
                          <td className={styles.mono} style={{ fontWeight: 600 }}>
                            {row.product_price ? `Rp ${row.product_price.toLocaleString('id-ID')}` : 'Rp 0'}
                          </td>
                          <td className={styles.mono}>{row.whatsapp_number || '-'}</td>
                          <td>
                            {row.isValid ? (
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                Siap di-import.
                              </span>
                            ) : (
                              <ul className={styles.errorList}>
                                {row.errors.map((err, idx) => (
                                  <li key={idx}>{err}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* IMPORTING STATE */}
          {importState === 'IMPORTING' && (
            <div className={styles.card} style={{ maxWidth: 500, margin: '60px auto' }}>
              <div className={styles.progressCard}>
                <div className={styles.progressSpinner} />
                <h3 className={styles.progressTitle}>Mengimpor Produk</h3>
                <p className={styles.progressSubtitle}>Jangan tutup halaman ini. Menyimpan ke database Firestore...</p>
                
                <div className={styles.progressBarContainer}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <div className={styles.mono} style={{ fontWeight: 600 }}>
                  {progress.current} / {progress.total} Produk Selesai ({Math.round((progress.current / progress.total) * 100)}%)
                </div>
              </div>
            </div>
          )}

          {/* RESULT STATE */}
          {importState === 'RESULT' && (
            <div className={styles.card} style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
              <div className={styles.resultIcon}>🎉</div>
              <h2 className={styles.resultTitle}>Proses Import Selesai!</h2>
              <p className={styles.resultDesc}>
                Sistem telah selesai memproses database bulk import produk dari file spreadsheet Anda.
              </p>

              <div className={styles.resultStatsGrid}>
                <div className={styles.resultStatCard}>
                  <div className={`${styles.resultStatVal} ${styles.success}`}>
                    {importResults.success}
                  </div>
                  <div className={styles.resultStatLabel}>Berhasil</div>
                </div>
                <div className={styles.resultStatCard}>
                  <div className={`${styles.resultStatVal} ${styles.failed}`}>
                    {importResults.failed}
                  </div>
                  <div className={styles.resultStatLabel}>Gagal</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  className={styles.btnPrimary}
                  onClick={() => router.push('/admin/produk')}
                >
                  Lihat Katalog Produk
                </button>
                <button
                  className={styles.btnSecondary}
                  onClick={removeFile}
                >
                  Import File Lain
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
