# 🤖 Agent Guidebook — PALUGADA E-Commerce Banjarsari

> Dokumen ini adalah **panduan wajib** bagi AI agent sebelum memulai pengembangan fitur apapun.
> Baca seluruh dokumen ini terlebih dahulu sebelum menulis satu baris kode pun.

---

## 📌 Tentang Proyek

**Nama Proyek:** PALUGADA — Katalog UMKM & Jasa Banjarsari  
**Deskripsi:** Platform e-commerce / katalog digital untuk UMKM dan pelaku jasa di Kelurahan Banjarsari.  
**Referensi UI:** Folder `UI Katalog v1/` (HTML prototype sudah ada di `index.html`)  
**Framework:** Next.js (App Router)  
**Database:** Firebase (Firestore + Storage + Auth)

---

## ⚠️ ATURAN WAJIB SEBELUM DEVELOP FITUR BARU

> **STOP! Sebelum mulai koding fitur baru, kamu HARUS:**
>
> 1. **Tanyakan kepada user** apa saja **aksi/action** yang bisa dilakukan dari fitur tersebut  
>    (contoh: bisa tambah, edit, hapus? siapa yang bisa melakukannya?)
> 2. **Konfirmasi struktur variabel/kolom tabel** di Firebase yang akan digunakan
> 3. Tunggu persetujuan user sebelum mulai implementasi
> 4. Catat semua perubahan framework/modul baru di bagian **[Tech Stack Log]** di bawah

---

## 🎨 Design System

### Color Palette (TIDAK BOLEH DIGANTI TANPA IZIN)

| Token          | Hex       | Nama         | Penggunaan                        |
|----------------|-----------|--------------|-----------------------------------|
| `--primary`    | `#05472B` | Dark Green   | Warna utama, CTA button, header   |
| `--secondary`  | `#AADCAB` | Light Green  | Aksen sekunder, highlight, badge  |
| `--dark`       | `#013020` | Dark Green   | Background gelap, footer          |
| `--accent-y`   | `#CDFF00` | Yellow Green | Aksen vibrant, hover, highlight   |
| `--aqua`       | `#00C0A3` | Aqua Green   | Ikon, status aktif, tag           |
| `--black`      | `#000000` | Black        | Teks utama, kontras tinggi        |
| `--white`      | `#FFFFFF` | White        | Background, surface, teks terang  |

> ⚠️ **DILARANG** menggunakan warna lain di luar tabel di atas tanpa persetujuan user.  
> Jangan mengambil warna dari prototype lama (`cream`, `clay`, `ochre`, `ink`, `palm`).  
> Semua CSS variable harus mengacu pada token di atas.

### Contoh CSS Variables yang Benar

```css
:root {
  --color-primary:   #05472B;
  --color-secondary: #AADCAB;
  --color-dark:      #013020;
  --color-accent:    #CDFF00;
  --color-aqua:      #00C0A3;
  --color-black:     #000000;
  --color-white:     #FFFFFF;
}
```

### Typography

| Elemen      | Font Family       | Import                                              |
|-------------|-------------------|-----------------------------------------------------|
| **Heading** | `JetBrains Mono`  | `@import` dari Google Fonts                        |
| **Body**    | `Plus Jakarta Sans` | `@import` dari Google Fonts                      |

```css
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

:root {
  --font-heading: 'JetBrains Mono', ui-monospace, monospace;
  --font-body:    'Plus Jakarta Sans', system-ui, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

body, p, span, input, button {
  font-family: var(--font-body);
}
```

---

## 🏗️ Arsitektur Proyek (Next.js)

```
/
├── app/                        # App Router Next.js
│   ├── layout.tsx              # Root layout (font, metadata global)
│   ├── page.tsx                # Halaman utama / Home
│   ├── katalog/
│   │   └── page.tsx            # Halaman katalog produk
│   ├── produk/
│   │   └── [id]/page.tsx       # Detail produk
│   ├── toko/
│   │   └── [id]/page.tsx       # Profil toko / pelaku usaha
│   └── admin/
│       ├── layout.tsx          # Admin layout (sidebar)
│       ├── page.tsx            # Dashboard admin
│       ├── produk/page.tsx     # Manajemen produk
│       └── toko/page.tsx       # Manajemen toko
├── components/                 # Komponen reusable
│   ├── ui/                     # Komponen UI dasar
│   └── shared/                 # Komponen yang dipakai di banyak halaman
├── lib/
│   ├── firebase.ts             # Konfigurasi Firebase
│   └── firestore/              # Helper functions Firestore
├── public/                     # Asset statis
└── styles/
    └── globals.css             # CSS global + design tokens
```

---

## 🔥 Firebase Setup

### Layanan Firebase yang Digunakan

