import React, { useState, useEffect, useRef, useMemo } from 'react';

function POSAdvancedInventory() {
  
  // (Pastikan di database backend Anda, kolom barcode, sku, dan name sudah di-indexing)
  const [allProducts, setAllProducts] = useState([
    { id: 1, barcode: '8991001234567', sku: 'LAP-001', name: 'Laptop Dell Inspiron 13', price: 12000000, stock: 5 },
    { id: 2, barcode: '8991007654321', sku: 'MSE-002', name: 'Mouse Logitech MX Master', price: 1250000, stock: 10 },
    { id: 3, barcode: '8991001112223', sku: 'KEY-003', name: 'Keyboard Mechanical RGB', price: 850000, stock: 15 },
    // ... bayangkan ada ribuan data di sini
  ]);

  const [cart, setCart] = useState([]);
  const [scanInput, setScanInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // State untuk Paginasi Katalog
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Atur jumlah item per halaman agar DOM tidak berat

  const inputRef = useRef(null);

  // Auto-focus ke input barcode saat halaman dimuat
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // ==========================================
  // 3. STRATEGI DEBOUNCE PADA PENCARIAN MANUAL
  // ==========================================
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset ke halaman 1 setiap kali kata kunci berubah
    }, 300); // Tunda pencarian selama 300ms setelah user berhenti mengetik

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // ==========================================
  // 2. STRATEGI PENCARIAN CEPAT VIA BARCODE
  // ==========================================
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = scanInput.trim();
      
      // Pencarian instan berdasarkan barcode (di backend ini menggunakan index SQL)
      const itemFound = allProducts.find((item) => item.barcode === code || item.sku === code);

      if (itemFound) {
        addToCart(itemFound);
      } else {
        alert(`Barang dengan barcode/SKU "${code}" tidak ditemukan!`);
      }
      setScanInput('');
    }
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].qty += 1;
        return updated;
      } else {
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  // ==========================================
  // 1 & 4. FILTERING DATA & PAGINASI (Mencegah Lag pada Ribuan Data)
  // ==========================================
  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) return allProducts;
    const keyword = debouncedSearch.toLowerCase();
    return allProducts.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.sku.toLowerCase().includes(keyword) ||
        item.barcode.includes(keyword)
    );
  }, [debouncedSearch, allProducts]);

  // Logika Paginasi Data Katalog
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Sistem POS - Manajemen Ribuan Barang & Barcode</h2>

      {/* Input Khusus Barcode Scanner */}
      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold' }}>Scan Barcode / Ketik SKU: </label>
        <input
          ref={inputRef}
          type="text"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Arahkan scanner ke sini lalu Enter..."
          style={{ padding: '8px', width: '300px', marginLeft: '10px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* SISI KIRI: Katalog Barang dengan Paginasi & Debounce Search */}
        <div style={{ flex: 2 }}>
          <h3>Katalog Barang ({filteredProducts.length} Ditemukan)</h3>
          
          {/* Input Pencarian Manual dengan Debounce */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama barang atau SKU manual..."
            style={{ padding: '8px', width: '100%', marginBottom: '15px' }}
          />

          {/* Daftar Katalog yang Tampil Terbatas per Halaman */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {paginatedProducts.map((prod) => (
              <div 
                key={prod.id} 
                onClick={() => addToCart(prod)}
                style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', cursor: 'pointer', background: '#fff' }}
              >
                <div style={{ fontWeight: 'bold' }}>{prod.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>SKU: {prod.sku}</div>
                <div style={{ color: 'green', marginTop: '5px' }}>Rp {prod.price.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Navigasi Paginasi */}
          <div style={{ marginTop: '15px', display: 'flex', gap: '5px', alignItems: 'center' }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Sebelumnya
            </button>
            <span> Halaman {currentPage} dari {totalPages || 1} </span>
            <button 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Selanjutnya
            </button>
          </div>
        </div>

        {/* SISI KANAN: Keranjang Belanja */}
        <div style={{ flex: 1, background: '#fafafa', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Keranjang Belanja</h3>
          {cart.length === 0 ? (
            <p style={{ color: '#777' }}>Belum ada item</p>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ fontSize: '12px' }}>{item.qty}x @ Rp {item.price.toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default POSAdvancedInventory;
     
