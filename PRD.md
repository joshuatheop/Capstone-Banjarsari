# PRD — PALUGADA Banjarsari

**Document Type:** Product Requirements Document  
**Project:** PALUGADA Banjarsari  
**Version:** 1.0  
**Status:** Baseline for Development  
**Last Updated:** 28 September 2026  
**Primary Scope:** Banjarsari, Garut  

---

## 1. Purpose of This Document

Dokumen ini adalah sumber utama requirement produk PALUGADA Banjarsari. Tujuannya adalah menyamakan pemahaman Lukas, Zikri, dan Theo mengenai fungsi produk, batas ownership, prioritas pengembangan, dan acceptance criteria sebelum implementasi dilakukan.

Urutan acuan saat terjadi konflik:

1. Instruksi user/pemilik produk yang paling baru dan eksplisit.
2. `PRD.md` untuk kebutuhan produk dan business requirement.
3. `design.md` untuk arsitektur, data flow, UI/UX, contract, dan keputusan teknis.
4. `AGENTS.md` untuk coding convention dan design system existing, selama tidak bertentangan dengan PRD/design terbaru.
5. Implementasi existing sebagai baseline yang harus dipertahankan sampai ada perubahan requirement yang sah.

Perubahan requirement yang berdampak pada lebih dari satu domain wajib dibahas sebelum diimplementasikan.

---

## 2. Product Summary

PALUGADA Banjarsari adalah platform commerce lokal yang menghubungkan masyarakat Banjarsari dengan pelaku usaha, penjual makanan, penyedia jasa, dan kurir dalam satu aplikasi.

PALUGADA akan berkembang dari katalog digital menjadi platform transaksi end-to-end yang mendukung tiga vertical utama:

1. **Produk/Barang** — marketplace lokal seperti konsep Shopee.
2. **Makanan** — pemesanan makanan dan delivery seperti konsep ShopeeFood.
3. **Jasa** — pemesanan/booking jasa seperti konsep layanan jasa di Gojek/GoClean, dengan WhatsApp sebagai kanal komunikasi lanjutan yang penting.

Customer harus dapat menemukan layanan, membuat order atau booking, memilih metode pembayaran, memantau status, dan menghubungi seller/provider melalui WhatsApp tanpa kehilangan histori transaksi di PALUGADA.

---

## 3. Existing Baseline

Repository existing menggunakan:

- Next.js 16 App Router
- React 19
- TypeScript
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Analytics client support
- Vanilla CSS / CSS Modules
- Existing roles: `admin` dan `pelanggan`
- Existing data domains: bisnis/UMKM, produk, jasa, kategori, review, SEO, analytics events
- Existing analytics events antara lain `BUSINESS_VIEW`, `PRODUCT_VIEW`, `SERVICE_VIEW`, `WHATSAPP_CLICK`, `MARKETPLACE_CLICK`, `SHARE_CLICK`, dan `PAGE_VIEW`.

Kondisi existing lebih dekat ke **catalogue/discovery platform** dibanding transactional marketplace. Banyak operasi Firestore masih dilakukan langsung dari client.

Existing functionality yang masih relevan harus dipertahankan selama proses transformasi, kecuali requirement baru secara eksplisit menggantikannya.

---

## 4. Problem Statement

Transaksi lokal di Banjarsari masih tersebar di WhatsApp, media sosial, marketplace eksternal, dan transaksi offline. Hal ini membuat:

- customer sulit menemukan seller, produk, makanan, dan jasa dalam satu tempat;
- seller tidak memiliki sistem terpadu untuk katalog, order, dan insight bisnis;
- histori transaksi dan status fulfillment tidak terstruktur;
- komunikasi via WhatsApp sulit dianalisis sebagai business funnel;
- delivery makanan dan proses pemesanan jasa belum terintegrasi;
- pengelola PALUGADA sulit memonitor kesehatan ekosistem secara menyeluruh.

PALUGADA bertujuan menjadi lapisan transaksi dan operasional lokal tanpa menghilangkan fleksibilitas komunikasi WhatsApp yang sudah familiar bagi masyarakat.

---

## 5. Product Goals

### 5.1 Primary Goals

