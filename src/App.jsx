import React, { useState, useEffect } from 'react';

// Contoh data awal produk dengan barcode
const initialProducts = [
  { id: 1, barcode: '8991001', name: 'Laptop Dell XPS 13', category: 'Elektronik', weight: '1.2 kg', price: 12000000, stock: 5 },
  { id: 2, barcode: '8991002', name: 'Mouse Logitech MX Master', category: 'Aksesoris', weight: '150 g', price: 750000, stock: 20 },
  { id: 3, barcode: '8991003', name: 'Keyboard Mechanical RGB', category: 'Komponen', weight: '800 g', price: 1200000, stock: 15 },
  { id: 4, barcode: '8991004', name: 'Monitor LG 27" 4K', category: 'Elektronik', weight: '4.5 kg', price: 3500000, stock: 8 },
];

export default function App() {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cashGiven, setCashGiven] = useState('');
  const [salesHistory, setSalesHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' atau 'report'

  // Fungsi tambah ke keranjang
  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Logika Scanner Barcode Fisik / Input Manual
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const foundProduct = products.find(
      (p) => p.barcode === barcodeInput || p.name.toLowerCase().includes(barcodeInput.toLowerCase())
    );
    if (foundProduct) {
      handleAddToCart(foundProduct);
      setBarcodeInput('');
    } else {
      alert('Produk dengan barcode/nama tersebut tidak ditemukan!');
    }
  };

  // Hitung Total
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;
  const change = cashGiven ? Number(cashGiven) - total : 0;

  // Fungsi Pembayaran & Simpan Laporan Harian
  const handleCheckout = () => {
    if (cart.length === 0) return alert('Keranjang masih kosong!');
    if (!cashGiven || Number(cashGiven) < total) {
      return alert('Jumlah uang tunai kurang dari total belanja!');
    }

    const newTransaction = {
      id: 'TRX-' + Date.now().toString().slice(-6),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('id-ID'),
      items: [...cart],
      total: total,
      cash: Number(cashGiven),
      change: change,
    };

    setSalesHistory([newTransaction, ...salesHistory]);
    alert(`Transaksi Berhasil!\nKembalian: Rp ${change.toLocaleString('id-ID')}`);
    
    // Cetak Struk Otomatis
    window.print();

    // Reset Keranjang & Pembayaran
    setCart([]);
    setCashGiven('');
  };

  // Total Omzet Harian
  const totalOmzet = salesHistory.reduce((sum, trx) => sum + trx.total, 0);

  return (
    <div className="p-4 max-w-5xl mx-auto font-sans bg-gray-100 min-h-screen">
      {/* Header & Navigasi Tab */}
      <header className="bg-blue-600 text-white p-4 rounded-xl shadow mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold">POS System - Point of Sale</h1>
          <p className="text-sm">Kasir Pintar Terintegrasi Barcode & Laporan</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'pos' ? 'bg-white text-blue-600 shadow' : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
          >
            Kasir Utama
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'report' ? 'bg-white text-blue-600 shadow' : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
          >
            Laporan Harian ({salesHistory.length})
          </button>
        </div>
      </header>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sisi Kiri: Katalog & Scanner */}
          <div className="md:col-span-2 space-y-6">
            {/* Input Barcode Scanner */}
            <div className="bg-white p-4 rounded-xl shadow">
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Scan Barcode / Ketik Nama Barang di sini..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="flex-1 border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                  Cari / Scan
                </button>
              </form>
            </div>

            {/* Katalog Produk */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h2 className="font-bold text-lg mb-3 border-b pb-2">Katalog Produk</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((p) => (
                  <div key={p.id} className="border p-3 rounded-xl flex flex-col justify-between hover:border-blue-400 transition">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-gray-500">Barcode: {p.barcode} | Berat: {p.weight}</p>
                      <p className="text-blue-600 font-bold mt-1">Rp {p.price.toLocaleString('id-ID')}</p>
                    </div>
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="mt-3 bg-green-600 text-white text-sm py-1.5 rounded-lg hover:bg-green-700 font-medium"
                    >
                      + Tambah ke Keranjang
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Keranjang & Pembayaran */}
          <div className="bg-white p-4 rounded-xl shadow flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-lg mb-3 border-b pb-2">Keranjang Belanja</h2>
              {cart.length === 0 ? (
                <p className="text-gray-400 text-center py-12">Keranjang masih kosong</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-gray-500">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <p className="font-bold">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t mt-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal:</span><span>Rp {subtotal.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between text-sm"><span>PPN (10%):</span><span>Rp {tax.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>Total:</span>
                <span className="text-blue-600">Rp {total.toLocaleString('id-ID')}</span>
              </div>

              {cart.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Uang Tunai Pembeli (Rp):</label>
                    <input
                      type="number"
                      placeholder="Masukkan nominal uang..."
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      className="w-full border p-2 rounded-lg text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  {cashGiven !== '' && (
                    <div className={`flex justify-between text-sm font-bold p-2 rounded-lg ${change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      <span>Kembalian:</span>
                      <span>Rp {change >= 0 ? change.toLocaleString('id-ID') : 'Uang Kurang'}</span>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={change < 0}
                    className={`w-full mt-2 py-3 rounded-xl font-bold text-white shadow transition ${
                      change >= 0 ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Proses Pembayaran & Cetak Struk
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Halaman Laporan Harian */
        <div className="bg-white p-6 rounded-xl shadow space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-2">
            <div>
              <h2 className="font-bold text-xl text-gray-800">Laporan Penjualan Harian</h2>
              <p className="text-sm text-gray-500">Rekapitulasi transaksi dan omzet toko</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
              <p className="text-xs text-blue-600 font-semibold">TOTAL OMZET HARI INI</p>
              <p className="text-lg font-bold text-blue-700">Rp {totalOmzet.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {salesHistory.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">Belum ada transaksi tercatat hari ini.</p>
              <p className="text-sm mt-1">Lakukan transaksi di menu Kasir Utama untuk melihat laporan di sini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {salesHistory.map((trx) => (
                <div key={trx.id} className="border rounded-xl p-4 shadow-sm bg-gray-50 flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-md">{trx.id}</span>
                      <span className="text-sm text-gray-500">{trx.date} - Pukul {trx.time}</span>
                    </div>
                    <div className="mt-3 space-y-1">
                      {trx.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-700">
                          • {item.name} <span className="text-gray-500">({item.quantity}x @ Rp {item.price.toLocaleString('id-ID')})</span>
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-center border-t md:border-t-0 pt-3 md:pt-0">
                    <p className="text-xs text-gray-500">Total Belanja</p>
                    <p className="text-base font-bold text-blue-600">Rp {trx.total.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-500 mt-1">Tunai: Rp {trx.cash.toLocaleString('id-ID')} | Kembali: Rp {trx.change.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
