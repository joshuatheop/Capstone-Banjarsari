'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

import { createBisnis } from '@/lib/firestore/bisnis';
import { generateSlug } from '@/lib/firestore/types';

import styles from './import.module.css';

interface ParsedRow {
  index: number; // row number (1-indexed for spreadsheet users)
  business_name: string;
  owner_name: string | null;
  business_phone: string | null;
  area_name: string | null;
  business_address: string | null;
  business_description: string | null;
  marketplace: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  isValid: boolean;
  errors: string[];
}

type ImportState = 'UPLOAD' | 'PREVIEW' | 'IMPORTING' | 'RESULT';

export default function BulkImportUmkmPage() {
  const router = useRouter();

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

  // --- 1. Download Static Excel Template ---
  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/Template UMKM.xlsx';
    link.download = 'Template UMKM.xlsx';
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

          const business_name = String(row[0] || '').trim();
          const owner_name = row[1] ? String(row[1]).trim() : null;
          const business_phone = row[2] ? String(row[2]).trim() : null;
          const area_name = row[3] ? String(row[3]).trim() : null;
          const business_address = row[4] ? String(row[4]).trim() : null;
          const business_description = row[5] ? String(row[5]).trim() : null;
          const marketplace = row[6] ? String(row[6]).trim() : null;
          const rawLat = row[7];
          const rawLng = row[8];
          const rawActive = row[9];

          // Validation container
          const rowErrors: string[] = [];
          let isValid = true;

          // Validate: Business Name
          if (!business_name) {
            rowErrors.push('Nama UMKM / Usaha wajib diisi.');
            isValid = false;
          }

          // Validate: Latitude
          let parsedLat: number | null = null;
          if (rawLat !== undefined && rawLat !== null && String(rawLat).trim() !== '') {
            parsedLat = Number(rawLat);
            if (isNaN(parsedLat)) {
              rowErrors.push('Latitude harus berupa angka.');
              isValid = false;
            }
          }

          // Validate: Longitude
          let parsedLng: number | null = null;
          if (rawLng !== undefined && rawLng !== null && String(rawLng).trim() !== '') {
            parsedLng = Number(rawLng);
            if (isNaN(parsedLng)) {
              rowErrors.push('Longitude harus berupa angka.');
              isValid = false;
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
            business_name,
            owner_name: owner_name || null,
            business_phone: business_phone || null,
            area_name: area_name || null,
            business_address: business_address || null,
            business_description: business_description || null,
            marketplace: marketplace || null,
            latitude: parsedLat,
            longitude: parsedLng,
            is_active: finalActive,
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
        await createBisnis({
          business_name: row.business_name,
          owner_name: row.owner_name,
          business_phone: row.business_phone,
          area_name: row.area_name,
          business_address: row.business_address,
          business_description: row.business_description,
          marketplace: row.marketplace,
          slug: generateSlug(row.business_name),
          latitude: row.latitude,
          longitude: row.longitude,
          business_logo_url: null, // excel imports start with no logo
          is_active: row.is_active,
        });
        successCount++;
      } catch (err) {
        console.error(`Gagal mengimpor UMKM pada baris Excel ${row.index}:`, err);
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
        <a onClick={() => router.push('/admin/umkm')}>UMKM</a>
        <span className={styles.sep}>›</span>
        <span>Bulk Import Excel / CSV</span>
      </nav>

      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.title}>Bulk Import UMKM</h1>
          <p className={styles.subtitle}>Tambahkan pelaku usaha / UMKM Banjarsari dalam jumlah banyak sekaligus.</p>
        </div>
        <div className={styles.headerActions}>

          <button
            className={styles.btnSecondary}
            onClick={() => router.push('/admin/umkm')}
            disabled={importState === 'IMPORTING'}
          >
            Kembali
          </button>
        </div>
      </div>

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
                    Gunakan template Excel standar yang sudah disediakan agar format data terbaca dengan benar.
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
                  <strong>Isi Data UMKM</strong>
                  <p style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>
                    Masukkan data nama usaha, pemilik, alamat, dan info lainnya. Isikan koordinat peta (Latitude/Longitude) berupa angka jika ada.
                  </p>
                </div>
              </li>
              <li className={styles.instructionItem}>
                <div className={styles.stepNumber}>3</div>
                <div>
                  <strong>Unggah & Verifikasi</strong>
                  <p style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>
                    Unggah file spreadsheet Anda. Periksa kebenaran baris data pada preview tabel sebelum menyimpannya ke database.
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
              <span className={styles.dropzoneIcon}>🏢</span>
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
                <strong>Semua baris valid!</strong> Seluruh {parsedRows.length} pelaku usaha siap dimasukkan ke database.
              </div>
            )}

            {/* Preview Table Card */}
            <div className={styles.card} style={{ padding: 18 }}>
              <div className={styles.previewToolbar}>
                <div className={styles.previewStats}>
                  Pilih UMKM untuk di-import: <span className={styles.statValid}>{selectedIndices.length} Valid</span> / <span className={styles.statInvalid}>{invalidCount} Invalid</span>
                </div>
                <button
                  className={styles.btnPrimary}
                  onClick={runImport}
                  disabled={selectedIndices.length === 0}
                >
                  🚀 Mulai Import ({selectedIndices.length} UMKM)
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
                      <th>Nama UMKM / Usaha</th>
                      <th>Pemilik</th>
                      <th>No Telp / WA</th>
                      <th>Wilayah/Area</th>
                      <th>Alamat Lengkap</th>
                      <th>Koordinat GPS (Lat, Lng)</th>
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
                        <td style={{ fontWeight: 600 }}>{row.business_name || '-'}</td>
                        <td>{row.owner_name || '-'}</td>
                        <td className={styles.mono}>{row.business_phone || '-'}</td>
                        <td>
                          {row.area_name ? (
                            <span className={styles.badge} style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                              {row.area_name}
                            </span>
                          ) : '-'}
                        </td>
                        <td>{row.business_address || '-'}</td>
                        <td className={styles.mono} style={{ fontSize: 11 }}>
                          {row.latitude !== null && row.longitude !== null
                            ? `${row.latitude.toFixed(6)}, ${row.longitude.toFixed(6)}`
                            : '-'}
                        </td>
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
              <h3 className={styles.progressTitle}>Mengimpor UMKM</h3>
              <p className={styles.progressSubtitle}>Jangan tutup halaman ini. Menyimpan ke database Firestore...</p>
              
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <div className={styles.mono} style={{ fontWeight: 600 }}>
                {progress.current} / {progress.total} UMKM Selesai ({Math.round((progress.current / progress.total) * 100)}%)
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
              Sistem telah selesai memproses database bulk import pelaku usaha / UMKM dari file spreadsheet Anda.
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
                onClick={() => router.push('/admin/umkm')}
              >
                Lihat Daftar UMKM
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
    </div>
  );
}
