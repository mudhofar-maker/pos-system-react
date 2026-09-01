import React from 'react';

function CartItem({ item, onRemove, onUpdateQuantity }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const itemTotal = item.price * item.quantity;

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-2xl flex-shrink-0">{item.image}</span>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
        <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
        >
          −
        </button>
        <input
          type="number"
          min="1"
          max={item.stock}
          value={item.quantity}
          onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
          className="w-10 text-center text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
        >
          +
        </button>
      </div>
      <div className="text-right flex-shrink-0 min-w-max">
        <p className="text-sm font-bold text-blue-600">{formatCurrency(itemTotal)}</p>
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs text-red-600 hover:text-red-800 font-semibold mt-1"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}

export default CartItem;
