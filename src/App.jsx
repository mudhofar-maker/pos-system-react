import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const initialProducts = [
  { id: 1, barcode: '8991001', name: 'Laptop Dell XPS 13', category: 'Elektronik', price: 12000000, costPrice: 10000000, stock: 10 },
  { id: 2, barcode: '8991002', name: 'Mouse Logitech MX Master', category: 'Elektronik', price: 750000, costPrice: 600000, stock: 25 },
  { id: 3, barcode: '8991003', name: 'Keyboard Mechanical RGB', category: 'Elektronik', price: 1200000, costPrice: 950000, stock: 15 }
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
  
  // State Struk Terakhir untuk Dicetak
  const [latestTransaction, setLatestTransaction] = useState(null);
  
  // State untuk Scanner Kamera HP
  const [isScanning, setIsScanning] = useState(false);

  // State untuk Form Produk Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newStock, setNewStock] = useState('');

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
      if (found.stock <= 0) {
        alert('Stok barang ini sudah habis di gudang!');
        return;
      }
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
      setNewStock('10');
      setShowAddModal(true);
      setBarcodeInput('');
    }
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      const currentQty = existing ? existing.qty : 0;
      
      if (currentQty + 1 > product.stock) {
        alert('Jumlah melebihi stok gudang yang tersedia!');
        return prevCart;
      }

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
          const productRef = products.find(p => p.id === id);
          const newQty = item.qty + delta;
          if (newQty > productRef.stock) {
            alert('Stok gudang tidak mencukupi!');
            return item;
          }
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

    // Kurangi stok produk secara otomatis
    setProducts(prevProducts =>
      prevProducts.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        if (cartItem) {
          return { ...p, stock: p.stock - cartItem.qty };
        }
        return p;
      })
    );

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
    setLatestTransaction(newTransaction);
    setCart([]);
    setCashGiven('');
    alert('Transaksi berhasil! Struk siap dicetak.');
  };

  const handlePrintReceipt = (trx) => {
    setLatestTransaction(trx);
    setTimeout(() => {
      window.print();
    }, 300);
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
      stock: parseInt(newStock) || 10
    };

    setProducts([newProd, ...products]);
    addToCart(newProd);

    setShowAddModal(false);
    setNewBarcode('');
    setNewName('');
    setNewCategory('');
    setNewPrice('');
    setNewCostPrice('');
    setNewStock('');
  };

  const handleActivatePro = (e) => {
    e.preventDefault();
    if (licenseKey.trim() === 'PRO-UMKM-2026' || licenseKey.trim() === '12345') {
      setIsPro(true);
      setShowUpgradeModal(false);
      setLicenseKey('');
      alert('Selamat! Toko Anda sekarang terhubung ke Versi PRO (Fitur Cetak Struk Bluetooth & Scanner Aktif).');
    } else {
      alert('Kode Lisensi salah! Gunakan kode demo: PRO-UMKM-2026');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      {/* Header Aplikasi (Tersembunyi saat Cetak Struk) */}
      <header className="bg-blue-600 text-white p-4 shadow-md print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">POS System - Kasir UMKM</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isPro ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-white'}`}>
                {isPro ? '⭐ PRO VERSION' : '🔒 FREE VERSION'}
              </span>
            </div>
            <p className="text-xs text-blue-100">Solusi Kasir, Stok Gudang & Cetak Struk Bluetooth</p>
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

      {/* Area Cetak Struk Tersembunyi Khusus Printer Thermal */}
      <div className="hidden print:block p-4 bg-white text-black text-xs font-mono w-[58mm] mx-auto">
        {latestTransaction && (
          <div className="space-y-1 text-center">
            <h2 className="font-bold text-sm">TOKO KELONTONG UMKM</h2>
            <p className="text-[10px]">Jl. Niaga Raya No. 10, Indonesia</p>
            <div className="border-b border-dashed my-1"></div>
            <div className="text-left text-[10px]">
              <p>ID: #{latestTransaction.id}</p>
              <p>Tgl: {latestTransaction.date}</p>
            </div>
            <div className="border-b border-dashed my-1"></div>
            <div className="text-left space-y-1">
              {latestTransaction.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.name} (x{it.qty})</span>
                  <span>Rp {(it.price * it.qty).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
            <div className="border-b border-dashed my-1"></div>
            <div className="text-right space-y-0.5 text-[10px]">
              <div className="flex justify-between"><span>Subtotal:</span><span>Rp {latestTransaction.subtotal.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span>Pajak (11%):</span><span>Rp {latestTransaction.tax.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t"><span>TOTAL:</span><span>Rp {latestTransaction.grandTotal.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span>Tunai:</span><span>Rp {latestTransaction.cash.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span>Kembali:</span><span>Rp {latestTransaction.change.toLocaleString('id-ID')}</span></div>
            </div>
            <div className="border-b border-dashed my-2"></div>
            <p className="text-[10px] text-center">Terima Kasih Atas Kunjungan Anda!</p>
          </div>
        )}
      </div>

      <main className="max-w-4xl mx-auto p-4 print:hidden">
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
                      🔒 Fitur <b>Scan Kamera & Cetak Struk Bluetooth</b> khusus Versi Pro.
                    </p>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4 py-1.5 rounded text-xs shadow transition"
                    >
                      Buka Fitur Pro (Rp 29rb/bln)
                    </button>
                  </div>
                )}
              </div>

              {/* Katalog Produk dengan Status Stok */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h2 className="font-semibold text-slate-700 mb-3 text-sm">Katalog & Stok Gudang ({products.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                  {products.map(p => (
                    <div key={p.id} className="border border-slate-200 rounded-lg p-3 flex flex-col justify-between bg-slate-50">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-800 text-sm">{p.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.stock <= 3 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                            Stok: {p.stock} pcs
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Barcode: {p.barcode}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-bold text-blue-600 text-sm">Rp {p.price.toLocaleString('id-ID')}</span>
                        <button
                          onClick={() => addToCart(p)}
                          disabled={p.stock <= 0}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs px-3 py-1.5 rounded font-medium transition"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Keranjang Kasir */}
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
                    <span>Rp {cart.reduce((s, it) => s + ((it.price - (it.costPrice || it.price * 0.8)) * it.qty), 0).toLocaleString('id-ID')}</span>
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
                  Selesaikan & Bayar
                </button>

                {/* Tombol Cetak Struk Cepat khusus Pro */}
                {isPro && latestTransaction && (
                  <button
                    onClick={() => handlePrintReceipt(latestTransaction)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1"
                  >
                    🖨️ Cetak Struk Transaksi Terakhir
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-semibold text-slate-700 text-sm">Laporan Riwayat Penjualan Toko</h2>
              {isPro && salesHistory.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                  Total Keuntungan: Rp {salesHistory.reduce((s, t) => s + (t.profit || 0), 0).toLocaleString('id-ID')}
                </span>
              )}
            </div>

            {salesHistory.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-10">Belum ada transaksi tercatat.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {salesHistory.map(trx => (
                  <div key={trx.id} className="border border-slate-200 rounded-lg p-3 text-xs bg-slate-50 space-y-2">
                    <div className="flex justify-between font-medium text-slate-700 border-b pb-1 items-center">
                      <span>ID: #{trx.id}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{trx.date}</span>
                        {isPro && (
                          <button
                            onClick={() => handlePrintReceipt(trx)}
                            className="bg-slate-800 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-900"
                          >
                            🖨️ Cetak Struk
                          </button>
                        )}
                      </div>
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
                      {isPro && (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Untung: Rp {(trx.profit || 0).toLocaleString('id-ID')}
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

      {/* Modal Upgrade Pro */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="text-center space-y-1">
              <span className="text-2xl">⭐</span>
              <h3 className="font-bold text-slate-800 text-base">Berlangganan POS UMKM Pro</h3>
              <p className="text-slate-500">Fitur cetak struk bluetooth, scan kamera, & manajemen stok gudang.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg space-y-1.5 text-blue-900">
              <p className="font-bold">Keuntungan Paket Pro:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>Cetak Struk Nota via Printer Thermal Bluetooth</li>
                <li>Scan Barcode via Kamera HP Tanpa Batas</li>
                <li>Manajemen Stok Gudang & Hitung Otomatis Profit</li>
              </ul>
              <p className="font-bold pt-1 text-blue-600">Biaya: Hanya Rp 29.000 / bulan</p>
            </div>

            <form onSubmit={handleActivatePro} className="space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Masukkan Kode Lisensi Toko</label>
                <input
                  type="text"
                  required
                  placeholder="Kode uji coba: PRO-UMKM-2026"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  *Gunakan kode demo: <code className="bg-slate-100 text-blue-600 px-1 py-0.5 rounded font-bold">PRO-UMKM-2026</code>
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

      {/* Modal Tambah Produk & Stok */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 text-base">📦 Tambah Produk & Stok Gudang</h3>
            <p className="text-slate-500">Barang ini belum terdaftar. Masukkan harga jual dan jumlah stok awal.</p>
            
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Harga Jual*</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Jual..."
                    className="w-full border rounded p-2 bg-yellow-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Harga Modal</label>
                  <input
                    type="number"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    placeholder="Modal..."
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="Stok..."
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