1. Customer dapat membeli barang dari seller lokal melalui PALUGADA.
2. Customer dapat memesan makanan dan menggunakan kurir/delivery PALUGADA.
3. Customer dapat melakukan booking jasa melalui PALUGADA dan melanjutkan komunikasi detail melalui WhatsApp bila diperlukan.
4. Seller dapat login dan mengelola toko, katalog, stok, order, dan performanya sendiri.
5. Kurir dapat menerima dan memproses tugas delivery yang diberikan sistem.
6. Admin PALUGADA dapat memonitor ekosistem tanpa menjadi operator CRUD harian milik seller.
7. Sistem mencatat event dan transaksi yang cukup untuk menghasilkan seller analytics dan platform analytics.
8. Sistem tetap dapat berevolusi dari Firebase menuju VPS/PostgreSQL tanpa menulis ulang seluruh frontend.

### 5.2 Secondary Goals

- Mempertahankan WhatsApp sebagai channel komunikasi penting.
- Menyediakan payment abstraction agar cash, transfer bank, QR/QRIS, dan payment gateway dapat coexist.
- Menyediakan fondasi multi-seller checkout.
- Membuat domain ownership tiga developer jelas dan meminimalkan merge conflict.

---

## 6. Non-Goals for Initial MVP

Hal berikut bukan prioritas awal kecuali ditambahkan kemudian:

- ekspansi geografis di luar Banjarsari;
- warehouse management berskala besar;
- nationwide logistics integration;
- dynamic surge pricing;
- subscription seller berbayar;
- loyalty point kompleks;
- live chat internal pengganti WhatsApp;
- AI recommendation production-grade;
- advanced fraud detection;
- cross-region courier dispatch.

Sistem boleh disiapkan agar extensible, tetapi implementasi MVP tidak boleh membengkak karena fitur tersebut.

---

## 7. Geographic Scope

PALUGADA versi ini difokuskan untuk **Banjarsari**.

Konsekuensi:

- discovery, seller onboarding, delivery, dan service area berfokus pada Banjarsari;
- alamat tetap disimpan secara terstruktur agar delivery dapat berjalan;
- tidak perlu multi-city tenant architecture pada MVP;
- implementasi tidak boleh hardcode seluruh business logic sehingga mustahil diekspansi, tetapi ekspansi bukan requirement aktif.

---

## 8. User Roles

### 8.1 Customer

Customer dapat:

- register/login;
- mengelola profil dan alamat;
- mencari produk, makanan, jasa, dan seller;
- melihat detail item dan toko/provider;
- menyimpan favorit;
- menambahkan barang/menu ke cart;
- melakukan checkout;
- memilih metode pembayaran;
- membuat booking jasa;
- memantau order/booking;
- menghubungi seller/provider melalui WhatsApp;
- memberikan review setelah transaksi selesai.

### 8.2 Seller

Seller adalah pemilik bisnis/merchant/provider yang mengelola datanya sendiri.

Seller dapat:

- login ke seller dashboard;
- mengelola profil usaha;
- mengelola produk retail;
- mengelola menu makanan jika merchant food;
- mengelola jasa jika service provider;
- mengatur harga, stok, availability, dan status aktif;
- melihat order yang relevan dengan usahanya;
- menerima/menolak dan memproses order sesuai business rule;
- melihat seller analytics;
- melihat performance produk/menu/jasa;
- mengakses histori transaksi usahanya.

Seller tidak dapat melihat data private seller lain.

### 8.3 Courier

Courier dapat:

- login;
- mengatur availability sederhana;
- melihat delivery assignment yang diberikan kepadanya;
- menerima assignment sesuai business rule;
- melihat pickup dan delivery information yang diperlukan;
- memperbarui status delivery;
- menyelesaikan delivery.

Courier tidak dapat mengubah order item, harga, atau payment status.

### 8.4 Admin PALUGADA

Admin berfungsi sebagai monitor dan governance layer, bukan operator toko.

Admin dapat:

- memonitor customer, seller, courier, order, payment, delivery, dan service booking;
- mengelola master category/global configuration yang memang platform-owned;
- melakukan moderation dan suspend/activate account sesuai rule;
- melihat platform analytics;
- menangani dispute atau exceptional case;
- melihat audit information yang diperlukan.

