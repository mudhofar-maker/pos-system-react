import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

/**
 * BARCODE MANAGEMENT SYSTEM
 * 
 * Fungsi 1: Scan Kemasan Produk Masuk Pabrik
 *   - Input: Barcode kemasan produk dari gudang pabrik
 *   - Output: Otomatis form input etalase, data tersimpan di sistem
 * 
 * Fungsi 2: Scan Barcode Kasir (Checkout)
 *   - Input: Scan barcode di layar kasir
 *   - Output: Memanggil data produk yang sudah ada di sistem (dari scan pertama)
 *   - Alasan: Data sudah ada karena sudah di-scan saat pertama masuk
 */

export const BarcodeManagement = {
  
  // ==========================================
  // FUNGSI 1: SCAN BARCODE MASUK (INTAKE)
  // ==========================================
  
  /**
   * Scan barcode kemasan produk dari pabrik/supplier
   * Otomatis populate form dengan barcode + nomor random
   * User tinggal input nama, harga, stok → tersimpan ke database
   */
  handleIntakeScan: (decodedBarcode, callback) => {
    if (!decodedBarcode || decodedBarcode.trim() === '') {
      alert('❌ Barcode tidak terbaca!');
      return;
    }

    // Validasi: barcode harus numeric atau format standar
    const isValidBarcode = /^[0-9A-Za-z-]{5,}$/.test(decodedBarcode);
    if (!isValidBarcode) {
      alert('❌ Format barcode tidak valid!');
      return;
    }

    // Return data untuk di-populate ke form etalase
    const intakeData = {
      barcode: decodedBarcode,
      timestamp: new Date().toISOString(),
      source: 'INTAKE_SCAN', // Penanda: scan masuk barang
      status: 'PENDING_ENTRY', // Status: menunggu data lengkap
      randomId: `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    callback(intakeData);
  },

  /**
   * Simpan data produk yang di-scan ke localStorage (simulasi database)
   * Setelah user input form lengkap
   */
  saveToInventory: (productData) => {
    try {
      const inventory = JSON.parse(localStorage.getItem('inventory')) || [];
      
      // Cek duplikat barcode
      const exists = inventory.some(item => item.barcode === productData.barcode);
      if (exists) {
        alert(`⚠️ Barcode ${productData.barcode} sudah terdaftar!`);
        return false;
      }

      // Tambah ID unik untuk setiap produk
      const newProduct = {
        id: Date.now(),
        ...productData,
        createdAt: new Date().toISOString(),
        source: 'SCANNED_INTAKE'
      };

      inventory.push(newProduct);
      localStorage.setItem('inventory', JSON.stringify(inventory));
      
      console.log('✓ Produk berhasil disimpan ke inventory:', newProduct);
      return true;
    } catch (error) {
      console.error('Error saving to inventory:', error);
      alert('❌ Gagal menyimpan produk!');
      return false;
    }
  },

  /**
   * Retrieve inventory dari localStorage
   */
  getInventory: () => {
    try {
      return JSON.parse(localStorage.getItem('inventory')) || [];
    } catch (error) {
      console.error('Error retrieving inventory:', error);
      return [];
    }
  },

  // ==========================================
  // FUNGSI 2: SCAN BARCODE KASIR (CHECKOUT)
  // ==========================================

  /**
   * Scan barcode di layar kasir
   * Barcode akan dicari di inventory (dari scan pertama)
   * Jika found → langsung masuk ke keranjang belanja
   * Jika not found → show alert (belum ada di sistem)
   */
  handleCheckoutScan: (decodedBarcode, inventory, onFound, onNotFound) => {
    if (!decodedBarcode || decodedBarcode.trim() === '') {
      alert('❌ Barcode tidak terbaca!');
      return;
    }

    // Cari di inventory berdasarkan barcode atau nama
    const found = inventory.find(item => 
      item.barcode === decodedBarcode || 
      item.name?.toLowerCase().includes(decodedBarcode.toLowerCase())
    );

    if (found) {
      // Data ada di sistem → callback untuk masuk ke keranjang
      onFound({
        id: found.id,
        barcode: found.barcode,
        name: found.name,
        price: found.price,
        costPrice: found.costPrice,
        stock: found.stock,
        source: 'CHECKOUT_SCAN', // Penanda: scan checkout
        scannedAt: new Date().toISOString()
      });
    } else {
      // Data tidak ada → alert user
      onNotFound(decodedBarcode);
    }
  },

  /**
   * Validasi stok sebelum menambah ke keranjang
   */
  validateStock: (product, currentCartQty = 0) => {
    const availableStock = product.stock - currentCartQty;
    
    if (availableStock <= 0) {
      return {
        valid: false,
        message: `❌ Stok ${product.name} habis!`
      };
    }

    if (currentCartQty + 1 > product.stock) {
      return {
        valid: false,
        message: `⚠️ Stok hanya tersisa ${availableStock} unit`
      };
    }

    return {
      valid: true,
      message: `✓ ${product.name} berhasil ditambahkan`
    };
  },

  /**
   * Update stok setelah checkout
   */
  updateStockAfterCheckout: (productIds) => {
    try {
      const inventory = JSON.parse(localStorage.getItem('inventory')) || [];
      
      const updated = inventory.map(item => {
        const cartItem = productIds.find(c => c.id === item.id);
        if (cartItem) {
          return {
            ...item,
            stock: item.stock - cartItem.qty,
            lastSoldAt: new Date().toISOString()
          };
        }
        return item;
      });

      localStorage.setItem('inventory', JSON.stringify(updated));
      console.log('✓ Stok berhasil diupdate');
      return true;
    } catch (error) {
      console.error('Error updating stock:', error);
      return false;
    }
  }
};

// ==========================================
// REACT COMPONENT: INTAKE FORM
// ==========================================

export function IntakeForm({ onClose, onSuccess }) {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Elektronik');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const COLORS = {
    primary: '#0066CC',
    success: '#00AA44',
    error: '#DD0000',
    surface: '#FFFFFF',
    background: '#F0F4F8',
    text: '#1A3A52'
  };

  // Initialize scanner
  useEffect(() => {
    let scanner = null;
    if (isScanning && showScanner) {
      scanner = new Html5QrcodeScanner(
        "intake-scanner",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          // SCAN PERTAMA - Intake
          BarcodeManagement.handleIntakeScan(decodedText, (intakeData) => {
            setBarcode(intakeData.barcode);
            scanner.clear();
            setIsScanning(false);
            setShowScanner(false);
          });
        },
        (error) => console.log('Scanner error:', error)
      );
    }

    return () => {
      if (scanner) scanner.clear().catch(e => console.error(e));
    };
  }, [isScanning, showScanner]);

  const handleSubmit = () => {
    if (!barcode || !name || !price || !stock) {
      alert('⚠️ Lengkapi semua field!');
      return;
    }

    const productData = {
      barcode,
      name,
      category,
      price: parseFloat(price),
      costPrice: parseFloat(costPrice) || parseFloat(price) * 0.8,
      stock: parseInt(stock)
    };

    if (BarcodeManagement.saveToInventory(productData)) {
      alert(`✓ Produk "${name}" berhasil disimpan!\nBarcode: ${barcode}`);
      onSuccess?.(productData);
      onClose?.();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: COLORS.surface,
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: COLORS.text }}>
          📦 Scan Kemasan Produk Masuk
        </h2>

        {/* Scanner Section */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => {
              setIsScanning(true);
              setShowScanner(true);
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: COLORS.primary,
              color: COLORS.surface,
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            📷 Buka Kamera Scanner
          </button>

          {showScanner && (
            <div style={{
              border: `2px solid ${COLORS.primary}`,
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div id="intake-scanner" style={{ minHeight: '300px' }}></div>
              <button
                onClick={() => {
                  setIsScanning(false);
                  setShowScanner(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: COLORS.error,
                  color: COLORS.surface,
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✕ Tutup Kamera
              </button>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', color: COLORS.text }}>
            Barcode:
          </label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Hasil scan atau input manual"
            style={{
              width: '100%',
              padding: '10px',
              border: `2px solid ${COLORS.primary}`,
              borderRadius: '6px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', color: COLORS.text }}>
            Nama Produk:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Laptop Dell XPS 13"
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid #ccc`,
              borderRadius: '6px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', color: COLORS.text }}>
            Kategori:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid #ccc`,
              borderRadius: '6px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          >
            <option>Elektronik</option>
            <option>Aksesoris</option>
            <option>Lainnya</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', color: COLORS.text }}>
              Harga Jual:
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid #ccc`,
                borderRadius: '6px',
                boxSizing: 'border-box',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', color: COLORS.text }}>
              Harga Beli:
            </label>
            <input
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid #ccc`,
                borderRadius: '6px',
                boxSizing: 'border-box',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', color: COLORS.text }}>
            Stok:
          </label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="0"
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid #ccc`,
              borderRadius: '6px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px',
              backgroundColor: '#ccc',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '12px',
              backgroundColor: COLORS.success,
              color: COLORS.surface,
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ✓ Simpan Produk
          </button>
        </div>
      </div>
    </div>
  );
}

export default BarcodeManagement;
