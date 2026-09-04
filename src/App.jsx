import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import HardwareSettings from './components/HardwareSettings';
import POSAdvancedInventory from './components/POSAdvancedInventory';
import BarcodeManagement, { IntakeForm } from './components/BarcodeManagement';

// ==========================================
// SAPPHIRE BLUE THEME COLOR PALETTE
// ==========================================
const COLORS = {
  primary: '#0066CC',      // Sapphire Blue
  primaryDark: '#004BA0',  // Darker Sapphire
  primaryLight: '#3399FF', // Lighter Sapphire
  accent: '#00D9FF',       // Cyan Accent
  success: '#00AA44',      // Success Green
  error: '#DD0000',        // Error Red
  warning: '#FF9900',      // Warning Orange
  background: '#F0F4F8',   // Light Blue-Gray
  surface: '#FFFFFF',      // White Surface
  border: '#CCDDEE',       // Light Blue Border
  text: '#1A3A52',         // Dark Blue Text
  textSecondary: '#5A7A92' // Secondary Blue Text
};

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
  const [showScannerModal, setShowScannerModal] = useState(false);

  // State untuk Intake Form (Scan Produk Masuk)
  const [showIntakeForm, setShowIntakeForm] = useState(false);

  // State untuk Form Produk Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newStock, setNewStock] = useState('');

  // State untuk Mobile View
  const [showCart, setShowCart] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load inventory from localStorage on mount
  useEffect(() => {
    const savedInventory = BarcodeManagement.getInventory();
    if (savedInventory.length > 0) {
      // Merge dengan initial products
      const merged = [
        ...initialProducts,
        ...savedInventory.filter(inv => !initialProducts.some(prod => prod.barcode === inv.barcode))
      ];
      setProducts(merged);
    }
  }, []);

  // Scanner Effect
  useEffect(() => {
    let scanner = null;
    if (isScanning && !showIntakeForm) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setIsScanning(false);
          setShowScannerModal(false);
          // FUNGSI 2: Scan Kasir (Checkout)
          handleCheckoutScan(decodedText);
        },
        (error) => {
          console.log('Scanning error:', error);
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Failed to clear scanner. ", error));
      }
    };
  }, [isScanning, showIntakeForm]);

  /**
   * FUNGSI 2: SCAN BARCODE KASIR (CHECKOUT)
   * Barcode dicari di inventory, jika ada → masuk keranjang
   */
  const handleCheckoutScan = (decodedBarcode) => {
    const query = decodedBarcode.trim();
    if (!query) return;

    BarcodeManagement.handleCheckoutScan(
      query,
      products,
      (foundProduct) => {
        // Product ditemukan di inventory
        if (foundProduct.stock <= 0) {
          alert('❌ Stok barang ini sudah habis di gudang!');
          return;
        }
        addToCart(foundProduct);
        setBarcodeInput('');
      },
      (notFoundBarcode) => {
        // Product tidak ditemukan
        alert(`⚠️ Barcode "${notFoundBarcode}" tidak ditemukan di sistem!\n\nScan produk masuk dulu (Intake) sebelum menjual.`);
      }
    );
  };

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

    // Update stok di inventory juga
    BarcodeManagement.updateStockAfterCheckout(cart);

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
    
    alert(`✓ Transaksi berhasil!\nTotal: Rp ${grandTotal.toLocaleString('id-ID')}\nKembalian: Rp ${change.toLocaleString('id-ID')}`);
  };

  /**
   * Handle Intake Form Success
   * FUNGSI 1: Produk berhasil di-scan masuk → disimpan ke inventory
   */
  const handleIntakeSuccess = (productData) => {
    // Tambah produk ke state products juga
    const newProduct = {
      id: Date.now(),
      ...productData,
      source: 'INTAKE_SCAN'
    };
    setProducts(prev => [...prev, newProduct]);
  };

  // ==========================================
  // RENDER MOBILE VIEW
  // ==========================================
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: COLORS.background }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          
          {/* HEADER - Mobile */}
          <header style={{ 
            backgroundColor: COLORS.primary,
            color: COLORS.surface,
            padding: '16px 12px',
            boxShadow: '0 4px 12px rgba(0, 102, 204, 0.2)',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
              🛒 POS Mobile
            </h1>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>Toko Elektronik</p>
            <button
              onClick={() => setShowIntakeForm(true)}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                backgroundColor: COLORS.accent,
                color: COLORS.text,
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📦 Scan Produk Masuk
            </button>
          </header>

          {/* MAIN CONTENT - Mobile Tabs */}
          <main style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            
            {/* TAB BUTTONS */}
            <div style={{ 
              display: 'flex',
              gap: '8px',
              padding: '12px',
              backgroundColor: COLORS.surface,
              borderBottom: `2px solid ${COLORS.border}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              flexShrink: 0
            }}>
              <button
                onClick={() => setShowCart(false)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  backgroundColor: !showCart ? COLORS.primary : COLORS.background,
                  color: !showCart ? COLORS.surface : COLORS.text,
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📦 Katalog
              </button>
              <button
                onClick={() => setShowCart(true)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  backgroundColor: showCart ? COLORS.primary : COLORS.background,
                  color: showCart ? COLORS.surface : COLORS.text,
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                🛍️ Keranjang
                {cart.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: COLORS.error,
                    color: COLORS.surface,
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {cart.length}
                  </span>
                )}
              </button>
            </div>

            {/* CONTENT AREA - Katalog atau Keranjang */}
            <div style={{ 
              flex: 1,
              overflow: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column'
            }}>

              {!showCart ? (
                // ========== KATALOG TAB ==========
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Barcode Scanner Input */}
                  <div style={{ 
                    backgroundColor: COLORS.surface,
                    padding: '12px',
                    borderRadius: '8px',
                    border: `2px solid ${COLORS.primaryLight}`,
                    boxShadow: '0 2px 4px rgba(0, 102, 204, 0.1)'
                  }}>
                    <label style={{ 
                      fontWeight: 'bold', 
                      display: 'block', 
                      marginBottom: '8px',
                      fontSize: '13px',
                      color: COLORS.text
                    }}>
                      📱 Scan Barcode Kasir (Checkout):
                    </label>
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCheckoutScan(barcodeInput);
                        }
                      }}
                      placeholder="Ketik atau scan..."
                      style={{ 
                        padding: '10px', 
                        width: '100%',
                        borderRadius: '6px',
                        border: `1px solid ${COLORS.border}`,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        fontWeight: '500',
                        marginBottom: '10px'
                      }}
                      autoFocus
                    />
                    
                    {/* TOMBOL KAMERA BARCODE SCANNER */}
                    <button
                      onClick={() => {
                        setIsScanning(true);
                        setShowScannerModal(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: COLORS.accent,
                        color: COLORS.text,
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(0, 217, 255, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#00B8CC';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 217, 255, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.accent;
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 217, 255, 0.3)';
                      }}
                    >
                      📷 Buka Kamera Scanner Kasir
                    </button>
                  </div>

                  {/* Katalog Grid */}
                  <h3 style={{ 
                    margin: '8px 0', 
                    fontSize: '14px',
                    color: COLORS.text,
                    fontWeight: 'bold'
                  }}>
                    📦 Katalog ({products.length})
                  </h3>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px'
                  }}>
                    {products.map((prod) => (
                      <div 
                        key={prod.id} 
                        onClick={() => {
                          addToCart(prod);
                          setShowCart(true);
                        }}
                        style={{ 
                          border: `2px solid ${COLORS.primaryLight}`,
                          padding: '10px', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          backgroundColor: COLORS.surface,
                          boxShadow: '0 2px 6px rgba(0, 102, 204, 0.15)',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 102, 204, 0.25)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 102, 204, 0.15)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '12px', 
                          marginBottom: '4px',
                          color: COLORS.text,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {prod.name}
                        </div>
                        <div style={{ 
                          fontSize: '10px', 
                          color: COLORS.textSecondary,
                          marginBottom: '2px'
                        }}>
                          {prod.barcode}
                        </div>
                        <div style={{ 
                          fontSize: '10px', 
                          color: COLORS.textSecondary,
                          marginBottom: '6px'
                        }}>
                          Stok: {prod.stock}
                        </div>
                        <div style={{ 
                          color: COLORS.success,
                          fontWeight: 'bold', 
                          fontSize: '11px',
                          marginTop: 'auto'
                        }}>
                          Rp {prod.price.toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // ========== KERANJANG TAB ==========
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  
                  {/* Cart Items */}
                  <div style={{ 
                    flex: 1,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {cart.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        color: COLORS.textSecondary
                      }}>
                        <p style={{ fontSize: '14px', margin: 0 }}>🛍️ Keranjang kosong</p>
                        <p style={{ fontSize: '12px', margin: '8px 0 0 0', opacity: 0.7 }}>
                          Pilih produk dari katalog
                        </p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div 
                          key={item.id} 
                          style={{ 
                            backgroundColor: COLORS.surface,
                            padding: '10px',
                            borderRadius: '8px',
                            border: `1px solid ${COLORS.border}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        >
                          <div style={{ 
                            fontSize: '12px', 
                            fontWeight: 'bold', 
                            marginBottom: '4px',
                            color: COLORS.text
                          }}>
                            {item.name}
                          </div>
                          <div style={{ 
                            fontSize: '11px', 
                            color: COLORS.textSecondary, 
                            marginBottom: '8px'
                          }}>
                            Rp {item.price.toLocaleString('id-ID')}
                          </div>
                          
                          {/* Qty Controls */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            marginBottom: '6px'
                          }}>
                            <button 
                              onClick={() => updateQty(item.id, -1)}
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '11px',
                                backgroundColor: COLORS.error,
                                color: COLORS.surface,
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                              }}
                            >
                              −
                            </button>
                            <span style={{ 
                              fontWeight: 'bold', 
                              minWidth: '28px',
                              textAlign: 'center',
                              fontSize: '12px',
                              color: COLORS.text
                            }}>
                              {item.qty}
                            </span>
                            <button 
                              onClick={() => updateQty(item.id, 1)}
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '11px',
                                backgroundColor: COLORS.success,
                                color: COLORS.surface,
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                              }}
                            >
                              +
                            </button>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '10px',
                                backgroundColor: COLORS.textSecondary,
                                color: COLORS.surface,
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginLeft: 'auto',
                                fontWeight: 'bold'
                              }}
                            >
                              Hapus
                            </button>
                          </div>
                          
                          {/* Subtotal */}
                          <div style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold',
                            textAlign: 'right',
                            color: COLORS.primary,
                            paddingTop: '6px',
                            borderTop: `1px solid ${COLORS.border}`
                          }}>
                            Rp {(item.price * item.qty).toLocaleString('id-ID')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Summary & Checkout */}
                  {cart.length > 0 && (
                    <div style={{ 
                      backgroundColor: COLORS.surface,
                      padding: '12px',
                      borderRadius: '8px',
                      border: `2px solid ${COLORS.primary}`,
                      boxShadow: '0 2px 8px rgba(0, 102, 204, 0.15)'
                    }}>
                      {/* Summary Section */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '6px', 
                          fontSize: '11px'
                        }}>
                          <span style={{ color: COLORS.textSecondary }}>Subtotal:</span>
                          <span style={{ color: COLORS.text, fontWeight: 'bold' }}>
                            Rp {subtotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '6px', 
                          fontSize: '11px'
                        }}>
                          <span style={{ color: COLORS.textSecondary }}>Tax (11%):</span>
                          <span style={{ color: COLORS.text, fontWeight: 'bold' }}>
                            Rp {tax.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          paddingTop: '6px',
                          borderTop: `1px solid ${COLORS.border}`,
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          <span style={{ color: COLORS.text }}>Total:</span>
                          <span style={{ color: COLORS.primary }}>
                            Rp {grandTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Input Tunai */}
                      <input
                        type="number"
                        value={cashGiven}
                        onChange={(e) => setCashGiven(e.target.value)}
                        placeholder="Uang Tunai"
                        style={{ 
                          padding: '8px', 
                          width: '100%',
                          marginBottom: '8px',
                          borderRadius: '6px',
                          border: `1px solid ${COLORS.border}`,
                          boxSizing: 'border-box',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      />

                      {/* Kembalian */}
                      {cashNumber > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '10px', 
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor: change >= 0 ? '#E8F8F5' : '#FEF2F2',
                          padding: '8px',
                          borderRadius: '6px',
                          color: change >= 0 ? COLORS.success : COLORS.error
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
                          backgroundColor: cart.length === 0 || cashNumber < grandTotal 
                            ? COLORS.textSecondary 
                            : COLORS.primary,
                          color: COLORS.surface, 
                          border: 'none', 
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: cart.length === 0 || cashNumber < grandTotal 
                            ? 'not-allowed' 
                            : 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (cart.length > 0 && cashNumber >= grandTotal) {
                            e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (cart.length > 0 && cashNumber >= grandTotal) {
                            e.currentTarget.style.backgroundColor = COLORS.primary;
                          }
                        }}
                      >
                        ✓ Bayar Sekarang
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* SCANNER MODAL - Full Screen Camera View */}
        {showScannerModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: COLORS.text,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Scanner Header */}
            <div style={{
              backgroundColor: COLORS.primary,
              color: COLORS.surface,
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <h2 style={{ margin: 0, fontSize: '16px' }}>📷 Kamera Barcode Kasir</h2>
              <button
                onClick={() => {
                  setIsScanning(false);
                  setShowScannerModal(false);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: COLORS.error,
                  color: COLORS.surface,
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕ Tutup
              </button>
            </div>

            {/* Scanner Container */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#000'
            }} id="reader">
            </div>

            {/* Scanner Footer */}
            <div style={{
              backgroundColor: COLORS.background,
              padding: '16px',
              textAlign: 'center',
              flexShrink: 0,
              borderTop: `2px solid ${COLORS.border}`
            }}>
              <p style={{ 
                margin: 0, 
                color: COLORS.text,
                fontWeight: 'bold',
                fontSize: '13px'
              }}>
                🔍 Arahkan barcode ke kamera
              </p>
              <p style={{ 
                margin: '6px 0 0 0', 
                color: COLORS.textSecondary,
                fontSize: '11px'
              }}>
                Barcode akan otomatis ditambahkan ke keranjang
              </p>
            </div>
          </div>
        )}

        {/* INTAKE FORM - Scan Produk Masuk */}
        {showIntakeForm && (
          <IntakeForm
            onClose={() => setShowIntakeForm(false)}
            onSuccess={handleIntakeSuccess}
          />
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER DESKTOP VIEW
  // ==========================================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.background }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* HEADER - Desktop */}
        <header style={{ 
          backgroundColor: COLORS.primary,
          color: COLORS.surface,
          padding: '18px 24px',
          boxShadow: '0 4px 12px rgba(0, 102, 204, 0.2)',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: '0', fontSize: '26px', fontWeight: 'bold' }}>
            🛒 Sistem POS - Toko Elektronik
          </h1>
          <button
            onClick={() => setShowIntakeForm(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: COLORS.accent,
              color: COLORS.text,
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#00B8CC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accent;
            }}
          >
            📦 Scan Produk Masuk (Intake)
          </button>
        </header>

        {/* MAIN CONTENT - Desktop */}
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
            backgroundColor: COLORS.surface,
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0, 102, 204, 0.1)',
            border: `1px solid ${COLORS.border}`
          }}>
            
            {/* Barcode Input Section - KASIR CHECKOUT */}
            <div style={{ 
              backgroundColor: COLORS.background,
              padding: '15px', 
              borderRadius: '8px',
              border: `2px solid ${COLORS.primary}`,
              flexShrink: 0
            }}>
              <label style={{ 
                fontWeight: 'bold', 
                display: 'block', 
                marginBottom: '8px',
                color: COLORS.text
              }}>
                📱 Scan Barcode Kasir / Input SKU (CHECKOUT):
              </label>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCheckoutScan(barcodeInput);
                  }
                }}
                placeholder="Arahkan scanner ke sini atau ketik SKU..."
                style={{ 
                  padding: '11px', 
                  width: '100%', 
                  borderRadius: '6px',
                  border: `1px solid ${COLORS.border}`,
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontWeight: '500'
                }}
                autoFocus
              />
            </div>

            {/* Katalog Section */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <h3 style={{ 
                marginTop: 0, 
                marginBottom: '15px', 
                color: COLORS.text,
                fontSize: '16px'
              }}>
                📦 Katalog Barang ({products.length})
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '12px'
              }}>
                {products.map((prod) => (
                  <div 
                    key={prod.id} 
                    onClick={() => addToCart(prod)}
                    style={{ 
                      border: `2px solid ${COLORS.primaryLight}`,
                      padding: '12px', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      backgroundColor: COLORS.surface,
                      boxShadow: '0 2px 6px rgba(0, 102, 204, 0.1)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 102, 204, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 102, 204, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px', color: COLORS.text }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '3px' }}>
                      Barcode: {prod.barcode}
                    </div>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '5px' }}>
                      Stok: {prod.stock}
                    </div>
                    <div style={{ color: COLORS.success, fontWeight: 'bold', fontSize: '12px' }}>
                      Rp {prod.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SISI KANAN: Keranjang & Checkout */}
          <aside style={{ 
            width: '380px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            flexShrink: 0,
            overflow: 'auto'
          }}>
            
            {/* Keranjang Belanja */}
            <div style={{ 
              backgroundColor: COLORS.surface,
              padding: '20px', 
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0, 102, 204, 0.1)',
              border: `1px solid ${COLORS.border}`,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                marginBottom: '15px', 
                color: COLORS.text,
                fontSize: '16px'
              }}>
                🛍️ Keranjang Belanja
              </h3>
              
              {/* Item List */}
              <div style={{ flex: 1, overflow: 'auto', marginBottom: '15px' }}>
                {cart.length === 0 ? (
                  <p style={{ color: COLORS.textSecondary, textAlign: 'center', padding: '20px 0' }}>
                    Belum ada item
                  </p>
                ) : (
                  cart.map((item) => (
                    <div 
                      key={item.id} 
                      style={{ 
                        marginBottom: '12px', 
                        paddingBottom: '12px',
                        borderBottom: `1px solid ${COLORS.border}`,
                        backgroundColor: COLORS.background,
                        padding: '10px',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: COLORS.text }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '5px' }}>
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
                            padding: '5px 10px', 
                            fontSize: '12px',
                            backgroundColor: COLORS.error,
                            color: COLORS.surface,
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          −
                        </button>
                        <span style={{ 
                          fontWeight: 'bold', 
                          minWidth: '30px',
                          textAlign: 'center',
                          color: COLORS.text
                        }}>
                          {item.qty}
                        </span>
                        <button 
                          onClick={() => updateQty(item.id, 1)}
                          style={{ 
                            padding: '5px 10px', 
                            fontSize: '12px',
                            backgroundColor: COLORS.success,
                            color: COLORS.surface,
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          +
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          style={{ 
                            padding: '5px 10px', 
                            fontSize: '11px',
                            backgroundColor: COLORS.textSecondary,
                            color: COLORS.surface,
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginLeft: 'auto',
                            fontWeight: 'bold'
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
                        color: COLORS.primary
                      }}>
                        Rp {(item.price * item.qty).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary Section */}
              <div style={{ 
                borderTop: `2px solid ${COLORS.primary}`,
                paddingTop: '15px',
                backgroundColor: COLORS.background,
                padding: '15px',
                borderRadius: '8px',
                marginTop: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: COLORS.textSecondary }}>Subtotal:</span>
                  <span style={{ color: COLORS.text, fontWeight: 'bold' }}>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: COLORS.textSecondary }}>Tax (11%):</span>
                  <span style={{ color: COLORS.text, fontWeight: 'bold' }}>Rp {tax.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '12px', 
                  fontSize: '14px',
                  fontWeight: 'bold',
                  borderTop: `1px solid ${COLORS.border}`,
                  paddingTop: '8px',
                  color: COLORS.primary
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
                    padding: '10px', 
                    width: '100%',
                    marginBottom: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
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
                    backgroundColor: change >= 0 ? '#E8F8F5' : '#FEF2F2',
                    padding: '10px',
                    borderRadius: '6px',
                    color: change >= 0 ? COLORS.success : COLORS.error
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
                    backgroundColor: cart.length === 0 || cashNumber < grandTotal 
                      ? COLORS.textSecondary 
                      : COLORS.primary,
                    color: COLORS.surface, 
                    border: 'none', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: cart.length === 0 || cashNumber < grandTotal 
                      ? 'not-allowed' 
                      : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (cart.length > 0 && cashNumber >= grandTotal) {
                      e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (cart.length > 0 && cashNumber >= grandTotal) {
                      e.currentTarget.style.backgroundColor = COLORS.primary;
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

      {/* INTAKE FORM - Scan Produk Masuk */}
      {showIntakeForm && (
        <IntakeForm
          onClose={() => setShowIntakeForm(false)}
          onSuccess={handleIntakeSuccess}
        />
      )}
    </div>
  );
}