Admin **tidak** menjadi pihak utama yang menambahkan/mengubah produk seller sehari-hari.

---

## 9. Core Product Verticals

### 9.1 Retail Marketplace

Flow utama:

`Browse/Search → Product Detail → Add to Cart → Checkout → Payment → Seller Fulfillment → Delivery/Pickup → Completed → Review`

Minimum capability:

- kategori produk;
- seller profile;
- product variants bila diperlukan;
- price;
- stock;
- image;
- description;
- availability;
- cart;
- multi-item checkout;
- multi-seller checkout;
- order tracking;
- review.

### 9.2 Food Ordering

Flow utama:

`Merchant → Menu → Cart → Checkout → Payment/Cash → Merchant Accepts → Preparing → Courier Assignment → Picked Up → On Delivery → Delivered → Completed`

Minimum capability:

- food merchant profile;
- menu category;
- menu item;
- price;
- menu availability;
- preparation status;
- customer address;
- delivery fee field;
- courier assignment;
- delivery tracking by status;
- review.

### 9.3 Services

Flow utama:

`Discover Service → Service Detail → Booking Form → Schedule/Request → Booking Created → Provider Confirmation → WhatsApp Coordination → Service Execution → Completed → Review`

Minimum capability:

- provider profile;
- service category;
- service price type;
- service availability;
- booking date/time or requested schedule;
- service address/location when relevant;
- request notes;
- provider confirmation;
- WhatsApp deep-link with booking context;
- booking status;
- review.

WhatsApp adalah channel komunikasi lanjutan, tetapi booking harus tetap tercatat di PALUGADA.

---

## 10. Authentication and Account Requirements

Target roles:

- `customer`
- `seller`
- `courier`
- `admin`

Requirement:

1. Existing `pelanggan` harus dimigrasikan/di-normalisasi menjadi `customer` tanpa kehilangan account existing.
2. Role tidak boleh dipercaya hanya dari client state.
3. Protected action harus divalidasi server-side atau melalui security rules/service boundary yang sesuai.
4. Seller hanya boleh memodifikasi resource miliknya sendiri.
5. Courier hanya boleh mengakses delivery yang authorized.
6. Admin access harus dibatasi eksplisit.

---

## 11. Seller and Business Management

Setiap seller memiliki minimal satu business profile. MVP dapat membatasi satu user seller ke satu business bila itu menyederhanakan implementasi, tetapi data model sebaiknya tidak menutup kemungkinan multi-business di masa depan.

Business type dapat mencakup:

- `RETAIL`
- `FOOD`
- `SERVICE`
- kombinasi bila dibutuhkan.

Seller bertanggung jawab atas:

- nama bisnis;
- deskripsi;
- logo/foto;
- alamat;
- kontak/WhatsApp;
- jam operasional;
- jenis bisnis;
- status operasional;
- katalog miliknya.

---

## 12. Cart and Multi-Seller Checkout

Customer dapat memasukkan banyak item dalam satu cart, termasuk item dari beberapa seller.

Checkout harus mengelompokkan item berdasarkan seller/business.

Konsep:

```text
Checkout
├── Seller A
│   └── Sub-order A
│       ├── Item A1
│       └── Item A2
├── Seller B
│   └── Sub-order B
│       └── Item B1
└── Payment Summary
```

Requirement:

- customer melihat grand total;
- sistem tetap menyimpan subtotal per seller;
- fulfillment/status per seller dapat berbeda;
- cancellation/refund di masa depan dapat diproses per sub-order;
- analytics dapat menghitung GMV/revenue per seller dan keseluruhan checkout;
- sistem harus mencegah checkout terhadap item inactive/out-of-stock.

Food cart boleh memiliki restriction tersendiri jika business rule delivery memerlukan satu merchant per food order. Restriction tersebut harus diterapkan eksplisit pada domain food, bukan karena keterbatasan model order global.

---

## 13. Order Management

### 13.1 Core Order Status

Baseline status:

- `PENDING_PAYMENT`
- `PAID`
- `SELLER_CONFIRMED`
- `PROCESSING`
- `READY_FOR_PICKUP`
- `ON_DELIVERY`
- `COMPLETED`
- `CANCELLED`

