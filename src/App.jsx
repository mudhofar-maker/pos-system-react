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
      cashGiven: cashGiven || 0,
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
    <div className="p-4">
      <POSAdvancedInventory />
    </div>
  );
}
