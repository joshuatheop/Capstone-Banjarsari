'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

import { getCategories, getBusinesses } from '@/lib/firestore/data-loader';
import { createJasa } from '@/lib/firestore/jasa';
import type { Category, Business, PriceType, AvailabilityType } from '@/lib/firestore/types';
import { generateSlug } from '@/lib/firestore/types';

import styles from './import.module.css';

interface ParsedRow {
  index: number; // row number (1-indexed for spreadsheet users)
  service_name: string;
  business_name: string;
  category_name: string;
  price_type_str: string;
  price_type: PriceType;
  minimum_price: number | null;
  maximum_price: number | null;
  is_negotiable: boolean;
  availability_type: AvailabilityType;
  whatsapp_number: string | null;
  marketplace: string | null;
  service_description: string | null;
  is_active: boolean;
  business_id: string;
  category_id: string;
  isValid: boolean;
  errors: string[];
}

type ImportState = 'UPLOAD' | 'PREVIEW' | 'IMPORTING' | 'RESULT';

export default function BulkImportJasaPage() {
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

  // Load active UMKM and Service categories from Firestore
  useEffect(() => {
    Promise.all([getCategories(), getBusinesses()])
      .then(([cats, bizs]) => {
        // Only active categories of type SERVICE
        setCategories(cats.filter((c) => c.category_type === 'SERVICE' && c.is_active !== false));
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
    link.href = '/Template Jasa.xlsx';
    link.download = 'Template Jasa.xlsx';
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

          const service_name = String(row[0] || '').trim();
          const business_name = String(row[1] || '').trim();
          const category_name = String(row[2] || '').trim();
          const rawPriceType = String(row[3] || '').trim().toUpperCase();
          const rawMinPrice = row[4];
          const rawMaxPrice = row[5];
          const rawNegotiable = String(row[6] || '').trim().toLowerCase();
          const rawAvailability = String(row[7] || '').trim().toUpperCase();
          const whatsapp_number = row[8] ? String(row[8]).trim() : null;
          const marketplace = row[9] ? String(row[9]).trim() : null;
          const service_description = row[10] ? String(row[10]).trim() : null;
          const rawActive = row[11];

          // Validation container
          const rowErrors: string[] = [];
          let isValid = true;
          let matchedBusinessId = '';
          let matchedCategoryId = '';
          let finalWhatsapp = whatsapp_number;

          // Validate: Service Name
          if (!service_name) {
            rowErrors.push('Nama Jasa wajib diisi.');
            isValid = false;
          }

          // Validate & Map: Business
          if (!business_name) {
            rowErrors.push('Nama Penyedia Jasa / UMKM wajib diisi.');
            isValid = false;
          } else {
            const matchedBiz = businesses.find(
              (b) => b.business_name.trim().toLowerCase() === business_name.toLowerCase()
            );
            if (!matchedBiz) {
              rowErrors.push(`Penyedia "${business_name}" tidak ditemukan di database.`);
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
            rowErrors.push('Kategori Jasa wajib diisi.');
            isValid = false;
          } else {
            const matchedCat = categories.find(
              (c) => c.category_name.trim().toLowerCase() === category_name.toLowerCase()
            );
            if (!matchedCat) {
              rowErrors.push(`Kategori Jasa "${category_name}" tidak ditemukan di database (Tipe: SERVICE).`);
              isValid = false;
            } else {
              matchedCategoryId = matchedCat.category_id;
            }
          }

          // Validate: Price Type & Prices (Fixed, Starting from, Range, Contact Provider)
          let finalPriceType: PriceType = 'CONTACT_PROVIDER';
          let finalMinPrice: number | null = null;
          let finalMaxPrice: number | null = null;

          if (!rawPriceType) {
            rowErrors.push('Tipe Harga wajib diisi (TETAP, MULAI DARI, RENTANG, TANYA PENYEDIA).');
            isValid = false;
          } else {
            // Price Type Matching
            if (rawPriceType === 'TETAP' || rawPriceType === 'FIXED') {
              finalPriceType = 'FIXED';
            } else if (rawPriceType === 'MULAI DARI' || rawPriceType === 'MULAI_DARI' || rawPriceType === 'STARTING_FROM' || rawPriceType === 'STARTING FROM') {
              finalPriceType = 'STARTING_FROM';
            } else if (rawPriceType === 'RENTANG' || rawPriceType === 'RANGE') {
              finalPriceType = 'RANGE';
            } else if (rawPriceType === 'TANYA PENYEDIA' || rawPriceType === 'CONTACT_PROVIDER' || rawPriceType === 'CONTACT PROVIDER' || rawPriceType === 'TANYA_PENYEDIA') {
              finalPriceType = 'CONTACT_PROVIDER';
            } else {
              rowErrors.push(`Tipe Harga "${rawPriceType}" tidak dikenal. Gunakan: TETAP, MULAI DARI, RENTANG, atau TANYA PENYEDIA.`);
              isValid = false;
            }

            // Price validation based on price type
            const minNum = Number(rawMinPrice);
            const maxNum = Number(rawMaxPrice);

            if (finalPriceType === 'FIXED' || finalPriceType === 'STARTING_FROM') {
              if (rawMinPrice === undefined || rawMinPrice === null || String(rawMinPrice).trim() === '') {
                rowErrors.push(`Harga Minimum/Utama wajib diisi jika Tipe Harga adalah ${rawPriceType}.`);
                isValid = false;
              } else if (isNaN(minNum) || minNum <= 0) {
                rowErrors.push('Harga Minimum/Utama harus berupa angka lebih besar dari 0.');
                isValid = false;
              } else {
                finalMinPrice = minNum;
              }
            } else if (finalPriceType === 'RANGE') {
              let rangeValid = true;
              if (rawMinPrice === undefined || rawMinPrice === null || String(rawMinPrice).trim() === '') {
                rowErrors.push('Harga Minimum wajib diisi jika Tipe Harga adalah RENTANG.');
                isValid = false;
                rangeValid = false;
              } else if (isNaN(minNum) || minNum <= 0) {
                rowErrors.push('Harga Minimum harus berupa angka lebih besar dari 0.');
                isValid = false;
                rangeValid = false;
              }

              if (rawMaxPrice === undefined || rawMaxPrice === null || String(rawMaxPrice).trim() === '') {
                rowErrors.push('Harga Maksimum wajib diisi jika Tipe Harga adalah RENTANG.');
                isValid = false;
                rangeValid = false;
              } else if (isNaN(maxNum) || maxNum <= 0) {
                rowErrors.push('Harga Maksimum harus berupa angka lebih besar dari 0.');
                isValid = false;
                rangeValid = false;
              }

              if (rangeValid) {
                if (maxNum <= minNum) {
                  rowErrors.push('Harga Maksimum harus lebih besar dari Harga Minimum.');
                  isValid = false;
                } else {
                  finalMinPrice = minNum;
                  finalMaxPrice = maxNum;
                }
              }
            }
          }

          // Map: is_negotiable (Default TIDAK/false)
          let finalNegotiable = false;
          if (rawNegotiable === 'ya' || rawNegotiable === 'yes' || rawNegotiable === 'true' || rawNegotiable === '1') {
            finalNegotiable = true;
          }

          // Map: Availability Type (Default ALWAYS_AVAILABLE)
          let finalAvailability: AvailabilityType = 'ALWAYS_AVAILABLE';
          if (rawAvailability) {
            if (rawAvailability === 'SELALU TERSEDIA' || rawAvailability === 'SELALU_TERSEDIA' || rawAvailability === 'ALWAYS_AVAILABLE' || rawAvailability === 'ALWAYS AVAILABLE' || rawAvailability === 'SELALU ADA') {
              finalAvailability = 'ALWAYS_AVAILABLE';
            } else if (rawAvailability === 'SESUAI JADWAL' || rawAvailability === 'SESUAI_JADWAL' || rawAvailability === 'BY_SCHEDULE' || rawAvailability === 'BY SCHEDULE' || rawAvailability === 'JADWAL') {
              finalAvailability = 'BY_SCHEDULE';
            } else if (rawAvailability === 'SESUAI PERMINTAAN' || rawAvailability === 'SESUAI_PERMINTAAN' || rawAvailability === 'BY_REQUEST' || rawAvailability === 'BY REQUEST' || rawAvailability === 'PERMINTAAN') {
              finalAvailability = 'BY_REQUEST';
            } else if (rawAvailability === 'SEMENTARA TIDAK TERSEDIA' || rawAvailability === 'SEMENTARA_TIDAK_TERSEDIA' || rawAvailability === 'TEMPORARILY_UNAVAILABLE' || rawAvailability === 'TEMPORARILY UNAVAILABLE') {
              finalAvailability = 'TEMPORARILY_UNAVAILABLE';
            }
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
            service_name,
            business_name,
            category_name,
            price_type_str: row[3] ? String(row[3]).trim() : '',
            price_type: finalPriceType,
            minimum_price: finalMinPrice,
            maximum_price: finalMaxPrice,
            is_negotiable: finalNegotiable,
            availability_type: finalAvailability,
            whatsapp_number: finalWhatsapp || null,
            marketplace: marketplace || null,
            service_description: service_description || null,
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
        await createJasa({
          business_id: row.business_id,
          category_id: row.category_id,
          service_name: row.service_name,
          service_description: row.service_description,
          minimum_price: row.minimum_price,
          maximum_price: row.maximum_price,
          price_type: row.price_type,
          is_negotiable: row.is_negotiable,
          whatsapp_number: row.whatsapp_number,
          marketplace: row.marketplace,
          availability_type: row.availability_type,
          slug: generateSlug(row.service_name),
          thumbnail_url: null, // excel imports starts with no image
          is_active: row.is_active,
        });
        successCount++;
      } catch (err) {
        console.error(`Gagal mengimpor Jasa pada baris Excel ${row.index}:`, err);
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

  const getPriceDisplayStr = (row: ParsedRow) => {
    const fmt = (val: number | null) => val ? `Rp ${val.toLocaleString('id-ID')}` : 'Rp 0';
    if (row.price_type === 'FIXED') return fmt(row.minimum_price);
    if (row.price_type === 'STARTING_FROM') return `Mulai ${fmt(row.minimum_price)}`;
    if (row.price_type === 'RANGE') return `${fmt(row.minimum_price)} - ${fmt(row.maximum_price)}`;
    return 'Hubungi Penyedia';
  };

  const getAvailabilityLabel = (type: AvailabilityType) => {
    if (type === 'ALWAYS_AVAILABLE') return 'Selalu Tersedia';
    if (type === 'BY_SCHEDULE') return 'Sesuai Jadwal';
    if (type === 'BY_REQUEST') return 'Sesuai Permintaan';
    return 'Sementara Tutup';
  };

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <a onClick={() => router.push('/admin/jasa')}>Jasa</a>
        <span className={styles.sep}>›</span>
        <span>Bulk Import Excel / CSV</span>
      </nav>

      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.title}>Bulk Import Jasa</h1>
          <p className={styles.subtitle}>Tambahkan layanan Jasa/Keahlian UMKM Banjarsari dalam jumlah banyak sekaligus.</p>
        </div>
        <div className={styles.headerActions}>

          <button
            className={styles.btnSecondary}
            onClick={() => router.push('/admin/jasa')}
            disabled={importState === 'IMPORTING'}
          >
            Kembali
          </button>
        </div>
      </div>

      {loadingConfig ? (
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div>Memuat data konfigurasi UMKM & Kategori Jasa...</div>
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
                      Gunakan template Excel standar Jasa yang sudah disiapkan agar pembacaan kolom akurat.
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
                    <strong>Isi Data Jasa & Harga</strong>
                    <p style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>
                      Tentukan Tipe Harga (TETAP, MULAI DARI, RENTANG, TANYA PENYEDIA) dan isi nominal harga minimum/maksimum yang bersesuaian.
                    </p>
                  </div>
                </li>
                <li className={styles.instructionItem}>
                  <div className={styles.stepNumber}>3</div>
                  <div>
                    <strong>Unggah & Verifikasi</strong>
                    <p style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>
                      Unggah berkas di sini. Tinjau apakah baris sudah valid atau terdapat error khusus tipe harga sebelum klik Mulai Import.
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
                <span className={styles.dropzoneIcon}>🛠️</span>
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
                  <strong>Perhatian:</strong> Ditemukan <strong>{invalidCount} baris tidak valid</strong> dari total {parsedRows.length} baris. Baris yang memiliki error tidak akan di-import.
                </div>
              ) : (
                <div className={`${styles.alert} ${styles.alertInfo}`}>
                  <strong>Semua baris valid!</strong> Seluruh {parsedRows.length} layanan jasa siap dimasukkan ke database.
                </div>
              )}

              {/* Preview Table Card */}
              <div className={styles.card} style={{ padding: 18 }}>
                <div className={styles.previewToolbar}>
                  <div className={styles.previewStats}>
                    Pilih jasa untuk di-import: <span className={styles.statValid}>{selectedIndices.length} Valid</span> / <span className={styles.statInvalid}>{invalidCount} Invalid</span>
                  </div>
                  <button
                    className={styles.btnPrimary}
                    onClick={runImport}
                    disabled={selectedIndices.length === 0}
                  >
                    🚀 Mulai Import ({selectedIndices.length} Jasa)
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
                        <th>Nama Jasa</th>
                        <th>Penyedia / UMKM</th>
                        <th>Kategori Jasa</th>
                        <th>Tipe Harga</th>
                        <th>Format Tampilan Harga</th>
                        <th>Nego?</th>
                        <th>Ketersediaan</th>
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
                          <td style={{ fontWeight: 600 }}>{row.service_name || '-'}</td>
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
                          <td>
                            <span className={styles.badge} style={{ fontSize: 10, background: '#eaf4fe', color: '#0052cc' }}>
                              {row.price_type_str || row.price_type}
                            </span>
                          </td>
                          <td className={styles.mono} style={{ fontWeight: 600 }}>
                            {getPriceDisplayStr(row)}
                          </td>
                          <td style={{ fontWeight: 600, color: row.is_negotiable ? '#27ae60' : 'var(--text-muted)' }}>
                            {row.is_negotiable ? 'YA' : 'TIDAK'}
                          </td>
                          <td>{getAvailabilityLabel(row.availability_type)}</td>
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
                <h3 className={styles.progressTitle}>Mengimpor Jasa</h3>
                <p className={styles.progressSubtitle}>Jangan tutup halaman ini. Menyimpan ke database Firestore...</p>
                
                <div className={styles.progressBarContainer}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <div className={styles.mono} style={{ fontWeight: 600 }}>
                  {progress.current} / {progress.total} Jasa Selesai ({Math.round((progress.current / progress.total) * 100)}%)
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
                Sistem telah selesai memproses database bulk import layanan Jasa dari file spreadsheet Anda.
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
                  onClick={() => router.push('/admin/jasa')}
                >
                  Lihat Daftar Jasa
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
