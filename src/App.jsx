function POSApp() {
  const [currentPage, setCurrentPage] = React.useState('kasir');
  const [cart, setCart] = React.useState([]);
  const [history, setHistory] = React.useState(() => {
    return JSON.parse(localStorage.getItem('pos_history')) || [];
  });

  const addItem = (item) => {
    const existingItem = cart.find((i) => i.name === item.name);
    if (existingItem) {
      setCart(cart.map((i) => 
        i.name === item.name 
          ? { ...i, quantity: (i.quantity || 1) + 1 } 
          : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  // Fungsi Kurangi atau Hapus Item dari Keranjang (Saran DeepSeek)
  const removeItem = (index) => {
    const newCart = [...cart];
    if (newCart[index].quantity > 1) {
      newCart[index].quantity -= 1;
    } else {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }

    const totalAmount = calculateTotal();
    const newTransaction = {
      id: 'TRX-' + Date.now(),
      date: new Date().toLocaleString(),
      items: [...cart],
      total: totalAmount
    };

    const updatedHistory = [newTransaction, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('pos_history', JSON.stringify(updatedHistory));

    setCart([]);
    alert("Pembayaran Berhasil!");
    setCurrentPage('history');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {currentPage === 'kasir' ? (
        <div className="p-4 max-w-md mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-bold text-xl">Kasir Utama</h1>
            <button 
              onClick={() => setCurrentPage('history')}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium"
            >
              Lihat History ({history.length})
            </button>
          </div>

          <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="font-semibold mb-2 text-sm text-gray-600">Katalog Produk:</h2>
            <button 
              onClick={() => addItem({ name: 'Laptop Dell XPS 13', price: 12000000 })}
              className="bg-green-600 text-white w-full py-2 rounded mb-2 text-sm font-medium"
            >
              + Laptop Dell XPS 13 (Rp 12 Juta)
            </button>
            <button 
              onClick={() => addItem({ name: 'Mouse Logitech', price: 750000 })}
              className="bg-green-700 text-white w-full py-2 rounded text-sm font-medium"
            >
              + Mouse Logitech (Rp 750 Ribu)
            </button>
          </div>

          {/* Daftar Item di Keranjang dengan Tombol Hapus/Kurang */}
          <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="font-semibold mb-2 text-sm text-gray-600">Keranjang Belanja:</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada item dipilih.</p>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm py-2 border-b">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">x{item.quantity || 1} @ Rp {item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Rp {(item.price * (item.quantity || 1)).toLocaleString()}</span>
                    <button 
                      onClick={() => removeItem(idx)}
                      className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white p-3 rounded shadow mb-4 flex justify-between items-center">
            <span className="font-semibold">Total Belanja:</span>
            <span className="text-blue-600 font-bold text-lg">Rp {calculateTotal().toLocaleString()}</span>
          </div>

          <button 
            onClick={handleCheckout}
            className="bg-indigo-600 text-white w-full py-3 rounded font-bold shadow"
          >
            Bayar Sekarang
          </button>
        </div>
      ) : (
        <div className="p-4 max-w-md mx-auto">
          <button 
            onClick={() => setCurrentPage('kasir')} 
            className="mb-4 bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium flex items-center gap-2 hover:bg-gray-300 text-sm"
          >
            ← Kembali ke Dasbor / Kasir
          </button>

          <h2 className="font-bold text-lg mb-3">Riwayat Pembelian</h2>
          
          {history.length === 0 ? (
            <p className="text-gray-500 bg-white p-4 rounded text-center">Belum ada transaksi tersimpan.</p>
          ) : (
            history.map((trx) => (
              <div key={trx.id} className="border p-3 mb-3 rounded bg-white shadow-sm">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{trx.id}</span>
                  <span>{trx.date}</span>
                </div>
                {trx.items.map((item, idx) => (
                  <p key={idx} className="text-sm">• {item.name} (x{item.quantity || 1}) - Rp {(item.price * (item.quantity || 1)).toLocaleString()}</p>
                ))}
                <p className="text-blue-600 font-bold mt-2">Total: Rp {trx.total.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
  