| Layanan          | Kegunaan                                |
|------------------|-----------------------------------------|
| Firestore        | Database utama (produk, toko, kategori) |
| Firebase Storage | Upload foto produk dan toko             |
| Firebase Auth    | Autentikasi admin / pemilik toko        |

### Konfigurasi Firebase

Simpan konfigurasi di file `.env.local` (JANGAN di-commit ke git):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 📄 Halaman & Screens (Referensi UI Katalog v1)

Berikut adalah daftar halaman yang sudah ada prototipenya di folder `screens/`:

| File Prototype           | Halaman di Next.js         | Keterangan                         |
|--------------------------|----------------------------|------------------------------------|
| `screens/home.jsx`       | `app/page.tsx`             | Landing page + hero + produk unggulan |
| `screens/catalog.jsx`    | `app/katalog/page.tsx`     | Grid produk + filter + search      |
| `screens/details.jsx`    | `app/produk/[id]/page.tsx` | Detail produk lengkap              |
| `screens/business.jsx`   | `app/toko/[id]/page.tsx`   | Profil toko / UMKM                 |
| `screens/admin-dashboard.jsx` | `app/admin/page.tsx`  | Dashboard statistik admin          |
| `screens/admin-master.jsx`    | `app/admin/produk/page.tsx` | Tabel manajemen produk          |
| `screens/admin-edit.jsx`      | `app/admin/produk/[id]/page.tsx` | Form edit / tambah produk   |

> Selalu jadikan file di `screens/` sebagai referensi visual utama saat membangun halaman.

---

## 🔑 Aturan Coding

### 1. CSS & Styling
- Gunakan **Vanilla CSS** (CSS Modules di Next.js: `*.module.css`) atau **inline style** dengan CSS variables
- **DILARANG** menggunakan Tailwind CSS kecuali diminta
- Semua warna harus melalui CSS variable yang sudah didefinisikan
- Jaga konsistensi spacing menggunakan kelipatan `8px` (8, 16, 24, 32, 48, 64...)

### 2. Komponen
- Semua komponen ditulis dalam **TypeScript** (`.tsx`)
- Gunakan **functional component** dengan arrow function
- Props harus dideklarasikan dengan **interface** TypeScript
- Contoh:
  ```tsx
  interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    category: string;
  }
  
  const ProductCard = ({ id, name, price, imageUrl, category }: ProductCardProps) => {
    return (/* JSX */);
  };
  
  export default ProductCard;
  ```

### 3. Firebase / Data Fetching
- Semua operasi Firestore dibungkus dalam fungsi helper di `lib/firestore/`
- Gunakan **Server Components** Next.js untuk fetching data yang tidak butuh interaktivitas
- Gunakan **Client Components** (`'use client'`) hanya jika perlu state atau event handler
- Jangan expose Firebase config di client-side yang tidak perlu

### 4. Naming Convention
- **File:** `kebab-case` untuk file CSS, `PascalCase` untuk komponen
- **Variable/fungsi:** `camelCase`
- **Konstanta:** `UPPER_SNAKE_CASE`
- **Koleksi Firestore:** `camelCase` (misal: `produk`, `kategoris`, `pelakuUsaha`)

---

## 🗂️ Struktur Data Firebase (akan diupdate per fitur)

> ⚠️ Bagian ini wajib diisi/dikonfirmasi sebelum develop setiap fitur baru.

### Koleksi: `produk`
> *(Akan dikonfirmasi dengan user sebelum implementasi)*

```
produk/{produkId}
├── nama          : string
├── deskripsi     : string
├── harga         : number
├── kategori      : string (ref ke koleksi kategori)
├── tokoId        : string (ref ke koleksi toko)
├── fotoUrls      : string[]
├── status        : 'aktif' | 'nonaktif'
├── createdAt     : Timestamp
└── updatedAt     : Timestamp
```

### Koleksi: `toko`
> *(Akan dikonfirmasi dengan user sebelum implementasi)*

```
toko/{tokoId}
├── nama          : string
├── pemilik       : string
├── deskripsi     : string
├── kategori      : string
├── alamat        : string
├── noWA          : string
├── fotoUrl       : string
├── status        : 'aktif' | 'nonaktif'
├── createdAt     : Timestamp
└── updatedAt     : Timestamp
```

### Koleksi: `kategori`
> *(Akan dikonfirmasi dengan user sebelum implementasi)*

```
kategori/{kategoriId}
├── nama          : string
├── slug          : string
└── icon          : string
```

### Koleksi: `users`
```
users/{uid}
├── email           : string
├── role            : 'admin' | 'pelanggan'
├── displayName     : string (opsional)
├── photoURL        : string (opsional)
├── alamat          : string (opsional)
├── kewarganegaraan : string (opsional)
├── noTelepon       : string (opsional)
├── createdAt       : Timestamp
└── updatedAt       : Timestamp
```

