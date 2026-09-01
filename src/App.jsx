import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const initialProducts = [
  { id: 1, barcode: '8991001', name: 'Laptop Dell XPS 13', category: 'Elektronik', price: 12000000, weight: '1.2 kg' },
  { id: 2, barcode: '8991002', name: 'Mouse Logitech MX Master', category: 'Elektronik', price: 750000, weight: '150 g' }
];

export default function App() {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cashGiven, setCashGiven] = useState('');
  const [salesHistory, setSalesHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('kasir'); // 'kasir' atau 'laporan'
  
  // State untuk Modal / Form Tambah Produk Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState(''); // Kosong secara default agar bisa disesuaikan
  const [newWeight, setNewWeight] = useState('');

  // State untuk Kamera Scanner
  const [scanningActive, setScanningActive] = useState(false);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    if (scanningActive) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 150 } },
        false
      );
      scannerInstanceRef.current = scanner;

      scanner.render(
        (decodedText) => {
          // Sukses scan barcode dari kamera HP
          scanner.clear().catch(error => console.error("Failed to clear scanner. ", error));
          setScanningActive(false);
          handleDetectedCode(decodedText);
        },
        (error) => {
          // Abaikan error frame kamera kosong
        }
      );
    }

    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.clear().catch(() => {});
      }
    };
  }, [scanningActive]);

  // Fungsi Cek Barcode atau Nama (Mendukung Manual & Hasil Scan Kamera)
  const handleDetectedCode = (codeOrName) => {
    const query = (codeOrName || barcodeInput).trim();
    if (!query) return;

    const found = products.find(
      p => p.barcode === query || p.name.toLowerCase().includes(query.toLowerCase())
    );

    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      // Jika tidak ditemukan, buka form otomatis
      // Jika berupa angka/barcode, masukkan ke kolom barcode. Jika teks/nama, masukkan ke nama.
      if (!isNaN(query) && query.length > 3) {
        setNewBarcode(query);
        setNewName('');
      } else {
        setNewBarcode('');
        setNewName(query);
      }
      setNewCategory('');
      setNewPrice(''); // Dikosongkan mutlak agar siap disesuaikan
      setNewWeight('1 pcs');
      setShowAddModal(true);
      setBarcodeInput('');
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
  const tax = subtotal * 0.11;
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

  const handleSaveNewProduct = (e) => {
    e.preventDefault();
    if (!newName || !newPrice) {
      alert('Nama Barang dan Harga Wajib diisi!');
      return;
    }

    const newProd = {
      id: Date.now(),
      barcode: newBarcode || `MANUAL-${Date.now().toString().slice(-5)}`,
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
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <h1 className="text-xl font-bold">POS System - Gudang & Kasir</h1>
            <p className="text-xs text-blue-100">Scan Barcode Kamera & Input Manual Fleksibel</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('kasir')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${activeTab === 'kasir' ? 'bg-white text-blue-600 shadow' : 'bg-blue-700 text-white'}`}
            >
              Kasir & Scan Truk
            </button>
            <button
              onClick={() => setActiveTab('laporan')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${activeTab === 'laporan' ? 'bg-white text-blue-600 shadow' : 'bg-blue-700 text-white'}`}
            >
              Laporan ({salesHistory.length})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'kasir' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {/* Bagian Input & Tombol Kamera Scanner HP */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Scan Barcode / Ketik Nama Barang (Manual)..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDetectedCode()}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleDetectedCode()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Cari / Input
                  </button>
                </div>

                <button
                  onClick={() => setScanningActive(!scanningActive)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <span>📷 {scanningActive ? 'Tutup Kamera Scanner' : 'Buka Scanner Kamera HP (Bongkar Truk)'}</span>
                </button>

                {scanningActive && (
                  <div className="p-2 border border-emerald-300 rounded-lg bg-emerald-50">
                    <div id="reader" className="w-full"></div>
                    <p className="text-[11px] text-center text-emerald-700 mt-2 font-medium">Arahkan kamera ke barcode kemasan barang...</p>
                  </div>
                )}
              </div>

              {/* Katalog Produk */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h2 className="font-semibold text-slate-700 mb-3 text-sm">Katalog Produk Terdaftar ({products.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                  {products.map(p => (
                    <div key={p.id} className="border border-slate-200 rounded-lg p-3 flex flex-col justify-between bg-slate-50">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-800 text-sm">{p.name}</h3>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{p.category}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Barcode: {p.barcode}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-bold text-blue-600 text-sm">Rp {p.price.toLocaleString('id-ID')}</span>
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

            {/* Keranjang Belanja */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <h2 className="font-semibold text-slate-700 mb-3 text-sm border-b pb-2">Keranjang Kasir</h2>
                {cart.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-10">Keranjang kosong</p>
                ) : (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
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

              <div className="mt-4 pt-3 border-t text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-slate-800 text-sm">
                  <span>Total</span>
                  <span className="text-blue-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="mt-2">
                  <label className="block text-[11px] text-slate-600 mb-1">Uang Tunai (Rp)</label>
                  <input
                    type="number"
                    placeholder="Nominal bayar"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className="w-full border rounded p-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                {cashNumber > 0 && (
                  <div className={`flex justify-between font-bold text-xs pt-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    <span>Kembalian</span>
                    <span>Rp {change >= 0 ? change.toLocaleString('id-ID') : 'Kurang'}</span>
                  </div>
                )}
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || cashNumber < grandTotal}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2 rounded-lg font-medium text-xs transition"
                >
                  Selesaikan Transaksi
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-semibold text-slate-700 mb-4 text-sm">Laporan Transaksi Harian</h2>
            {salesHistory.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-10">Belum ada transaksi.</p>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Form Otomatis Input Barang Baru / Penyesuaian Harga */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-800 text-base">📦 Barang Baru Terdeteksi (Input Otomatis)</h3>
            <p className="text-xs text-slate-500">
              Barcode dari kemasan berhasil dibaca. Silakan lengkapi Nama, Kategori, dan sesuaikan Harga jualnya.
            </p>
            
            <form onSubmit={handleSaveNewProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Barcode / Kode Kemasan</label>
                <input
                  type="text"
                  required
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="w-full border rounded p-2 bg-slate-100 font-bold text-blue-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Nama Barang</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ketik nama barang..."
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
                  placeholder="Contoh: Rokok / Makanan / Minuman"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Harga Jual (Rp) - Wajib Diisi</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Masukkan harga..."
                    className="w-full border rounded p-2 bg-yellow-50 border-yellow-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Satuan / Berat</label>
                  <input
                    type="text"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="Contoh: 1 pcs"
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2 rounded font-medium hover:bg-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 shadow"
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
