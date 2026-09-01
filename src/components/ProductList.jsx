import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

const PRODUCTS = [
  {
    id: 1,
    name: 'Laptop Dell XPS 13',
    category: 'Elektronik',
    price: 12000000,
    stock: 5,
    image: '💻',
  },
  {
    id: 2,
    name: 'Mouse Logitech MX Master',
    category: 'Aksesoris',
    price: 750000,
    stock: 20,
    image: '🖱️',
  },
  {
    id: 3,
    name: 'Keyboard Mechanical RGB',
    category: 'Aksesoris',
    price: 1200000,
    stock: 15,
    image: '⌨️',
  },
  {
    id: 4,
    name: 'Monitor LG 27" 4K',
    category: 'Elektronik',
    price: 3500000,
    stock: 8,
    image: '🖥️',
  },
  {
    id: 5,
    name: 'Headphone Sony WH-1000XM5',
    category: 'Audio',
    price: 3800000,
    stock: 12,
    image: '🎧',
  },
  {
    id: 6,
    name: 'USB-C Hub 7-in-1',
    category: 'Aksesoris',
    price: 450000,
    stock: 30,
    image: '🔌',
  },
  {
    id: 7,
    name: 'SSD Samsung 1TB NVMe',
    category: 'Storage',
    price: 1500000,
    stock: 25,
    image: '💾',
  },
  {
    id: 8,
    name: 'RAM Kingston 16GB DDR4',
    category: 'Komponen',
    price: 800000,
    stock: 18,
    image: '🔧',
  },
  {
    id: 9,
    name: 'Webcam Logitech 1080p',
    category: 'Aksesoris',
    price: 600000,
    stock: 14,
    image: '📹',
  },
  {
    id: 10,
    name: 'Power Bank Anker 20000mAh',
    category: 'Audio',
    price: 350000,
    stock: 40,
    image: '🔋',
  },
];

const CATEGORIES = ['Semua Kategori', 'Elektronik', 'Aksesoris', 'Audio', 'Storage', 'Komponen'];

function ProductList({ onAddToCart }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Semua Kategori' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="card bg-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Katalog Produk</h2>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Cari nama produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">Produk tidak ditemukan</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
        <p>Total Produk: {filteredProducts.length} dari {PRODUCTS.length}</p>
      </div>
    </div>
  );
}

export default ProductList;