Status tambahan boleh digunakan per vertical bila dijelaskan di `design.md`.

### 13.2 Order Rules

- order menyimpan snapshot nama, harga, quantity, dan seller pada waktu transaksi;
- perubahan harga produk setelah order tidak boleh mengubah histori order;
- seller hanya mengelola sub-order miliknya;
- customer dapat melihat keseluruhan checkout/order history;
- admin dapat memonitor tetapi bukan operator fulfillment normal;
- perubahan status penting dicatat untuk audit/analytics.

---

## 14. Payment Requirements

Metode target:

1. Cash/COD bila business flow mengizinkan.
2. Bank transfer.
3. QR/QRIS.
4. Payment gateway.

Zikri memiliki ownership utama terhadap integration layer payment, tetapi perubahan payment state yang berdampak pada order lifecycle harus disepakati dengan Theo.

Baseline payment statuses:

- `PENDING`
- `PAID`
- `FAILED`
- `EXPIRED`
- `CANCELLED`
- `REFUNDED` (future-ready)

Requirement:

- provider-specific logic tidak boleh tersebar di UI;
- transaction/provider reference harus disimpan;
- webhook/callback payment tidak boleh mempercayai data dari browser;
- order tidak boleh dianggap paid hanya karena customer kembali ke success page;
- cash payment menggunakan flow yang berbeda tetapi tetap tercatat sebagai payment method.

Pemilihan payment gateway vendor adalah keputusan implementasi terpisah dan harus mempertimbangkan dukungan QRIS, bank transfer, biaya, onboarding, sandbox, dan webhook.

---

## 15. Delivery and Courier Requirements

Delivery wajib tersedia terutama untuk food ordering dan dapat digunakan untuk retail jika business flow menghendaki.

Baseline delivery statuses:

- `WAITING_ASSIGNMENT`
- `ASSIGNED`
- `ACCEPTED`
- `PICKED_UP`
- `ON_DELIVERY`
- `DELIVERED`
- `FAILED`
- `CANCELLED`

MVP tidak wajib menggunakan live GPS tracking.

Minimum delivery information:

- order/sub-order reference;
- customer address;
- seller pickup address;
- courier identity;
- delivery fee;
- timestamps status utama;
- customer notes/delivery notes.

Business rule assignment courier didefinisikan oleh Theo dan diimplementasikan tanpa mengunci sistem ke mekanisme dispatch yang terlalu kompleks.

---

## 16. Service Booking Requirements

Booking jasa harus tersimpan dalam sistem sebelum user diarahkan ke WhatsApp.

Baseline booking statuses:

- `REQUESTED`
- `CONFIRMED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`
- `REJECTED`

Booking menyimpan:

- customer;
- provider/business;
- service;
- requested schedule;
- address/location jika relevan;
- customer notes;
- price estimate atau agreed price bila tersedia;
- WhatsApp contact context;
- timestamps.

---

## 17. WhatsApp Integration

WhatsApp berfungsi sebagai communication extension, bukan source of truth transaksi.

Requirement:

- nomor seller/provider disimpan di database;
- link WhatsApp dibentuk dari data yang sudah tervalidasi;
- message template memuat order/booking identifier;
- klik WhatsApp dicatat sebagai analytics event;
- order/booking tetap valid walaupun user tidak membuka WhatsApp;
- data payment sensitive tidak boleh dimasukkan ke message template.

Contoh message context:

```text
Halo, saya ingin menanyakan pesanan PALUGADA #PLG-XXXX.
Mohon konfirmasi detail pesanan/booking saya.
```

---

## 18. Review and Rating

Customer hanya boleh memberikan review pada transaksi/booking yang memenuhi rule completion.

Review minimal memiliki:

- target type;
- target ID;
- customer ID;
- order/booking reference;
- rating;
- comment;
- created timestamp.

MVP boleh mempertahankan model review existing sambil menambahkan transaction verification.

---

## 19. Seller Analytics — Ownership Lukas

Seller dashboard harus berkembang dari engagement analytics menjadi business analytics.

Minimum KPI yang ditargetkan setelah order data tersedia:

- gross sales/GMV seller;
- total completed orders;
- pending/active orders;
- average order value;
- top products/menu/services;
- product/menu views;
- add-to-cart events;
- checkout started;
- payment success;
- conversion funnel;
- WhatsApp clicks;
- repeat customer indicator bila data cukup;
- cancellation rate;
- sales trend by day/week/month;
- stock/availability insight bila relevan.

Analytics tidak boleh menentukan business state. Analytics mengonsumsi transactional events/data yang sudah sah.

---

## 20. Admin Analytics and Monitoring

Admin PALUGADA membutuhkan platform-level view:

- active sellers;
- active customers;
- active couriers;
- total orders;
- GMV;
- payment status distribution;
- order completion/cancellation;
- top categories;
- top sellers by descriptive metrics;
- delivery completion metrics;
- service booking metrics;
- traffic and engagement existing;
- system issues/disputes yang perlu tindakan.

Admin dashboard bersifat monitoring/governance dan tidak menggantikan seller dashboard.

---

## 21. Analytics Event Requirements

Existing events dipertahankan jika masih relevan.

Target events mencakup minimal:

- `PRODUCT_VIEW`
- `SERVICE_VIEW`
- `BUSINESS_VIEW`
- `PAGE_VIEW`
- `WHATSAPP_CLICK`
- `SHARE_CLICK`
- `ADD_TO_CART`
- `REMOVE_FROM_CART`
- `CHECKOUT_STARTED`
- `CHECKOUT_COMPLETED`
- `PAYMENT_STARTED`
- `PAYMENT_SUCCESS`
- `PAYMENT_FAILED`
- `ORDER_CREATED`
- `ORDER_CANCELLED`
- `ORDER_COMPLETED`
- `SERVICE_BOOKING_CREATED`
- `SERVICE_BOOKING_COMPLETED`
- `COURIER_ASSIGNED`
- `DELIVERY_STARTED`
- `DELIVERY_COMPLETED`
- `REVIEW_CREATED`

Event schema harus konsisten, versionable, dan tidak mengandung credential/payment secret.

---

## 22. Search and Discovery

Customer harus dapat menemukan:

- produk;
- makanan/menu;
- jasa;
- seller/business;
- category.

Minimum capability:

- keyword search;
- category filter;
- active/available filter;
- sorting yang relevan;
- clear empty state.

Advanced recommendation tidak termasuk MVP.

---

## 23. Non-Functional Requirements

### 23.1 Security

- credential tidak boleh di-commit;
- RBAC harus divalidasi secara authoritative;
- seller tidak boleh mengakses resource seller lain;
- payment callback harus diverifikasi server-side;
- sensitive write tidak boleh mengandalkan client-only validation;
- Firestore Security Rules/Server API harus menjadi bagian deployment checklist.

### 23.2 Performance

- landing/catalog tetap cepat pada mobile network;
- image harus dioptimalkan;
- query harus dibatasi dan dipagination jika data membesar;
- analytics query tidak boleh menarik data tanpa batas;
- dashboard berat tidak boleh menghambat transactional flow.

### 23.3 Reliability

- duplicate payment/order callback harus idempotent;
- order history tidak hilang ketika item katalog berubah;
- failure external integration harus menghasilkan error state yang jelas;
- operasi kritis harus memiliki logging yang cukup.

### 23.4 Responsive Design

Semua customer flow dan seller core flow harus usable di mobile. Target utama masyarakat Banjarsari diasumsikan banyak menggunakan smartphone.

### 23.5 Accessibility

- semantic HTML;
- keyboard reachable action;
- sufficient contrast mengikuti design system;
- meaningful label/form error;
- image alt text.

---

## 24. Technology Direction

### 24.1 Current Phase

Pertahankan:

- Next.js
- React
- TypeScript
- Firebase Auth
- Firestore
- Firebase Storage

Namun transactional logic baru tidak boleh terus berkembang dengan pola client → Firestore tanpa boundary.

Target:

`UI → Server/API/Application Service → Repository → Firebase`

### 24.2 Future VPS Migration

Target jangka menengah dapat menjadi:

- Next.js/Node.js
- PostgreSQL
- Prisma atau data access layer yang disepakati
- object storage
- Docker
- Nginx/reverse proxy
- VPS

Migrasi dilakukan setelah domain/service contract cukup stabil. UI tidak boleh mengetahui detail persistence secara langsung.

---

## 25. Team Ownership

### 25.1 Lukas — ADM / Data Management & Analytics

Primary ownership:

- analytics event design bersama domain owner;
- seller analytics;
- admin/platform analytics;
- KPI calculation;
- reporting/data aggregation;
- data quality dan analytical model;
- dashboard insight.

Lukas tidak boleh mengubah order/payment/delivery business rule sepihak hanya agar analytics lebih mudah.

### 25.2 Zikri — ESD / Website Development

Primary ownership:

- website/customer interface;
- seller-facing web interface;
- reusable UI components;
- responsive behavior;
- auth UI/integration;
- cart/checkout presentation;
- payment gateway integration;
- payment UI/state presentation;
- external web integration yang menjadi scope ESD.

Zikri tidak boleh mengubah order state machine atau data contract transactional sepihak.

### 25.3 Theo — ERP / Business Process

Primary ownership:

- order lifecycle;
- inventory transactional rules;
- seller operation process;
- food fulfillment;
- service booking process;
- courier/delivery process;
- status transition rules;
- transactional business services;
- ERP-oriented operational flow.

Theo tidak boleh mengubah analytics definition atau shared UI contract sepihak.

---

## 26. Cross-Domain Collaboration Rules

1. Jangan mengedit domain developer lain hanya untuk menyelesaikan task lokal.
2. Shared contract harus diletakkan di lokasi yang disepakati.
3. Perubahan shared type/API wajib backward-compatible bila memungkinkan.
4. Breaking change harus dikomunikasikan sebelum merge.
5. Refactor besar di luar scope task dilarang.
6. Dependency upgrade besar tidak dilakukan tanpa koordinasi.
7. Database schema change wajib memiliki migration/backward compatibility plan.
8. Jangan menghapus existing feature tanpa requirement.
9. Setiap developer wajib menjalankan lint/build/test relevan sebelum PR.
10. Konflik ownership diselesaikan di level contract, bukan dengan saling overwrite implementation.

---

## 27. Git and Branch Strategy

Long-lived branches:

- `main` — production/stable baseline.
- `develop` — integration branch.
- `lukas` — integration branch pekerjaan Lukas.
- `zikri` — integration branch pekerjaan Zikri.
- `theo` — integration branch pekerjaan Theo.

Recommended daily feature branches:

- `lukas/<feature>`
- `zikri/<feature>`
- `theo/<feature>`

Flow:

```text
lukas/<feature> ─┐
                 ├→ lukas ─┐
zikri/<feature> ─┤         │
                 ├→ zikri ─┼→ develop → main
 theo/<feature> ─┤         │
                 └→ theo ──┘
```

Rules:

- tidak boleh push langsung ke `main`;
- tidak boleh merge langsung ke branch milik developer lain;
- integrasi lintas domain masuk melalui `develop`;
- `main` hanya menerima perubahan yang sudah terintegrasi dan diverifikasi;
- PR harus menjelaskan scope, file utama, contract change, migration, dan test evidence;
- coding agent tidak boleh auto-push/merge kecuali user secara eksplisit memerintahkan.

Catatan baseline repository: snapshot saat PRD dibuat sudah memiliki remote `main` dan `lukas`; `zikri`, `theo`, dan `develop` belum terlihat pada snapshot tersebut.

---

## 28. Development Phases

### Phase 0 — Repository Baseline and Safety

- clean/confirm Git working tree baseline;
- resolve legacy tracked deletion secara sadar, bukan otomatis;
- establish `develop`, `lukas`, `zikri`, `theo` workflow;
- update documentation precedence;
- add environment/deployment checklist;
- define module/shared contract boundaries;
- ensure lint/build baseline known.

### Phase 1 — Identity and Domain Foundation

- migrate roles to customer/seller/courier/admin;
- seller/business ownership model;
- address model;
- server/API/service/repository boundary;
- security rules/RBAC baseline.

### Phase 2 — Seller Catalog and Storefront

