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
  ArrowLeft,
  Crown,
  Star,
  Zap,
  Clock,
  Calendar,
  TrendingUp,
  FileText,
  Gift,
  Shield
} from 'lucide-react';

// ============================================
// CONTEXT UNTUK SUBSCRIPTION
// ============================================
const SubscriptionContext = React.createContext();

function useSubscription() {
  const context = React.useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}

// ============================================
// KOMPONEN UTAMA APP
// ============================================
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState({
    plan: 'freemium', // 'freemium' or 'premium'
    expiresAt: null,
    features: {
      maxProducts: 50,
      maxTransactions: 100,
      historyAccess: false,
      unlimitedStorage: false
    }
  });

  useEffect(() => {
    // Cek session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      
      if (session?.user) {
        loadSubscription(session.user.id);
      }
      
      setLoading(false);
    });

    // Listener auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      
      if (session?.user) {
        loadSubscription(session.user.id);
      }
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const loadSubscription = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const features = data.plan === 'premium' 
          ? {
              maxProducts: Infinity,
              maxTransactions: Infinity,
              historyAccess: true,
              unlimitedStorage: true
            }
          : {
              maxProducts: 50,
              maxTransactions: 100,
              historyAccess: false,
              unlimitedStorage: false
            };

        setSubscription({
          plan: data.plan,
          expiresAt: data.expires_at,
          features
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const upgradeSubscription = async (plan) => {
    if (!user) return;

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
        ? {
            maxProducts: Infinity,
            maxTransactions: Infinity,
            historyAccess: true,
            unlimitedStorage: true
          }
        : {
            maxProducts: 50,
            maxTransactions: 100,
            historyAccess: false,
            unlimitedStorage: false
          };

      setSubscription({
        plan: data.plan,
        expiresAt: data.expires_at,
        features
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      return { success: false, error: error.message };
    }
  };

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
  const { subscription } = useSubscription();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    todaySales: 0,
    totalTransactions: 0
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
        .select('total_amount')
        .gte('created_at', today)
        .lt('created_at', today + 'T23:59:59');

      const todayTotal = todaySales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

      // Get total sales
      const { data: allSales } = await supabase
        .from('transactions')
        .select('total_amount');

      const totalSales = allSales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

      // Get total transactions
      const { count: transactionCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalProducts: productCount || 0,
        totalSales: totalSales,
        todaySales: todayTotal,
        totalTransactions: transactionCount || 0
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
    { label: 'Total Transaksi', value: stats.totalTransactions, icon: ShoppingCart, color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-sapphire-50">
      {/* Navbar */}
      <nav className="bg-sapphire-800 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6" />
            <h1 className="text-xl font-bold">POS System</h1>
            {subscription.plan === 'premium' && (
              <span className="bg-yellow-400 text-sapphire-900 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Premium
              </span>
            )}
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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

          <a
            href="/settings"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className="p-3 bg-orange-100 rounded-lg">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sapphire-900">Pengaturan</h3>
              <p className="text-sm text-sapphire-600">Atur aplikasi</p>
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
  const { subscription } = useSubscription();
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [transaction, setTransaction] = useState(null);

  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // ============================================
  // FUNGSI SCANNER
  // ============================================
  const startScanner = async () => {
    try {
      setScannerError(null);
      setIsScanning(true);
      setShowManualInput(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera.');
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        if (permError.name === 'NotAllowedError') {
          throw new Error('Izin kamera ditolak. Silakan berikan izin kamera di pengaturan browser.');
        } else if (permError.name === 'NotFoundError') {
          throw new Error('Kamera tidak ditemukan.');
        } else {
          throw new Error('Gagal mengakses kamera: ' + permError.message);
        }
      }

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      await codeReader.decodeFromConstraints(constraints, videoRef.current, (result, err) => {
        if (result) {
          const barcode = result.getText();
          handleBarcodeScanned(barcode);
          stopScanner();
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error('Scanner error:', err);
        }
      });

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
      const { data: existingProduct, error: searchError } = await supabase
        .from('products')
        .select('*')
        .eq('sku', barcode)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (existingProduct) {
        addToCart(existingProduct);
        showNotification(`✅ ${existingProduct.name} ditambahkan ke keranjang`, 'success');
        setManualInput('');
        setShowManualInput(false);
      } else {
        // Check product limit for freemium
        if (subscription.plan === 'freemium') {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });
          
          if (count >= 50) {
            showNotification('⚠️ Batas produk freemium (50) tercapai. Upgrade ke Premium untuk produk tak terbatas.', 'warning');
            return;
          }
        }

        setCurrentProduct(null);
        setNewProduct({
          sku: barco
