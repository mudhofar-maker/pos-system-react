# 🛒 POS System - Point of Sale

Sistem Penjualan Terintegrasi (Point of Sale) berbasis React, Vite, dan Tailwind CSS dengan fitur manajemen katalog produk, keranjang belanja interaktif, dan simulasi pembayaran.

## ✨ Fitur Utama

### 1. **Manajemen Katalog Produk**
- Daftar produk lengkap dengan informasi nama, kategori, stok real-time, dan harga satuan
- Pencarian produk untuk kemudahan pencarian barang
- Filter berdasarkan kategori (Elektronik, Aksesoris, Audio, Storage, Komponen)
- Indikator stok terbatas dan status kehabisan stok
- Interface responsif dengan tampilan kartu produk yang menarik

### 2. **Keranjang Belanja & Kalkulasi Transaksi**
- Sistem keranjang interaktif untuk menambah, mengurangi, atau menghapus item
- Validasi stok otomatis untuk mencegah pembelian melebihi stok tersedia
- Kalkulasi otomatis:
  - Subtotal dari semua item
  - PPN (Pajak Pertambahan Nilai) 10%
  - Diskon opsional yang dapat disesuaikan
  - Total akhir pembayaran yang akurat
- Tampilan ringkas dengan sticky sidebar untuk kemudahan akses

### 3. **Modul Pembayaran & Struk**
- Tiga metode pembayaran: Tunai, QRIS, dan Transfer Bank
- Modal pembayaran yang user-friendly dengan simulasi proses pembayaran
- Cetak struk otomatis setelah pembayaran berhasil
- Ringkasan struk yang detail:
  - Nomor struk unik dengan timestamp
  - Daftar produk yang dibeli
  - Perhitungan subtotal, pajak, diskon
  - Total pembayaran
  - Metode pembayaran yang digunakan
- Format struk siap cetak dengan tampilan profesional

## 🚀 Teknologi yang Digunakan

- **React 18**: Library JavaScript untuk membangun UI
- **Vite**: Build tool modern yang cepat
- **Tailwind CSS**: Utility-first CSS framework
- **JavaScript ES6+**: Modern JavaScript syntax

## 📁 Struktur Proyek

```
pos-system-react/
├── src/
│   ├── components/
│   │   ├── ProductList.jsx       # Daftar produk dengan search & filter
│   │   ├── ProductCard.jsx       # Kartu individual produk
│   │   ├── Cart.jsx              # Keranjang belanja
│   │   ├── CartItem.jsx          # Item di dalam keranjang
│   │   ├── PaymentModal.jsx      # Modal pembayaran
│   │   └── Receipt.jsx           # Tampilan & cetak struk
│   ├── App.jsx                   # Komponen utama aplikasi
│   ├── index.css                 # Styling global
│   └── main.jsx                  # Entry point aplikasi
├── index.html                    # File HTML utama
├── package.json                  # Dependencies & scripts
├── vite.config.js               # Konfigurasi Vite
├── tailwind.config.js           # Konfigurasi Tailwind CSS
├── postcss.config.js            # Konfigurasi PostCSS
└── README.md                    # Dokumentasi proyek
```

## 🛠️ Instalasi dan Setup

### Prerequisites
- Node.js 16.x atau lebih tinggi
- npm atau yarn package manager

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/mudhofar-maker/pos-system-react.git
   cd pos-system-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Jalankan development server**
   ```bash
   npm run dev
   ```
   Server akan berjalan di `http://localhost:5173`

4. **Build untuk production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## 📖 Penggunaan

### Menambah Produk ke Keranjang
1. Lihat daftar produk di sebelah kiri
2. Gunakan search bar untuk mencari produk spesifik
3. Filter berdasarkan kategori menggunakan tombol kategori
4. Klik tombol "Tambah Keranjang" pada produk yang diinginkan
5. Produk akan muncul di keranjang belanja di sebelah kanan

### Mengelola Keranjang
1. Ubah jumlah item dengan tombol (+/-) atau input langsung
2. Hapus item dengan klik tombol "Hapus"
3. Atur diskon (jika ada) di field diskon
4. Lihat perhitungan subtotal, pajak, dan total secara real-time

### Proses Pembayaran
1. Klik tombol "Proses Pembayaran" ketika keranjang sudah siap
2. Pilih metode pembayaran (Tunai, QRIS, atau Transfer Bank)
3. Klik "Konfirmasi Pembayaran"
4. Tunggu proses pembayaran selesai (~1.5 detik simulasi)
5. Struk akan ditampilkan otomatis
6. Klik "Cetak Struk" untuk mencetak atau tutup modal
7. Keranjang akan direset otomatis untuk transaksi berikutnya

## 🎨 Fitur UI/UX

- **Responsive Design**: Adaptif di desktop, tablet, dan mobile
- **Real-time Calculation**: Kalkulasi harga otomatis saat item berubah
- **Stock Validation**: Validasi stok mencegah pembelian berlebih
- **Visual Feedback**: Indikator stok terbatas dan status kehabisan
- **Smooth Transitions**: Animasi yang halus untuk pengalaman pengguna lebih baik
- **Professional UI**: Desain modern dengan Tailwind CSS

## 📝 Data Produk

Aplikasi dilengkapi dengan 10 produk sampel:
- Laptop Dell XPS 13
- Mouse Logitech MX Master
- Keyboard Mechanical RGB
- Monitor LG 27" 4K
- Headphone Sony WH-1000XM5
- USB-C Hub 7-in-1
- SSD Samsung 1TB NVMe
- RAM Kingston 16GB DDR4
- Webcam Logitech 1080p
- Power Bank Anker 20000mAh

## 🐛 Troubleshooting

### Port 5173 sudah digunakan
```bash
# Gunakan port berbeda
npm run dev -- --port 3000
```

### Dependencies error
```bash
# Bersihkan node_modules dan install ulang
rm -rf node_modules package-lock.json
npm install
```

### Build error
```bash
# Clear Vite cache
rm -rf .vite
npm run build
```

## 🔄 Workflow Contoh Transaksi

1. **Pelanggan datang ke kasir**
   - Kasir mencari produk yang ingin dibeli pelanggan

2. **Kasir menambahkan produk**
   - Klik tombol tambah keranjang untuk setiap produk
   - Ubah jumlah sesuai kebutuhan

3. **Perhitungan otomatis**
   - Sistem menghitung subtotal, pajak, dan total
   - Kasir dapat menambahkan diskon jika ada

4. **Proses pembayaran**
   - Kasir memilih metode pembayaran
   - Sistem menampilkan total yang harus dibayar

5. **Cetak struk**
   - Struk dicetak otomatis
   - Pelanggan menerima struk pembelian
   - Keranjang direset untuk pelanggan berikutnya

## 📄 Lisensi

Proyek ini bersifat open-source dan bebas digunakan untuk keperluan komersial maupun non-komersial.

## 👨‍💻 Developer

Dibuat oleh: **mudhofar-maker** (Senior Full-Stack Developer)

Untuk pertanyaan atau kontribusi, silakan buat issue atau pull request di repository ini.

---

**Happy Coding! 🚀**
