import React from 'react';
import CartItem from './CartItem';

function Cart({
  items,
  onRemove,
  onUpdateQuantity,
  subtotal,
  tax,
  discount,
  onDiscountChange,
  total,
  onCheckout,
}) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="card bg-white sticky top-8 h-fit">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🛒 Keranjang Belanja</h2>

      <div className="max-h-96 overflow-y-auto mb-4 border-b border-gray-200 pb-4">
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={onRemove}
                onUpdateQuantity={onUpdateQuantity}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Keranjang kosong</p>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diskon (IDR):
          </label>
          <input
            type="number"
            min="0"
            max={subtotal}
            value={discount}
            onChange={(e) => onDiscountChange(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">PPN (10%):</span>
          <span className="font-semibold text-gray-800">{formatCurrency(tax)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Diskon:</span>
            <span className="font-semibold text-red-600">-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="font-bold text-gray-800">Total:</span>
          <span className="text-lg font-bold text-blue-600">{formatCurrency(total)}</span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={items.length === 0}
        className={`w-full mt-4 py-3 rounded-lg font-bold text-white transition-all duration-200 ${
          items.length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 active:scale-95 shadow-md'
        }`}
      >
        💳 Proses Pembayaran
      </button>

      <div className="mt-3 text-center text-xs text-gray-500">
        {items.length > 0 && (
          <p>
            {items.length} item{items.length !== 1 ? 's' : ''} •{' '}
            {items.reduce((acc, item) => acc + item.quantity, 0)} unit
          </p>
        )}
      </div>
    </div>
  );
}

export default Cart;
