import React, { useState } from 'react';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import PaymentModal from './components/PaymentModal';
import Receipt from './components/Receipt';

function App() {
  const [cart, setCart] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [tax, setTax] = useState(10);
  const [discount, setDiscount] = useState(0);

  const handleAddToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        alert(`Stok ${product.name} tidak cukup!`);
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      const product = cart.find((item) => item.id === productId);
      if (product && quantity <= product.stock) {
        setCart(
          cart.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          )
        );
      } else {
        alert(`Stok ${product.name} hanya tersedia ${product.stock} unit!`);
      }
    }
  };

  const handlePaymentSuccess = (paymentMethod) => {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const taxAmount = (subtotal * tax) / 100;
    const discountAmount = discount;
    const total = subtotal + taxAmount - discountAmount;

    const receipt = {
      id: `RCP-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      items: cart,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      paymentMethod,
    };

    setLastReceipt(receipt);
    setShowReceipt(true);
    setIsPaymentModalOpen(false);

    setTimeout(() => {
      setCart([]);
      setDiscount(0);
      setShowReceipt(false);
    }, 3000);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxAmount = (subtotal * tax) / 100;
  const total = subtotal + taxAmount - discount;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <span className="text-4xl">🛒</span>
            POS System - Point of Sale
          </h1>
          <p className="text-blue-100 mt-2">Sistem Penjualan Terintegrasi Real-Time</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProductList onAddToCart={handleAddToCart} />
          </div>

          <div className="lg:col-span-1">
            <Cart
              items={cart}
              onRemove={handleRemoveFromCart}
              onUpdateQuantity={handleUpdateQuantity}
              subtotal={subtotal}
              tax={taxAmount}
              discount={discount}
              onDiscountChange={setDiscount}
              total={total}
              onCheckout={() => cart.length > 0 && setIsPaymentModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {isPaymentModalOpen && (
        <PaymentModal
          total={total}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {showReceipt && lastReceipt && (
        <Receipt receipt={lastReceipt} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
}

export default App;
