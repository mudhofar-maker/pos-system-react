import React, { useState, useEffect, useRef } from 'react';

const initialProducts = [
  { id: 1, barcode: '8991001', name: 'Laptop Dell XPS 13', category: 'Elektronik', price: 12000000, weight: '1.2 kg' },
  { id: 2, barcode: '8991002', name: 'Mouse Logitech MX Master', category: 'Elektronik', price: 750000, weight: '150 g' },
  { id: 3, barcode: '8991003', name: 'Keyboard Mechanical RGB', category: 'Elektronik', price: 1200000, weight: '800 g' },
  { id: 4, barcode: '8991004', name: 'Monitor LG 27" 4K', category: 'Elektronik', price: 3500000, weight: '4.5 kg' }
];

export default function App() {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cashGiven, setCashGiven] = useState('');
  const [salesHistory, setSalesHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('kasir'); // 'kasir' atau 'laporan'
  
  // State untuk Modal / Form Tambah Produk Baru jika Barcode tidak ditemukan
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newWeight, setNewWeight] = useState('');

  // State untuk Scanner Kamera
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  // Fungsi Tambah ke Keranjang berdasarkan Barcode atau Nama
  const handleScanOrSearch = (codeToSearch) => {
    const query = (codeToSearch || barcodeInput).trim();
    if (!query) return;

    // Cari produk berdasarkan barcode atau nama
    const found = products.find(
      p => p.barcode === query || p.name.toLowerCase().includes(query.toLowerCase())
    );

    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      // Jika barcode tidak ditemukan, tawarkan untuk input produk baru secara manual!
      setNewBarcode(query.length > 3 && !isNaN(query) ? query : '');
      setNewName(isNaN(query) ? query : '');
      setShowAddModal(true);
    }
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.11; // PPN 11%
  const grandTotal = subtotal + tax;
  const cashNumber = parseFloat(cashGiven) || 0;
  const change = cashNumber - grandTotal;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (cashNumber < grandTotal) {
      alert('Uang tunai kurang dari total belanja!');
      return;
    }

    const newTransaction = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      items: [...cart],
      subtotal,
      tax,
      grandTotal,
      cash: cashNumber,
      change
    };

    setSalesHistory([newTransaction, ...salesHistory]);
    setCart([]);
    setCashGiven('');
    alert('Transaksi berhasil disimpan!');
  };

  // Simpan Produk Baru dari Hasil Scan / Manual
  const handleSaveNewProduct = (e) => {
    e.preventDefault();
    if (!newBarcode || !newName || !newPrice) {
      alert('Barcode, Nama, dan Harga wajib diisi!');
      return;
    }

    const newProd = {
      id: Date.now(),
      barcode: newBarcode,
      name: newName,
      category: newCategory || 'Umum',
      price: parseFloat(newPrice) || 0,
      weight: newWeight || '1 pcs'
    };

    setProducts([newProd, ...products]);
    addToCart(newProd);

    // Reset Form & Tutup Modal
    setShowAddModal(false);
    setNewBarcode('');
    setNewName('');
    setNewCategory('');
    setNewPrice('');
    setNewWeight('');
    setBarcodeInput('');
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <h1 className="text-xl font-bold">POS System - Point of Sale</h1>
            <p className="text-xs text-blue-100">Kasir Pintar Terintegrasi Barcode & Input Produk</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('kasir')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${activeTab === 'kasir' ? 'bg-white text-blue-600 shadow' : 'bg-blue-700 text-white hover:bg-blue-500'}`}
            >
              Kasir Utama
            </button>
            <button
              onClick={() => setActiveTab('laporan')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${activeTab === 'laporan' ? 'bg-white text-blue-600 shadow' : 'bg-blue-700 text-white hover:bg-blue-500'}`}
            >
              Laporan Harian ({salesHistory.length})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'kasir' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kolom Kiri & Tengah: Pencarian & Katalog */}
            <div className="md:col-span-2 space-y-4">
              {/* Input Barcode & Tombol Scan */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Scan Barcode / Ketik Nama Barang..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanOrSearch()}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleScanOrSearch()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Cari / Tambah
                </button>
              </div>

              {/* Katalog Produk */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h2 className="font-semibold text-slate-700 mb-3 text-sm">Katalog Produk ({products.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
                  {products.map(p => (
                    <div key={p.id} className="border border-slate-200 rounded-lg p-3 flex flex-col justify-between hover:border-blue-400 transition bg-slate-50">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-800 text-sm">{p.name}</h3>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{p.category}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Barcode: {p.barcode} | {p.weight}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-bold text-blue-600 text-sm">
                          Rp {p.price.toLocaleString('id-ID')}
                        </span>
                        <button
                          onClick={() => addToCart(p)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded font-medium transition"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Keranjang Belanja */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <h2 className="font-semibold text-slate-700 mb-3 text-sm border-b pb-2">Keranjang Belanja</h2>
                {cart.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-10">Keranjang masih kosong</p>
                ) : (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-xs border-b pb-2">
                        <div className="flex-1 pr-2">
                          <p className="font-medium text-slate-800">{item.name}</p>
                          <p className="text-slate-500">Rp {item.price.toLocaleString('id-ID')} x {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.id, -1)} className="bg-slate-200 px-1.5 py-0.5 rounded font-bold">-</button>
                          <span className="w-5 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="bg-slate-200 px-1.5 py-0.5 rounded font-bold">+</button>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-500 ml-1 font-bold">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rincian Pembayaran */}
              <div className="mt-4 pt-3 border-t text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PPN (11%)</span>
                  <span>Rp {tax.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 text-sm pt-1 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] text-slate-600 mb-1">Uang Tunai (Rp)</label>
                  <input
                    type="number"
                    placeholder="Masukkan nominal uang"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className="w-full border rounded p-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {cashNumber > 0 && (
                  <div className={`flex justify-between font-bold text-xs pt-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    <span>Kembalian</span>
                    <span>Rp {change >= 0 ? change.toLocaleString('id-ID') : 'Uang Kurang'}</span>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || cashNumber < grandTotal}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2 rounded-lg font-medium text-xs transition"
                >
                  Bayar & Selesaikan Transaksi
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Tab Laporan Harian */
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-semibold text-slate-700 mb-4 text-sm">Laporan Transaksi Harian</h2>
            {salesHistory.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-10">Belum ada transaksi hari ini.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {salesHistory.map(trx => (
                  <div key={trx.id} className="border border-slate-200 rounded-lg p-3 text-xs bg-slate-50 space-y-2">
                    <div className="flex justify-between font-medium text-slate-700 border-b pb-1">
                      <span>ID: #{trx.id}</span>
                      <span className="text-slate-500">{trx.date}</span>
                    </div>
                    <ul className="space-y-1">
                      {trx.items.map((it, idx) => (
                        <li key={idx} className="flex justify-between text-slate-600">
                          <span>{it.name} (x{it.qty})</span>
                          <span>Rp {(it.price * it.qty).toLocaleString('id-ID')}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t flex justify-between font-bold text-slate-800">
                      <span>Total: Rp {trx.grandTotal.toLocaleString('id-ID')}</span>
                      <span className="text-emerald-600">Kembali: Rp {trx.change.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Input Produk Baru jika Barcode Tidak Ditemukan */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Barcode Belum Terdaftar</h3>
            <p className="text-xs text-slate-500">
              Kode atau nama yang Anda masukkan belum ada di katalog. Silakan lengkapi data produk dan kategorinya di bawah ini untuk menyimpannya secara permanen.
            </p>
            
            <form onSubmit={handleSaveNewProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Barcode / Kode Rahasia</label>
                <input
                  type="text"
                  required
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  placeholder="Contoh: 8991005"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Nama Barang</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Flashdisk 32GB"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Kategori Barang</label>
                <input
                  type="text"
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Contoh: Aksesoris / Elektronik"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Contoh: 75000"
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Berat / Satuan</label>
                  <input
                    type="text"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="Contoh: 50 g"
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2 rounded font-medium hover:bg-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition"
                >
                  Simpan & Masukkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
  
