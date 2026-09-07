import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { 
  Camera, X, ShoppingCart, Plus, Minus, Trash2, Search,
  AlertCircle, CheckCircle, Loader, CreditCard, Printer,
  History, LogOut, User, Package, DollarSign, BarChart3,
  Settings, ArrowLeft, Crown, Star, Clock, Calendar,
  TrendingUp, FileText, Gift, Shield
} from 'lucide-react';

// ============================================
// CONTEXT
// ============================================
const SubscriptionContext = React.createContext();

function useSubscription() {
  const context = React.useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
}

// ============================================
// APP UTAMA
// ============================================
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState({
    plan: 'freemium',
    expiresAt: null,
    features: { maxProducts: 50, maxTransactions: 100, historyAccess: false, unlimitedStorage: false }
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      if (session?.user) loadSubscription(session.user.id);
      setLoading(false);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      if (session?.user) loadSubscription(session.user.id);
    });

    return () => authSub?.unsubscribe();
  }, []);

  const loadSubscription = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        const features = data.plan === 'premium' 
          ? { maxProducts: Infinity, maxTransactions: Infinity, historyAccess: true, unlimitedStorage: true }
          : { maxProducts: 50, maxTransactions: 100, historyAccess: false, unlimitedStorage: false };
        setSubscription({ plan: data.plan, expiresAt: data.expires_at, features });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const upgradeSubscription = async (plan) => {
    if (!user) return { success: false, error: 'User not logged in' };
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan: plan,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const features = plan === 'premium'
        ? { maxProducts: Infinity, maxTransactions: Infinity, historyAccess: true, unlimitedStorage: true }
        : { maxProducts: 50, maxTransactions: 100, historyAccess: false, unlimitedStorage: false };

      setSubscription({ plan: data.plan, expiresAt: data.expires_at, features });
      return { success: true, data };
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      return { success: false, error: error.message };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sapphire-50">
        <Loader className="w-12 h-12 text-sapphire-600 animate-spin" />
      </div>
    );
  }

  return (
    <SubscriptionContext.Provider value={{ subscription, upgradeSubscription, user }}>
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
    </SubscriptionContext.Provider>
  );
}