- seller dashboard shell;
- seller manages profile;
- retail products;
- food merchant/menu;
- services;
- availability/stock.

### Phase 3 — Cart, Checkout, and Order Core

- cart;
- multi-seller grouping;
- checkout;
- order/sub-order snapshot;
- order history;
- seller operational order view.

### Phase 4 — Payment

- payment abstraction;
- cash;
- bank transfer/QR according to chosen implementation;
- payment gateway sandbox;
- verified callback/webhook;
- payment status integration.

### Phase 5 — Food Delivery and Courier

- courier role/dashboard;
- delivery record;
- assignment;
- delivery status flow;
- food fulfillment integration.

### Phase 6 — Service Booking + WhatsApp

- booking flow;
- schedule/request;
- provider confirmation;
- WhatsApp context;
- completion/review.

### Phase 7 — Analytics and Monitoring Expansion

- transactional event instrumentation;
- seller analytics;
- admin/platform analytics;
- funnel and business KPI;
- data quality validation.

### Phase 8 — Hardening and VPS Readiness

- testing;
- security audit;
- performance audit;
- persistence abstraction review;
- PostgreSQL migration plan;
- deployment/runbook.

Phases dapat overlap berdasarkan ownership, tetapi shared contract harus stabil sebelum parallel implementation bergantung padanya.

---

## 29. MVP Acceptance Criteria

MVP dianggap memenuhi fungsi inti ketika:

1. Customer dapat register/login dan memiliki role customer.
2. Seller dapat login dan mengelola bisnis/katalognya sendiri.
3. Retail product dapat ditemukan, dimasukkan cart, dan dibeli.
4. Cart dapat menyimpan multiple items dan mendukung grouping multi-seller.
5. Checkout menghasilkan order/sub-order yang konsisten.
6. Setidaknya satu payment flow non-cash dan satu cash/manual flow dapat diproses end-to-end di environment yang sesuai.
7. Food merchant dapat menerima order dan order dapat diteruskan ke delivery flow.
8. Courier dapat memproses delivery assignment sampai delivered.
9. Service customer dapat membuat booking di aplikasi.
10. Booking menyediakan WhatsApp contact action dengan booking identifier.
11. Seller dapat melihat order dan insight utama miliknya.
12. Admin dapat memonitor platform tanpa harus menjadi operator katalog seller.
13. Customer dapat melihat histori/status order/booking.
14. Core transactional event tercatat untuk analytics.
15. Authorization mencegah seller mengedit data seller lain.
16. Build/lint/test critical path lulus.

---

## 30. Definition of Done per Feature

Sebuah feature belum dianggap selesai hanya karena UI tampil.

Feature selesai jika:

- requirement/acceptance criteria terpenuhi;
- role/permission tervalidasi;
- happy path dan error state ditangani;
- loading/empty state tersedia jika relevan;
- data contract didokumentasikan;
- analytics event ditambahkan bila diperlukan;
- lint/type/build relevan lulus;
- test untuk business logic kritis tersedia;
- tidak merusak existing flow di luar scope;
- docs diperbarui jika ada architecture/schema/tech stack change;
- PR menjelaskan risiko dan dependency lintas domain.

---

## 31. Open Decisions That Require Implementation-Time Confirmation

Hal berikut sengaja belum dikunci pada PRD karena membutuhkan evaluasi teknis/vendor:

- payment gateway final;
- metode kalkulasi delivery fee;
- mekanisme courier assignment awal (manual/semi-automatic/automatic sederhana);
- apakah retail delivery pada MVP memakai courier PALUGADA atau seller-managed per kategori;
- refund automation level;
- seller verification/onboarding approval detail;
- exact PostgreSQL migration timing.

Keputusan tersebut tidak boleh digunakan sebagai alasan untuk mengubah core domain tanpa pembahasan.

---

## 32. Product Principle

> **PALUGADA adalah source of truth untuk transaksi dan proses bisnis; WhatsApp adalah channel komunikasi, seller adalah pemilik katalognya sendiri, admin adalah pengawas platform, dan setiap developer wajib menjaga boundary domain agar perkembangan satu bagian tidak merusak bagian lain.**
