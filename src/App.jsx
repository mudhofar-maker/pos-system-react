import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const initialProducts = [
  { id: 1, barcode: '8991001', name: 'Laptop Dell XPS 13', category: 'Elektronik', price: 12000000, costPrice: 10000000, weight: '1.2 kg' },
  { id: 2, barcode: '8991002', name: 'Mouse Logitech MX Master', category: 'Elektronik', price: 750000, costPrice: 600000, weight: '150 g' },
  { id: 3, barcode: '8991003', name: 'Keyboard Mechanical RGB', category: 'Elektronik', price: 1200000, costPrice: 950000, weight: '800 g' }
];

export default function App() {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cashGiven, setCashGiven] = useState('');
  const [salesHistory, setSalesHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('kasir');

  // State Status Langganan (Pro / Free)
  const [isPro, setIsPro] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  
  // State untuk Scanner Kamera HP
  const [isScanning, setIsScanning] = useState(false);

  // State untuk Form Produk Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newWeight, setNewWeight] = useState('');

  // Jalankan Html5QrcodeScanner khusus untuk pengguna PRO
  useEffect(() => {
    let scanner = null;
    if (isScanning && isPro) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 150 } },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setIsScanning(false);
          handleProcessedCode(decodedText);
        },
        (error) => {}
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Failed to clear scanner. ", error));
      }
    };
  }, [isScanning, isPro]);

  const handleProcessedCode = (codeOrName) => {
    const query = (codeOrName || barcodeInput).trim();
    if (!query) return;

    const found = products.find(
      p => p.barcode === query || p.name.toLowerCase().includes(query.toLowerCase())
    );

    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      if (!isNaN(query)) {
        setNewBarcode(query);
        setNewName('');
      } else {
        setNewBarcode(`BARCODE-${Math.floor(1000 + Math.random() * 9000)}`);
        setNewName(query);
      }
      setNewCategory('Umum');
      setNewPrice('');
      setNewCostPrice('');
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
  const totalCost = cart.reduce((sum, item) => sum + ((item.costPrice || (item.price * 0.8)) * item.qty), 0);
  const profitEst = subtotal - totalCost;
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

    const transactionProfit = cart.reduce((sum, item) => {
      const c = item.costPrice || (item.price * 0.8);
      return sum + ((item.price - c) * item.qty);
    }, 0);

    const newTransaction = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      items: [...cart],
      subtotal,
      tax,
      grandTotal,
      cash: cashNumber,
      change,
      profit: transactionProfit
    };

    setSalesHistory([newTransaction, ...salesHistory]);
    setCart([]);
    setCashGiven('');
    alert('Transaksi berhasil disimpan & dicatat!');
  };

  const handleSaveNewProduct = (e) => {
    e.preventDefault();
    if (!newName || !newPrice) {
      alert('Nama Barang dan Harga Jual Wajib Diisi!');
      return;
    }

    const priceNum = parseFloat(newPrice) || 0;
    const costNum = parseFloat(newCostPrice) || (priceNum * 0.8);

    const newProd = {
      id: Date.now(),
      barcode: newBarcode || `BARCODE-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newName,
      category: newCategory || 'Umum',
      price: priceNum,
      costPrice: costNum,
      weight: newWeight || '1 pcs'
    };

    setProducts([newProd, ...products]);
    addToCart(newProd);

    setShowAddModal(false);
    setNewBarcode('');
    setNewName('');
    setNewCategory('');
    setNewPrice('');
    setNewCostPrice('');
    setNewWeight('');
  };

  const handleActivatePro = (e) => {
    e.preventDefault();
    // Simulasi kode aktivasi rahasia untuk demo (misal: "PRO-UMKM-2026")
    if (licenseKey.trim() === 'PRO-UMKM-2026' || licenseKey.trim() === '12345') {
      setIsPro(true);
      setShowUpgradeModal(false);
      setLicenseKey('');
      alert('Selamat! Akun toko Anda sekarang beralih ke Versi PRO (Fitur Scan Kamera & Laporan Keuntungan Aktif).');
    } else {
      alert('Kode Lisensi salah! Gunakan kode uji coba: PRO-UMKM-2026');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">POS System - Kasir UMKM</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isPro ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-white'}`}>
                {isPro ? '⭐ PRO VERSION' : '🔒 FREE VERSION'}
              </span>
            </div>
            <p className="text-xs text-blue-100">Solusi Cepat Penjualan & Gudang Toko</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setActiveTab('kasir')}
              className={`px-3 py-2 rounded-lg font-medium text-xs transition ${activeTab === 'kasir' ? 'bg-white text-blue-600 shadow' : 'bg-blue-700 text-white'}`}
            >
              Kasir Utama
            </button>
            <button
              onClick={() => setActiveTab('laporan')}
              className={`px-3 py-2 rounded-lg font-medium text-xs transition ${activeTab === 'laporan' ? 'bg-white text-blue-600 shadow' : 'bg-blue-700 text-white'}`}
            >
              Laporan ({salesHistory.length})
            </button>
            {!isPro && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-3 py-2 rounded-lg text-xs shadow transition animate-pulse"
              >
                ⭐ Upgrade Pro
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'kasir' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {/* Menu Scan & Input Manual */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Scan Barcode / Ketik Nama Barang..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleProcessedCode()}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleProcessedCode()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Cari / Tambah
                  </button>
                </div>

                {/* Tombol Kamera Scanner dengan Proteksi Versi Pro */}
                {isPro ? (
                  <div>
                    <button
                      onClick={() => setIsScanning(!isScanning)}
                      className={`w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition shadow-sm ${isScanning ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                    >
                      <span>{isScanning ? '❌ Tutup Kamera Scanner' : '📷 Buka Kamera Scanner Barcode (Pro)'}</span>
                    </button>

                    {isScanning && (
                      <div className="p-2 border border-emerald-500 rounded-lg bg-slate-50 mt-2">
                        <div id="reader" className="w-full"></div>
                        <p className="text-[11px] text-slate-500 text-center mt-2">Arahkan kamera ke barcode produk.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-amber-200 rounded-lg p-3 text-center space-y-2">
                    <p className="text-xs text-slate-600 font-medium">
                      🔒 Fitur <b>Scan Barcode Kamera HP</b> khusus untuk Pelanggan Versi Pro.
                    </p>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4 py-1.5 rounded text-xs shadow transition"
                    >
                      Buka Akses Kamera (Langganan Rp 29rb/bln)
                    </button>
                  </div>
                )}
              </div>

              {/* Katalog Produk */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h2 className="font-semibold text-slate-700 mb-3 text-sm">Katalog Produk ({products.length})</h2>
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
                  <span>Total Tagihan</span>
                  <span className="text-blue-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
                {isPro && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Estimasi Profit/Untung</span>
                    <span>Rp {profitEst.toLocaleString('id-ID')}</span>
                  </div>
                )}
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
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-semibold text-slate-700 text-sm">Laporan Riwayat Penjualan Toko</h2>
              {isPro && salesHistory.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                  Total Keuntungan Bersih: Rp {salesHistory.reduce((s, t) => s + (t.profit || 0), 0).toLocaleString('id-ID')}
                </span>
              )}
            </div>

            {salesHistory.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-10">Belum ada transaksi tercatat.</p>
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
                    <div className="pt-2 border-t flex justify-between font-bold text-slate-800 items-center">
                      <span>Total: Rp {trx.grandTotal.toLocaleString('id-ID')}</span>
                      {isPro ? (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Untung: Rp {(trx.profit || 0).toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-amber-600 text-[10px] italic">
                          (Upgrade ke Pro untuk lihat rincian untung)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Upgrade / Langganan Pro */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="text-center space-y-1">
              <span className="text-2xl">⭐</span>
              <h3 className="font-bold text-slate-800 text-base">Berlangganan POS UMKM Pro</h3>
              <p className="text-slate-500">Nikmati scan kamera tanpa batas & laporan rincian keuntungan toko.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg space-y-1.5 text-blue-900">
              <p className="font-bold">Keuntungan Paket Pro:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>Scan Barcode via Kamera HP sepuasnya</li>
                <li>Laporan Hitung Otomatis Keuntungan Bersih (Profit)</li>
                <li>Dukungan Prioritas & Update Fitur Toko</li>
              </ul>
              <p className="font-bold pt-1 text-blue-600">Biaya: Hanya Rp 29.000 / bulan</p>
            </div>

            <form onSubmit={handleActivatePro} className="space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Masukkan Kode Lisensi Toko</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh kode uji: PRO-UMKM-2026"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  *Untuk pengujian demo, ketik kode: <code className="bg-slate-100 text-blue-600 px-1 py-0.5 rounded font-bold">PRO-UMKM-2026</code>
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2 rounded font-medium hover:bg-slate-300"
                >
                  Nanti Saja
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 rounded shadow"
                >
                  Aktifkan Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Input Barang Baru */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 text-base">📦 Tambah Produk Baru</h3>
            <p className="text-slate-500">Barang ini belum terdaftar. Masukkan harga jual dan modal untuk perhitungan profit.</p>
            
            <form onSubmit={handleSaveNewProduct} className="space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Barcode</label>
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
                  placeholder="Nama produk..."
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Harga Jual (Rp)*</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Harga jual..."
                    className="w-full border rounded p-2 bg-yellow-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Harga Modal (Rp)</label>
                  <input
                    type="number"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    placeholder="Modal kulakan..."
                    className="w-full border rounded p-2"
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
                  Simpan & Jual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