---

## 📦 Tech Stack Log

> Setiap kali menambahkan framework, library, atau modul baru, **WAJIB** mencatatnya di sini.

| Tanggal    | Paket / Library             | Versi    | Alasan Penambahan                         |
|------------|-----------------------------|----------|-------------------------------------------|
| 2026-06-30 | `next`                      | 16.2.9   | Framework utama (App Router)              |
| 2026-06-30 | `react` + `react-dom`       | 19.2.4   | UI library                                |
| 2026-06-30 | `typescript`                | ^5       | Type safety                               |
| 2026-06-30 | `firebase`                  | ^12.15.0 | Backend: Firestore, Auth, Storage         |
| 2026-06-30 | `eslint` + `eslint-config-next` | ^9 / 16.2.9 | Linting                          |
| 2026-06-30 | `Plus Jakarta Sans` (font)  | -        | Font body (via next/font/google)          |
| 2026-06-30 | `JetBrains Mono` (font)     | -        | Font heading (via next/font/google)       |
| 2026-07-02 | Google Auth & Register      | -        | Integrasi Google Sign-in & Register Page  |

---

## 🗂️ File Baru yang Sudah Dibuat

| File | Keterangan |
|---|---|
| `app/globals.css` | Design system dengan color palette PALUGADA (hijau) |
| `app/layout.tsx` | Root layout: font JetBrains Mono + Plus Jakarta Sans + AuthProvider |
| `app/page.tsx` + `page.module.css` | Homepage publik |
| `app/login/page.tsx` + `login.module.css` | Halaman login (path: `/login`) |
| `app/register/page.tsx` + `register.module.css` | Halaman registrasi (path: `/register`) |
| `app/profile/page.tsx` + `profile.module.css` | Halaman profil pengguna (path: `/profile`) |
| `app/admin/layout.tsx` + `admin.module.css` | Admin layout dengan sidebar + auth guard |
| `app/admin/page.tsx` + `dashboard.module.css` | Admin dashboard (kosong) |
| `context/AuthContext.tsx` | React Context: user state + role dari Firestore |
| `lib/auth.ts` | Helper: `getUserRole()`, `createUserDocument()`, `updateUserDocument()`, `getUserDocument()` |
| `lib/seedAdmin.ts` | Seeder: buat akun admin `admin2@banjarsari.com` |

## 🔐 Firestore Rules — WAJIB diset di Firebase Console

Sebelum fitur berjalan sempurna di production, set Firestore Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Koleksi users: hanya bisa dibaca oleh user sendiri
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    // Koleksi lain: tambahkan sesuai kebutuhan
  }
}
```

> ⚠️ Saat development, boleh pakai test mode. Tapi sebelum production, rules HARUS diset!

---

## 🔄 Alur Kerja Standar (Wajib Diikuti)

```
1. User minta fitur baru
        ↓
2. Agent WAJIB tanya:
   a. Apa saja aksi yang bisa dilakukan? (CRUD? siapa yang bisa?)
   b. Apa variabel/kolom yang dibutuhkan di database?
        ↓
3. Tunggu konfirmasi user
        ↓
4. Buat implementation plan (jika kompleks)
        ↓
5. Implement fitur sesuai design system ini
        ↓
6. Update agent.md jika ada perubahan tech stack / struktur data
        ↓
7. Laporkan perubahan yang dilakukan kepada user
```

---

## 🚫 Larangan (DO NOT)

- ❌ Jangan gunakan warna di luar color palette yang sudah ditentukan
- ❌ Jangan install library baru tanpa memberitahu user dan mencatatnya di Tech Stack Log
- ❌ Jangan langsung coding fitur tanpa konfirmasi action + struktur data
- ❌ Jangan gunakan Tailwind CSS (kecuali diminta)
- ❌ Jangan hardcode nilai konfigurasi Firebase di kode sumber
- ❌ Jangan buat koleksi Firestore baru tanpa konfirmasi user
- ❌ Jangan ubah font yang sudah ditetapkan

## ✅ Keharusan (MUST DO)

- ✅ Selalu tanya action dan struktur data sebelum develop fitur
- ✅ Selalu gunakan color palette yang sudah ditentukan
- ✅ Selalu catat perubahan tech stack di tabel Tech Stack Log
- ✅ Selalu referensikan UI prototype di `screens/` saat membangun halaman
- ✅ Selalu gunakan TypeScript dengan type yang proper
- ✅ Selalu simpan credential Firebase di `.env.local`

---

*Dokumen ini diperbarui terakhir: 2026-06-30*  
*Jika ada perubahan requirement atau design, update dokumen ini juga.*