// ============================================
// LOGIN PAGE
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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
            <label className="block text-sm font-medium text-sapphire-700 mb-1">Email</label>
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
            <label className="block text-sm font-medium text-sapphire-700 mb-1">Password</label>
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
            {loading ? <><Loader className="w-4 h-4 animate-spin" /> Memproses...</> : 'Masuk'}
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
  const { subscription } = useSubscription();
  const [stats, setStats] = useState({ totalProducts: 0, totalSales: 0, todaySales: 0, totalTransactions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
        const today = new Date().toISOString().split('T')[0];
        const { data: todaySales } = await supabase.from('transactions').select('total_amount').gte('created_at', today).lt('created_at', today + 'T23:59:59');
        const { data: allSales } = await supabase.from('transactions').select('total_amount');
        const { count: transactionCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });

        setStats({
          totalProducts: productCount || 0,
          totalSales: allSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0,
          todaySales: todaySales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0,
          totalTransactions: transactionCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = async () => await supabase.auth.signOut();

  const statsCards = [
    { label: 'Total Produk', value: stats.totalProducts, icon: Package, color: 'blue' },
    { label: 'Total Penjualan', value: `Rp ${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: 'green' },
    { label: 'Penjualan Hari Ini', value: `Rp ${stats.todaySales.toLocaleString()}`, icon: BarChart3, color: 'purple' },
    { label: 'Total Transaksi', value: stats.totalTransactions, icon: ShoppingCart, color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-sapphire-50">
      <nav className="bg-sapphire-800 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6" />
            <h1 className="text-xl font-bold">POS System</h1>
            {subscription.plan === 'premium' && (
              <span className="bg-yellow-400 text-sapphire-900 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <Crown className="w-3 h-3" /> Premium
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80">{user?.email}</span>
            <button onClick={handleLogout} className="p-2 hover:bg-sapphire-700 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600', orange: 'bg-orange-100 text-orange-600' };
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <a href="/cashier" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-sapphire-100 rounded-lg"><ShoppingCart className="w-6 h-6 text-sapphire-600" /></div>
            <div><h3 className="font-semibold text-sapphire-900">Kasir</h3><p className="text-sm text-sapphire-600">Mulai transaksi baru</p></div>
          </a>
          <a href="/products" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg"><Package className="w-6 h-6 text-green-600" /></div>
            <div><h3 className="font-semibold text-sapphire-900">Produk</h3><p className="text-sm text-sapphire-600">Kelola produk</p></div>
          </a>
          <a href="/history" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg"><History className="w-6 h-6 text-purple-600" /></div>
            <div><h3 className="font-semibold text-sapphire-900">Riwayat</h3><p className="text-sm text-sapphire-600">Lihat transaksi</p></div>
          </a>
          <a href="/settings" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg"><Settings className="w-6 h-6 text-orange-600" /></div>
            <div><h3 className="font-semibold text-sapphire-900">Pengaturan</h3><p className="text-sm text-sapphire-600">Atur aplikasi</p></div>
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CASHIER PAGE (DENGAN SCANNER)
// ============================================
function CashierPage({ user }) {
  const { subscription } = useSubscription();
  const [cart, setCart] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', price: '', stock: '', unit: 'pcs' });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  const startScanner = async () => {
    try {
      setScannerError(null);
      setIsScanning(true);
      setShowManualInput(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera');
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch (permError) {
        if (permError.name === 'NotAllowedError') throw new Error('Izin kamera ditolak');
        if (permError.name === 'NotFoundError') throw new Error('Kamera tidak ditemukan');
        throw new Error('Gagal mengakses kamera: ' + permError.message);
      } finally {
        if (stream) stream.getTracks().forEach(track => track.stop());
      }

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      await codeReader.decodeFromConstraints(
        { video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } },
        videoRef.current,
        (result, err) => {
          if (result) {
            handleBarcodeScanned(result.getText());
            stopScanner();
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error('Scanner error:', err);
          }
        }
      );
    } catch (error) {
      console.error('Scanner init error:', error);
      setScannerError(error.message);
      setIsScanning(false);
      setShowManualInput(true);
      showNotification('Gagal membuka kamera: ' + error.message, 'error');
    }
  };

  const stopScanner = () => {
    if (codeReaderRef.current) {
      try { codeReaderRef.current.stop(); } catch (e) { console.error('Error stopping scanner:', e); }
      codeReaderRef.current = null;
    }
    setIsScanning(false);
  };

  const handleBarcodeScanned = async (barcode) => {
    if (!barcode) return;
    setLoading(true);
    setScannerError(null);

    try {
      const { data: existingProduct, error: searchError } = await supabase
        .from('products')
        .select('*')
        .eq('sku', barcode)
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') throw searchError;

      if (existingProduct) {
        addToCart(existingProduct);
        showNotification(`✅ ${existingProduct.name} ditambahkan ke keranjang`, 'success');
        setManualInput('');
        setShowManualInput(false);
      } else {
        if (subscription.plan === 'freemium') {
          const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
          if (count >= 50) {
            showNotification('⚠️ Batas produk freemium (50) tercapai. Upgrade ke Premium.', 'warning');
            setLoading(false);
            return;
          }
        }
        setNewProduct({ sku: barcode, name: '', price: '', stock: '', unit: 'pcs' });
        setShowProductForm(true);
        showNotification('📦 SKU baru. Lengkapi data produk.', 'info');
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      setScannerError('Gagal memproses barcode: ' + error.message);
      showNotification('Error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      showNotification('Masukkan SKU atau nama produk', 'warning');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`sku.ilike.%${manualInput}%,name.ilike.%${manualInput}%`)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        addToCart(data[0]);
        showNotification(`✅ ${data[0].name} ditambahkan`, 'success');
        setManualInput('');
      } else {
        if (subscription.plan === 'freemium') {
          const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
          if (count >= 50) {
            showNotification('⚠️ Batas produk freemium (50) tercapai.', 'warning');
            setLoading(false);
            return;
          }
        }
        setNewProduct({ sku: manualInput.toUpperCase(), name: '', price: '', stock: '', unit: 'pcs' });
        setShowProductForm(true);
        showNotification('📦 Produk tidak ditemukan. Tambahkan baru.', 'info');
      }
    } catch (error) {
      console.error('Error searching product:', error);
      showNotification('Error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
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
          const newQty = item.quantity + change;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const getTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showNotification('Keranjang kosong!', 'warning');
      return;
    }
    if (subscription.plan === 'freemium') {
      const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
      if (count >= 100) {
        showNotification('⚠️ Batas transaksi freemium (100) tercapai. Upgrade ke Premium.', 'warning');
        return;
      }
    }
    setShowPaymentModal(true);
    setCashAmount('');
  };

  const processPayment = async () => {
    if (!cashAmount || parseFloat(cashAmount) < getTotal()) {
      showNotification('Uang tidak mencukupi!', 'error');
      return;
    }
    setLoading(true);
    try {
      const total = getTotal();
      const cash = parseFloat(cashAmount);
      const change = cash - total;

      const cartItems = cart.map(item => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        subtotal: item.price * item.quantity
      }));

      const { data: transaction, error: transError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          total_amount: total,
          cash_amount: cash,
          change_amount: change,
          items: cartItems,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (transError) throw transError;

      for (const item of cart) {
        await supabase.from('products').update({ stock: item.stock - item.quantity }).eq('id', item.id);
      }

      setCart([]);
      setShowPaymentModal(false);
      showNotification(`✅ Transaksi berhasil! Total: Rp ${total.toLocaleString()}`, 'success');
    } catch (error) {
      console.error('Error processing transaction:', error);
      showNotification('Gagal memproses transaksi: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        try { codeReaderRef.current.stop(); } catch (e) { console.error('Error cleaning up scanner:', e); }
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-sapphire-50">
      <div className="bg-sapphire-800 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></a>
            <ShoppingCart className="w-6 h-6" />
            <h1 className="text-xl font-bold">Kasir</h1>
            {subscription.plan === 'premium' ? (
              <span className="bg-yellow-400 text-sapphire-900 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"><Crown className="w-3 h-3" /> Premium</span>
            ) : (
              <span className="bg-blue-400 text-white text-xs px-2 py-1 rounded-full font-medium">Freemium</span>
            )}
          </div>
          <span className="text-sm opacity-80">{user?.email}</span>
        </div>
      </div>

      {notification && (
        <div className={`fixed top-20 right-4 z-50 max-w-sm w-full p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' :
          notification.type === 'error' ? 'bg-red-50 border border-red-200' :
          notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
            {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />}
            {notification.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
            <span className="text-sm flex-1">{notification.message}</span>
            <button onClick={() => setNotification(null)}><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-sapphire-100">
                <h2 className="font-semibold text-sapphire-900">Scan Barcode</h2>
                <p className="text-sm text-sapphire-600">Arahkan ke barcode produk</p>
              </div>
              <div className="p-4">
                <div className="relative bg-sapphire-900 rounded-lg overflow-hidden aspect-video">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3/4 h-1/2 border-2 border-white rounded-lg opacity-50">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-8 h-8 border-4 border-sapphire-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  {!isScanning && !scannerError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <Camera className="w-12 h-12 opacity-50 mb-2" />
                      <p className="text-sm opacity-70">Tekan Scan untuk memulai</p>
                    </div>
                  )}
                  {scannerError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 bg-black/50">
                      <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
                      <p className="text-sm text-center">{scannerError}</p>
                      <button onClick={() => setShowManualInput(true)} className="mt-3 px-4 py-2 bg-white text-sapphire-900 rounded-lg text-sm font-medium">
                        Input Manual
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  {!isScanning ? (
                    <button onClick={startScanner} className="flex-1 px-4 py-2 bg-sapphire-600 text-white rounded-lg font-medium hover:bg-sapphire-700 flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4" /> Scan
                    </button>
                  ) : (
                    <button onClick={stopScanner} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2">
                      <X className="w-4 h-4" /> Stop
                    </button>
                  )}
                  <button onClick={() => setShowManualInput(!showManualInput)} className="px-4 py-2 border border-sapphire-300 text-sapphire-700 rounded-lg hover:bg-sapphire-50">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
                {showManualInput && (
                  <form onSubmit={handleManualSubmit} className="mt-3">
                    <div className="flex gap-2">
                      <input type="text" value={manualInput} onChange={(e) => setManualInput(e.target.value)} placeholder="SKU atau nama produk" className="flex-1 px-3 py-2 border border-sapphire-200 rounded-lg text-sm" disabled={loading} />
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-sapphire-600 text-white rounded-lg font-medium hover:bg-sapphire-700 disabled:opacity-50">
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Cari'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {showProductForm && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-sapphire-100 flex items-center justify-between">
                  <h2 className="font-semibold text-sapphire-900">Produk Baru</h2>
                  <button onClick={() => setShowProductForm(false)} className="p-1 hover:bg-sapphire-100 rounded-lg">
                    <X className="w-5 h-5 text-sapphire-600" />
                  </button>
                </div>
                <form onSubmit={handleAddNewProduct} className="p-4 space-y-3">
                  <div><label className="block text-sm font-medium text-sapphire-700 mb-1">SKU</label>
                    <input type="text" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-sapphire-200 rounded-lg" required readOnly={!!newProduct.sku} /></div>
                  <div><label className="block text-sm font-medium text-sapphire-700 mb-1">Nama Produk</label>
                    <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full px-3 py-2 border border-sapphire-200 rounded-lg" required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-sapphire-700 mb-1">Harga</label>
                      <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full px-3 py-2 border border-sapphire-200 rounded-lg" required min="0" step="100" /></div>
                    <div><label className="block text-sm font-medium text-sapphire-700 mb-1">Stok</label>
                      <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} className="w-full px-3 py-2 border border-sapphire-200 rounded-lg" required min="0" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-sapphire-700 mb-1">Satuan</label>
                    <select value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })} className="w-full px-3 py-2 border border-sapphire-200 rounded-lg">
                      <option value="pcs">Pcs</option><option value="kg">Kg</option><option value="gram">Gram</option>
                      <option value="liter">Liter</option><option value="meter">Meter</option><option value="box">Box</option>
                    </select></div>
                  <button type="submit" disabled={loading} className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Loader className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Plus className="w-4 h-4" /> Tambah Produk</>}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-24">
              <div className="p-4 border-b border-sapphire-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-sapphire-600" />
                  <h2 className="font-semibold text-sapphire-900">Keranjang</h2>
                  <span className="bg-sapphire-100 text-sapphire-700 text-xs px-2 py-1 rounded-full">{cart.length} item</span>
                </div>
                {cart.length > 0 && <button onClick={() => setCart([])} className="text-sm text-red-600 hover:text-red-700">Kosongkan</button>}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="p-8 text-center">
                    <ShoppingCart className="w-12 h-12 text-sapphire-300 mx-auto mb-3" />
                    <p className="text-sapphire-600">Keranjang kosong</p>
                  </div>
                ) : (
                  <div className="divide-y divide-sapphire-50">
                    {cart.map((item) => (
                      <div key={item.id} className="p-4 hover:bg-sapphire-50">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-sapphire-900 truncate">{item.name}</p>
                            <p className="text-sm text-sapphire-600">SKU: {item.sku}</p>
                            <p className="text-sm font-semibold text-sapphire-900 mt-1">Rp {item.price.toLocaleString()} / {item.unit}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg border border-sapphire-200 flex items-center justify-center hover:bg-sapphire-100" disabled={item.quantity <= 1}><Minus className="w-4 h-4" /></button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg border border-sapphire-200 flex items-center justify-center hover:bg-sapphire-100"><Plus className="w-4 h-4" /></button>
                            <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-lg border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 ml-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-sapphire-600">Subtotal: Rp {(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="p-4 border-t border-sapphire-100 bg-sapphire-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sapphire-700 font-medium">Total</span>
                    <span className="text-2xl font-bold text-sapphire-900">Rp {getTotal().toLocaleString()}</span>
                  </div>
                  <button onClick={handleCheckout} disabled={loading} className="w-full py-3 bg-sapphire-600 text-white rounded-lg font-medium hover:bg-sapphire-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Bayar</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-sapphire-900">Pembayaran</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-sapphire-100 rounded-lg"><X className="w-5 h-5 text-sapphire-600" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-sapphire-50 p-4 rounded-lg">
                <p className="text-sm text-sapphire-600">Total Belanja</p>
                <p className="text-2xl font-bold text-sapphire-900">Rp {getTotal().toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-sapphire-700 mb-1">Uang Tunai</label>
                <input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} className="w-full px-3 py-2 border border-sapphire-200 rounded-lg" placeholder="Masukkan jumlah uang" min={getTotal()} required />
              </div>
              {cashAmount && parseFloat(cashAmount) >= getTotal() && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Kembalian</p>
                  <p className="text-xl font-bold text-green-700">Rp {(parseFloat(cashAmount) - getTotal()).toLocaleString()}</p>
                </div>
              )}
              <button onClick={processPayment} disabled={loading || !cashAmount || parseFloat(cashAmount) < getTotal()} className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Proses Pembayaran</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PRODUCTS PAGE
// ============================================
function ProductsPage({ user }) {
  const { subscription } = useSubscription();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ sku: '', name: '', price: '', stock: '', unit: 'pcs' });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        showNotification('Gagal memuat produk', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (subscription.plan === 'freemium' && !editingProduct) {
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
        if (count >= 50) {
          showNotification('⚠️ Batas produk freemium (50) tercapai. Upgrade ke Premium.', 'warning');
          setLoading(false);
          return;
        }
      }
      const productData = {
        sku: formData.sku,
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        unit: formData.unit
      };
      let result;
      if (editingProduct) {
        result = await supabase.from('products').update(productData).eq('id', editingProduct.id).select().single();
      } else {
        result = await supabase.from('products').insert([{ ...productData, created_by: user.id }]).select().single();
      }
      if (result.error) throw result.error;
      showNotification(editingProduct ? 'Produk diperbarui' : 'Produk ditambahkan', 'success');
      setShowAddForm(false);
      setEditingProduct(null);
      setFormData({ sku: '', name: '', price: '', stock: '', unit: 'pcs' });
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      setProducts(data || []);
    } catch (error) {
      console.error('Error saving product:', error);
      showNotification('Gagal menyimpan produk: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      showNotification('Produk dihapus', 'success');
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      setProducts(data || []);
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('Gagal menghapus produk', 'error');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({ sku: product.sku, name: product.name, price: product.price.toString(), stock: product.stock.toString(), unit: product.unit });
    setShowAddForm(true);
  };

  const filteredProducts = products.filter(p => p.sku?.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-sapphire-50">
      <div className="bg-sapphire-800 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></a>
            <Package className="w-6 h-6" />
            <h1 className="text-xl font-bold">Manajemen Produk</h1>
            {subscription.plan === 'freemium' && <span className="bg-blue-400 text-white text-xs px-2 py-1 rounded-full">{products.length}/50</span>}
          </div>
          <span className="text-sm opacity-80">{user?.email}</span>
        </div>
      </div>
      {notification && (
        <div className={`fixed top-20 right-4 z-50 max-w-sm w-full p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' :
          notification.type === 'error' ? 'bg-red-50 border border-red-200' :
          notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
            <span className="text-sm flex-1">{notification.message}</span>
            <button onClick={() => setNotification(null)}><X className="w-4 h-4 opacity-50" /></button>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sapphire-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk..." className="w-full pl-10 pr-4 py-2 border border-sapphire-200 rounded-lg" />
          </div>
          <button onClick={() => {
            if (subscription.plan === 'freemium' && products.length >= 50) {
              showNotification('⚠️ Batas produk freemium (50) tercapai. Upgrade ke Premium.', 'warning');
              return;
            }
            setEditingProduct(null);
            setFormData({ sku: '', name: '', price: '', stock: '', unit: 'pcs' });
            setShowAddForm(true);
          }} className="px-4 py-2 bg-sapphire-600 text-white rounded-lg font-medium hover:bg-sapphire-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
        </div>
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-sapphire-900">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h2>
                <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-sapphire-100 rounded-lg"><X className="w-5 h-5 text-sapphire-600" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium text-sapphire-700 mb-1">SKU</label>
                  <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-sapphire-200 rounded-lg" required disabled={!!editingProduct} /></div>
                <div><label className="block text-sm font-medium text-sapphire-700 mb-1">Nama Produk</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-sapphire-200 rounded-lg" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-sapphire-700 mb-1">Harga</label>
                    <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2 border border-sapphire-200 rounded-lg" required min="0" step="100" /></div>
                  <div><label className="block text-sm font-medium text-sapphire-700 mb-1">Stok</label>
                    <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full px-3 py-2 border border-sapphire-200 rounded-lg" required min="0" /></div>
                </div>
                <div><label className="block text-sm font-medium text-sapphire-700 mb-1">Satuan</label>
                  <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-3 py-2 border border-sapphire-200 rounded-lg">
                    <option value="pcs">Pcs</option><option value="kg">Kg</option><option value="gram">Gram</option>
                    <option value="liter">Liter</option><option value="meter">Meter</option><option value="box">Box</option>
                  </select></div>
                <button type="submit" disabled={loading} className="w-full py-2 bg-sapphire-600 text-white rounded-lg font-medium hover:bg-sapphire-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader className="w-4 h-4 animate-spin" /> Menyimpan...</> : editingProduct ? 'Update Produk' : 'Tambah Produk'}
                </button>
              </form>
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading && !showAddForm ? (
            <div className="p-8 text-center"><Loader className="w-8 h-8 animate-spin text-sapphire-600 mx-auto" /><p className="mt-2 text-sapphire-600">Memuat produk...</p></div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center"><Package className="w-12 h-12 text-sapphire-300 mx-auto mb-3" /><p className="text-sapphire-600">Tidak ada produk</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sapphire-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sapphire-600 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sapphire-600 uppercase">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sapphire-600 uppercase">Harga</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sapphire-600 uppercase">Stok</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sapphire-600 uppercase">Satuan</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-sapphire-600 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sapphire-50">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-sapphire-50">
                      <td className="px-4 py-3 text-sm font-medium text-sapphire-900">{product.sku}</td>
                      <td className="px-4 py-3 text-sm text-sapphire-700">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-sapphire-700">Rp {product.price?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{product.stock || 0}</span></td>
                      <td className="px-4 py-3 text-sm text-sapphire-700">{product.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(product)} className="p-1 text-sapphire-600 hover:bg-sapphire-100 rounded-lg"><Settings className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(product.id)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// HISTORY PAGE
// ============================================
function HistoryPage({ user }) {
  const { subscription } = useSubscription();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ totalTransactions: 0, totalRevenue: 0, averageTransaction: 0 });

  useEffect(() => {
    if (subscription.plan === 'premium' || subscription.features.historyAccess) {
      fetchTransactions();
      setupRealtimeSubscription();
    }
  }, [subscription.plan]);

  const fetchTransactions = async () => {
    try {
      let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (subscription.plan === 'freemium') query = query.limit(100);
      const { data, error } = await query;
      if (error) throw error;
      const txData = data || [];
      setTransactions(txData);
      const totalRevenue = txData.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      setStats({
        totalTransactions: txData.length,
        totalRevenue: totalRevenue,
        averageTransaction: txData.length > 0 ? totalRevenue / txData.length : 0
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const sub = supabase
      .channel('transactions_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        setTransactions(prev => [payload.new, ...prev]);
        setStats(prev => ({
          totalTransactions: prev.totalTransactions + 1,
          totalRevenue: prev.totalRevenue + (payload.new.total_amount || 0),
          averageTransaction: (prev.totalRevenue + (payload.new.total_amount || 0)) / (prev.totalTransactions + 1)
        }));
      })
      .subscribe();
    return () => sub.unsubscribe();
  };

  const getFilteredTransactions = () => {
    if (filter === 'all') return transactions;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return transactions.filter(t => {
      const date = new Date(t.created_at);
      if (filter === 'today') return date >= today;
      if (filter === 'week') { const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7); return date >= weekAgo; }
      if (filter === 'month') { const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1); return date >= monthAgo; }
      return true;
    });
  };

  const filtered = getFilteredTransactions();

  if (subscription.plan === 'freemium' && !subscription.features.historyAccess) {
    return (
      <div className="min-h-screen bg-sapphire-50">
        <div className="bg-sapphire-800 text-white p-4 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></a>
              <History className="w-6 h-6" /><h1 className="text-xl font-bold">Riwayat</h1>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-yellow-100 rounded-full mb-4"><Crown className="w-12 h-12 text-yellow-600" /></div>
              <h2 className="text-2xl font-bold text-sapphire-900 mb-2">Fitur Premium</h2>
              <p className="text-sapphire-600 max-w-md mb-6">Riwayat transaksi hanya untuk Premium.</p>
              <a href="/settings" className="px-6 py-3 bg-yellow-500 text-sapphire-900 rounded-lg font-medium hover:bg-yellow-600 flex items-center gap-2"><Star className="w-4 h-4" /> Upgrade</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sapphire-50">
      <div className="bg-sapphire-800 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></a>
            <History className="w-6 h-6" /><h1 className="text-xl font-bold">Riwayat Transaksi</h1>
            {subscription.plan === 'premium' && <span className="bg-yellow-400 text-sapphire-900 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"><Crown className="w-3 h-3" /> Premium</span>}
          </div>
          <span className="text-sm opacity-80">{user?.email}</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><FileText className="w-5 h-5 text-blue-600" /></div><div><p className="text-sm text-sapphire-600">Total</p><p className="text-xl font-bold text-sapphire-900">{stats.totalTransactions}</p></div></div></div>
          <div className="bg-white rounded-xl p-4 shadow-sm"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><DollarSign className="w-5 h-5 text-green-600" /></div><div><p className="text-sm text-sapphire-600">Pendapatan</p><p className="text-xl font-bold text-sapphire-900">Rp {stats.totalRevenue.toLocaleString()}</p></div></div></div>
          <div className="bg-white rounded-xl p-4 shadow-sm"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-600" /></div><div><p className="text-sm text-sapphire-600">Rata-rata</p><p className="text-xl font-bold text-sapphire-900">Rp {stats.averageTransaction.toLocaleString()}</p></div></div></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all','today','week','month'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-sapphire-600 text-white' : 'bg-sapphire-50 text-sapphire-700 hover:bg-sapphire-100'}`}>
                {f === 'all' ? 'Semua' : f === 'today' ? 'Hari Ini' : f === 'week' ? 'Minggu Ini' : 'Bulan Ini'}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader className="w-8 h-8 animate-spin text-sapphire-600 mx-auto" /><p className="mt-2 text-sapphire-600">Memuat...</p></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center"><History className="w-12 h-12 text-sapphire-300 mx-auto mb-3" /><p className="text-sapphire-600">Tidak ada transaksi</p></div>
          ) : (
            <div className="divide-y divide-sapphire-50">
              {filtered.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-sapphire-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-3"><p className="font-medium text-sapphire-900">#{tx.id?.slice(0,8)}</p><span className="text-xs bg-sapphire-100 text-sapphire-700 px-2 py-1 rounded-full">{tx.items?.length || 0} item</span></div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-sapphire-600">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(tx.created_at).toLocaleDateString('id-ID')}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(tx.created_at).toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-sapphire-900">Rp {tx.total_amount?.toLocaleString() || 0}</p>
                      {tx.cash_amount && <p className="text-xs text-sapphire-500">Tunai: Rp {tx.cash_amount.toLocaleString()} {tx.change_amount > 0 && `| Kembali: Rp ${tx.change_amount.toLocaleString()}`}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {subscription.plan === 'freemium' && transactions.length >= 100 && (
            <div className="p-4 bg-yellow-50 border-t border-yellow-200 text-center">
              <p className="text-sm text-yellow-700">⚠️ Batas 100 transaksi Freemium. <a href="/settings" className="underline font-medium">Upgrade ke Premium</a></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SETTINGS PAGE
// ============================================
function SettingsPage({ user }) {
  const { subscription, upgradeSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUpgrade = async (plan) => {
    setLoading(true);
    try {
      const result = await upgradeSubscription(plan);
      if (result.success) {
        showNotification(`✅ Berhasil upgrade ke ${plan === 'premium' ? 'Premium' : 'Freemium'}!`, 'success');
      } else {
        showNotification('Gagal upgrade: ' + (result.error || 'Terjadi kesalahan'), 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sapphire-50">
      <div className="bg-sapphire-800 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></a>
            <Settings className="w-6 h-6" /><h1 className="text-xl font-bold">Pengaturan</h1>
          </div>
          <span className="text-sm opacity-80">{user?.email}</span>
        </div>
      </div>
      {notification && (
        <div className={`fixed top-20 right-4 z-50 max-w-sm w-full p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-3">
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
            <span className="text-sm flex-1">{notification.message}</span>
            <button onClick={() => setNotification(null)}><X className="w-4 h-4 opacity-50" /></button>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6"><div className="p-3 bg-sapphire-100 rounded-full"><User className="w-8 h-8 text-sapphire-600" /></div><div><h2 className="text-lg font-bold text-sapphire-900">Akun</h2><p className="text-sm text-sapphire-600">{user?.email}</p></div></div>
          <div className="border-t border-sapphire-100 pt-6 space-y-4">
            <div className="flex items-center justify-between py-2"><span className="text-sapphire-700">Status</span><span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${subscription.plan === 'premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{subscription.plan === 'premium' ? <><Crown className="w-3 h-3" /> Premium</> : 'Freemium'}</span></div>
            {subscription.expiresAt && <div className="flex items-center justify-between py-2"><span className="text-sapphire-700">Berlaku</span><span className="text-sapphire-900">{new Date(subscription.expiresAt).toLocaleDateString('id-ID')}</span></div>}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-sapphire-900 mb-6 flex items-center gap-2"><Gift className="w-5 h-5 text-sapphire-600" /> Pilih Paket</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`border-2 rounded-xl p-6 ${subscription.plan === 'freemium' ? 'border-sapphire-500 bg-sapphire-50' : 'border-sapphire-200'}`}>
              <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold text-sapphire-900">Freemium</h3>{subscription.plan === 'freemium' && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Aktif</span>}</div>
              <p className="text-3xl font-bold text-sapphire-900 mb-2">Rp 250.000</p><p className="text-sm text-sapphire-600 mb-4">/ bulan</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-sapphire-700"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Maksimal 50 produk</li>
                <li className="flex items-start gap-2 text-sm text-sapphire-700"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Maksimal 100 transaksi</li>
                <li className="flex items-start gap-2 text-sm text-sapphire-700"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Fungsi dasar POS</li>
                <li className="flex items-start gap-2 text-sm text-sapphire-400"><X className="w-4 h-4 text-sapphire-300 flex-shrink-0 mt-0.5" />Riwayat terbatas</li>
              </ul>
              {subscription.plan !== 'freemium' && <button onClick={() => handleUpgrade('freemium')} disabled={loading} className="w-full py-2 border-2 border-sapphire-600 text-sapphire-600 rounded-lg font-medium hover:bg-sapphire-50 disabled:opacity-50">{loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Pilih Freemium'}</button>}
            </div>
            <div className={`border-2 rounded-xl p-6 relative ${subscription.plan === 'premium' ? 'border-yellow-500 bg-yellow-50' : 'border-yellow-300'}`}>
              {subscription.plan === 'premium' && <div className="absolute -top-3 right-4 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1"><Crown className="w-3 h-3" /> Premium</div>}
              <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold text-yellow-800">Premium</h3>{subscription.plan === 'premium' && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Aktif</span>}</div>
              <p className="text-3xl font-bold text-yellow-800 mb-2">Rp 500.000</p><p className="text-sm text-sapphire-600 mb-4">/ bulan</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-sapphire-700"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Produk tidak terbatas</li>
                <li className="flex items-start gap-2 text-sm text-sapphire-700"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Transaksi tidak terbatas</li>
                <li className="flex items-start gap-2 text-sm text-sapphire-700"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Semua fungsi POS</li>
                <li className="flex items-start gap-2 text-sm text-sapphire-700"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Riwayat lengkap real-time</li>
              </ul>
              {subscription.plan !== 'premium' && <button onClick={() => handleUpgrade('premium')} disabled={loading} className="w-full py-2 bg-yellow-500 text-sapphire-900 rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <Loader className="w-4 h-4 animate-spin" /> : <><Star className="w-4 h-4" /> Upgrade</>}</button>}
            </div>
          </div>
          <div className="mt-8 p-4 bg-sapphire-50 rounded-lg">
            <h4 className="font-medium text-sapphire-900 mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Perbandingan</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="font-medium text-sapphire-700">Fitur</div><div className="font-medium text-sapphire-700 text-center">Freemium</div><div className="font-medium text-sapphire-700 text-center">Premium</div>
              <div className="text-sapphire-600">Produk</div><div className="text-center text-sapphire-600">50</div><div className="text-center text-yellow-600 font-medium">∞</div>
              <div className="text-sapphire-600">Transaksi</div><div className="text-center text-sapphire-600">100</div><div className="text-center text-yellow-600 font-medium">∞</div>
              <div className="text-sapphire-600">Riwayat</div><div className="text-center text-sapphire-600">Terbatas</div><div className="text-center text-yellow-600 font-medium">Lengkap</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <button onClick={async () => await supabase.auth.signOut()} className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </div>
    </div>
  );
}

export default App;