import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import HardwareSettings from './components/HardwareSettings';
import POSAdvancedInventory from './components/POSAdvancedInventory';


const initialProducts = [
  { id: 1, barcode: '8991001', name: 'Laptop Dell XPS 13', category: 'Elektronik', price: 12000000, costPrice: 10000000, stock: 10 },
  { id: 2, barcode: '8991002', name: 'Mouse Logitech MX Master', category: 'Elektronik', price: 750000, costPrice: 600000, stock: 25 },
  { id: 3, barcode: '8991003', name: 'Keyboard Mechanical RGB', category: 'Elektronik', price: 1200000, costPrice: 950000, stock: 15 }
];

export default function App(){
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
      date: new Date().toISOString(),
      items: [...cart],
      total: subtotal,
      tax: tax,
      grandTotal: grandTotal,
      discount: 0,
      cashGiven: cashNumber,
      change: change,
      profit: transactionProfit
    };

    setSalesHistory(prevHistory => [...prevHistory, newTransaction]);
    setLatestTransaction(newTransaction);
    setCart([]);
    setCashGiven('');
    setBarcodeInput('');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* WRAPPER UTAMA: Full Height Container */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* HEADER: Fixed Top */}
        <header style={{ 
          backgroundColor: '#2c3e50', 
          color: 'white', 
          padding: '15px 20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          flexShrink: 0
        }}>
          <h1 style={{ margin: '0', fontSize: '24px' }}>🛒 Sistem POS - Toko Elektronik</h1>
        </header>

        {/* MAIN CONTENT: Flex Container untuk Layout */}
        <main style={{ 
          display: 'flex', 
          flex: 1,
          gap: '20px',
          padding: '20px',
          overflow: 'hidden'
        }}>
          
          {/* SISI KIRI: Katalog & Barcode Scanner */}
          <div style={{ 
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            overflow: 'auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            
            {/* Barcode Input Section */}
            <div style={{ 
              backgroundColor: '#ecf0f1', 
              padding: '15px', 
              borderRadius: '5px',
              flexShrink: 0
            }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                📱 Scan Barcode:
              </label>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleProcessedCode(barcodeInput);
                  }
                }}
                placeholder="Arahkan scanner ke sini lalu tekan Enter..."
                style={{ 
                  padding: '10px', 
                  width: '100%', 
                  borderRadius: '5px',
                  border: '1px solid #bdc3c7',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            {/* Katalog Section */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50' }}>
                📦 Katalog Barang ({products.length})
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px'
              }}>
                {products.map((prod) => (
                  <div 
                    key={prod.id} 
                    onClick={() => addToCart(prod)}
                    style={{ 
                      border: '1px solid #bdc3c7', 
                      padding: '12px', 
                      borderRadius: '5px', 
                      cursor: 'pointer', 
                      backgroundColor: '#fff',
                      transition: 'all 0.2s',
                      ':hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#7f8c8d', marginBottom: '3px' }}>
                      Barcode: {prod.barcode}
                    </div>
                    <div style={{ fontSize: '11px', color: '#7f8c8d', marginBottom: '5px' }}>
                      Stok: {prod.stock}
                    </div>
                    <div style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '12px' }}>
                      Rp {prod.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SISI KANAN: Keranjang & Checkout */}
          <aside style={{ 
            width: '350px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            flexShrink: 0,
            overflow: 'auto'
          }}>
            
            {/* Keranjang Belanja */}
            <div style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50' }}>
                🛍️ Keranjang Belanja
              </h3>
              
              {/* Item List */}
              <div style={{ flex: 1, overflow: 'auto', marginBottom: '15px' }}>
                {cart.length === 0 ? (
                  <p style={{ color: '#95a5a6', textAlign: 'center', padding: '20px 0' }}>
                    Belum ada item
                  </p>
                ) : (
                  cart.map((item) => (
                    <div 
                      key={item.id} 
                      style={{ 
                        marginBottom: '12px', 
                        paddingBottom: '12px',
                        borderBottom: '1px solid #ecf0f1',
                        backgroundColor: '#f8f9fa',
                        padding: '10px',
                        borderRadius: '5px'
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>
                        Rp {item.price.toLocaleString('id-ID')}
                      </div>
                      
                      {/* Qty Controls */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <button 
                          onClick={() => updateQty(item.id, -1)}
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '12px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          −
                        </button>
                        <span style={{ 
                          fontWeight: 'bold', 
                          minWidth: '30px',
                          textAlign: 'center'
                        }}>
                          {item.qty}
                        </span>
                        <button 
                          onClick={() => updateQty(item.id, 1)}
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '12px',
                            backgroundColor: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          +
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '11px',
                            backgroundColor: '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            marginLeft: 'auto'
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                      
                      {/* Subtotal Item */}
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        textAlign: 'right',
                        color: '#2c3e50'
                      }}>
                        Rp {(item.price * item.qty).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary Section */}
              <div style={{ 
                borderTop: '2px solid #ecf0f1',
                paddingTop: '15px',
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '5px',
                marginTop: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span>Subtotal:</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span>Tax (11%):</span>
                  <span>Rp {tax.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '12px', 
                  fontSize: '14px',
                  fontWeight: 'bold',
                  borderTop: '1px solid #bdc3c7',
                  paddingTop: '8px',
                  color: '#e74c3c'
                }}>
                  <span>Total:</span>
                  <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>

                {/* Input Tunai */}
                <input
                  type="number"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="Masukkan Uang Tunai"
                  style={{ 
                    padding: '8px', 
                    width: '100%',
                    marginBottom: '8px',
                    borderRadius: '5px',
                    border: '1px solid #bdc3c7',
                    boxSizing: 'border-box',
                    fontSize: '13px'
                  }}
                />

                {/* Kembalian */}
                {cashNumber > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '12px', 
                    fontSize: '13px',
                    fontWeight: 'bold',
                    backgroundColor: change >= 0 ? '#d5f4e6' : '#fadbd8',
                    padding: '8px',
                    borderRadius: '5px',
                    color: change >= 0 ? '#27ae60' : '#e74c3c'
                  }}>
                    <span>Kembalian:</span>
                    <span>Rp {change.toLocaleString('id-ID')}</span>
                  </div>
                )}

                {/* Tombol Checkout */}
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || cashNumber < grandTotal}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    backgroundColor: cart.length === 0 || cashNumber < grandTotal ? '#bdc3c7' : '#27ae60',
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: cart.length === 0 || cashNumber < grandTotal ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (cart.length > 0 && cashNumber >= grandTotal) {
                      e.currentTarget.style.backgroundColor = '#229954';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (cart.length > 0 && cashNumber >= grandTotal) {
                      e.currentTarget.style.backgroundColor = '#27ae60';
                    }
                  }}
                >
                  ✓ Bayar Sekarang
                </button>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
