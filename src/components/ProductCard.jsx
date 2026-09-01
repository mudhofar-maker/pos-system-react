import React from 'react';

function ProductCard({ product, onAddToCart }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const isOutOfStock = product.stock === 0;

  return (
    <div className={`border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 ${
      isOutOfStock ? 'opacity-50 bg-gray-50' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-4xl">{product.image}</span>
        {product.stock < 5 && product.stock > 0 && (
          <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">
            Stok Terbatas
          </span>
        )}
        {isOutOfStock && (
          <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
            Habis
          </span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
      <p className="text-xs text-gray-500 mb-2">{product.category}</p>

      <div className="mb-3">
        <p className="text-lg font-bold text-blue-600 mb-1">{formatCurrency(product.price)}</p>
        <p className="text-sm text-gray-600">Stok: <span className="font-semibold">{product.stock}</span></p>
      </div>

      <button
        onClick={() => onAddToCart(product)}
        disabled={isOutOfStock}
        className={`w-full py-2 rounded-lg font-medium transition-all duration-200 ${
          isOutOfStock
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
        }`}
      >
        {isOutOfStock ? 'Stok Habis' : '➕ Tambah Keranjang'}
      </button>
    </div>
  );
}

export default ProductCard;
