import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { 
  Camera, 
  X, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search,
  Scan,
  AlertCircle,
  CheckCircle,
  Loader,
  CreditCard,
  Printer,
  History,
  LogOut,
  User,
  Package,
  DollarSign,
  BarChart3,
  Settings,
  Menu,
  ArrowLeft
} from 'lucide-react';

// ============================================
// KOMPONEN UTAMA APP
// ============================================
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listener auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sapphire-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-sapphire-600 animate-spin mx-auto" />
          <p className="mt-4 text-sapphire-600 font-medium">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/" element={isAuthenticated ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/cashier" element={isAuthenticated ? <CashierPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/products" element={isAuthenticated ? <ProductsPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/history" element={isAuthenticated ? <HistoryPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/settings" element={isAuthenticated ? <SettingsPage user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

// ============================================
// HALAMAN LOGIN
// ============================================
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sapphire-50 to-sapphire-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sapphire-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-sapphire-600" />
          </div>
          <h1 className="text-2xl font-bold text-sapphire-900">POS System</h1>
          <p className="text-sapphire-600 mt-2">Masuk ke akun Anda</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sapphire-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-transparent"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sapphire-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sapphire-600 text-white rounded-lg font-medium hover:bg-sapphire-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD
// ============================================
function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    todaySales: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total products
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get today's sales
      const today = new Date().toISOString().split('T')[0];
      const { data: todaySales } = await supabase
        .from('transactions')
        .select('total')
        .gte('created_at', today)
        .lt('created_at', today + 'T23:59:59');

      const todayTotal = todaySales?.reduce((sum, sale) => sum + sale.total, 0) || 0;

      // Get total sales
      const { data: allSales } = await supabase
        .from('transactions')
        .select('total');

      const totalSales = allSales?.reduce((sum, sale) => sum + sale.total, 0) || 0;

      setStats({
        totalProducts: productCount || 0,
        totalSales: totalSales,
        todaySales: todayTotal,
        pendingOrders: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const statsCards = [
    { label: 'Total Produk', value: stats.totalProducts, icon: Package, color: 'blue' },
    { label: 'Total Penjualan', value: `Rp ${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: 'green' },
    { label: 'Penjualan Hari Ini', value: `Rp ${stats.todaySales.toLocaleString()}`, icon: BarChart3, color: 'purple' },
    { label: 'Transaksi', value: stats.pendingOrders, icon: ShoppingCart, color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-sapphire-50">
      {/* Navbar */}
      <nav className="bg-sapphire-800 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6" />
            <h1 className="text-xl font-bold">POS System</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-sapphire-700 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              green: 'bg-green-100 text-green-600',
              purple: 'bg-purple-100 text-purple-600',
              orange: 'bg-orange-100 text-orange-600',
            };

            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-sapphire-600">{stat.label}</span>
                  <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-sapphire-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="/cashier"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className="p-3 bg-sapphire-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-sapphire-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sapphire-900">Kasir</h3>
              <p className="text-sm text-sapphire-600">Mulai transaksi baru</p>
            </div>
          </a>

          <a
            href="/products"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sapphire-900">Produk</h3>
              <p className="text-sm text-sapphire-600">Kelola produk</p>
            </div>
          </a>

          <a
            href="/history"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className="p-3 bg-purple-100 rounded-lg">
              <History className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sapphire-900">Riwayat</h3>
              <p className="text-sm text-sapphire-600">Lihat transaksi</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HALAMAN KASIR (DENGAN SCANNER)
// ============================================
function CashierPage({ user }) {
  const [cart, setCart] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    unit: 'pcs'
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // ============================================
  // FUNGSI SCANNER - DIPERBAIKI
  // ============================================
  const startScanner = async () => {
    try {
      setScannerError(null);
      setIsScanning(true);
      setShowManualInput(false);

      // Cek dukungan browser
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera. Gunakan Chrome atau Firefox terbaru.');
      }

      // Cek izin kamera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        if (permError.name === 'NotAllowedError') {
          throw new Error('Izin kamera ditolak. Silakan berikan izin kamera di pengaturan browser.');
        } else if (permError.name === 'NotFoundError') {
          throw new Error('Kamera tidak ditemukan. Pastikan HP Anda memiliki kamera.');
        } else {
          throw new Error('Gagal mengakses kamera: ' + permError.message);
        }
      }

      // Inisialisasi reader dengan konfigurasi yang lebih stabil
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Konfigurasi untuk kamera belakang dengan fallback
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      // Mulai decode dari kamera
      await codeReader.decodeFromConstraints(constraints, videoRef.current, (result, err) => {
        if (result) {
          // Barcode terdeteksi
          const barcode = result.getText();
          handleBarcodeScanned(barcode);
          
          // Berhenti scan setelah berhasil
          stopScanner();
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error('Scanner error:', err);
          // Jangan set error untuk NotFoundException karena itu normal
        }
      });

    } catch (error) {
      console.error('Scanner init error:', error);
      setScannerError(error.message);
      setIsScanning(false);
      setShowManualInput(true);
      
      // Tampilkan notifikasi error
      showNotification('Gagal membuka kamera: ' + error.message, 'error');
    }
  };

  const stopScanner = () => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.stop();
        codeReaderRef.current = null;
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }
    setIsScanning(false);
  };

  // ============================================
  // HANDLER SCAN BARCODE
  // ============================================
  const handleBarcodeScanned = async (barcode) => {
    if (!barcode) return;

    setLoading(true);
    setScannerError(null);

    try {
      // Cek apakah SKU sudah ada di database
      const { data: existingProduct, error: searchError } = await supabase
        .from('products')
        .select('*')
        .eq('sku', barcode)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (existingProduct) {
        // SKU LAMA: Tambahkan ke keranjang
        addToCart(existingProduct);
        showNotification(`✅ ${existingProduct.name} ditambahkan ke keranjang`, 'success');
        setManualInput('');
        setShowManualInput(false);
      } else {
        // SKU BARU: Buka form tambah produk
        setCurrentProduct(null);
        setNewProduct({
          sku: barcode,
          name: '',
          price: '',
          stock: '',
          unit: 'pcs'
        });
        setShowProductForm(true);
        showNotification('📦 SKU baru terdeteksi. Silakan lengkapi data produk.', 'info');
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      setScannerError('Gagal memproses barcode: ' + error.message);
      showNotification('Error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNGSI MANUAL INPUT
  // ============================================
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      showNotification('Masukkan SKU atau nama produk', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Cari produk berdasarkan SKU atau nama
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`sku.ilike.%${manualInput}%,name.ilike.%${manualInput}%`)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        addToCart(data[0]);
        showNotification(`✅ ${data[0].name} ditambahkan ke keranjang`, 'success');
        setManualInput('');
      } else {
        // Tidak ditemukan, buka form produk baru
        setNewProduct({
          sku: manualInput.toUpperCase(),
          name: '',
          price: '',
          stock: '',
          unit: 'pcs'
        });
        setShowProductForm(true);
        showNotification('📦 Produk tidak ditemukan. Silakan tambahkan produk baru.', 'info');
      }
    } catch (error) {
      console.error('Error searching product:', error);
      showNotification('Error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNGSI KERANJANG
  // ============================================
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, change) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + change;
          if (newQuantity <= 0) return null;
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // ============================================
  // FUNGSI TAMBAH PRODUK BARU
  // ============================================
  const handleAddNewProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          sku: newProduct.sku,
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock) || 0,
          unit: newProduct.unit,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Tambahkan ke keranjang
        addToCart(data);
        setShowProductForm(false);
        setNewProduct({ sku: '', name: '', price: '', stock: '', unit: 'pcs' });
        showNotification(`✅ Produk ${data.name} berhasil ditambahkan`, 'success');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      showNotification('Gagal menambahkan produk: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNGSI TRANSAKSI
  // ============================================
  const handleChec
