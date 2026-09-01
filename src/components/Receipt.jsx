import React from 'react';

function Receipt({ receipt, onClose }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const paymentMethodLabel = {
    cash: '💵 Tunai',
    qris: '📱 QRIS',
    transfer: '🏦 Transfer Bank',
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=500,width=500');
    printWindow.document.write(`
      <html>
        <head>
          <title>Struk - ${receipt.id}</title>
          <style>
            body {
              font-family: monospace;
              width: 80mm;
              margin: 0;
              padding: 10px;
              background: white;
            }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            h1 { font-size: 16px; margin: 5px 0; }
            p { margin: 3px 0; font-size: 12px; }
            .item-row { display: flex; justify-content: space-between; font-size: 12px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="center">
            <h1>🛒 POS SYSTEM</h1>
            <p>Point of Sale</p>
            <div class="divider"></div>
            <p><strong>No. Struk:</strong> ${receipt.id}</p>
            <p><strong>Tanggal:</strong> ${receipt.timestamp}</p>
            <div class="divider"></div>
          </div>
          
          <div>
            <p style="font-weight: bold; text-decoration: underline;">DETAIL PEMBELIAN:</p>
            ${receipt.items
              .map(
                (item) =>
                  `<div class="item-row">
              <span>${item.name} (${item.quantity}x)</span>
              <span>${formatCurrency(item.price * item.quantity)}</span>
            </div>`
              )
              .join('')}
          </div>
          
          <div class="divider"></div>
          
          <div style="font-size: 12px;">
            <div class="item-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(receipt.subtotal)}</span>
            </div>
            <div class="item-row">
              <span>PPN (10%):</span>
              <span>${formatCurrency(receipt.tax)}</span>
            </div>
            ${receipt.discount > 0 ? `<div class="item-row">
              <span>Diskon:</span>
              <span>-${formatCurrency(receipt.discount)}</span>
            </div>` : ''}
          </div>
          
          <div class="divider"></div>
          
          <div class="total-row">
            <span>TOTAL:</span>
            <span>${formatCurrency(receipt.total)}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="center">
            <p><strong>Metode Pembayaran:</strong></p>
            <p>${paymentMethodLabel[receipt.paymentMethod]}</p>
            <div class="divider"></div>
            <p style="margin-top: 20px; font-weight: bold;">Terima Kasih!</p>
            <p>Semoga berbelanja lagi</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-t-lg text-center">
          <p className="text-5xl mb-2">✅</p>
          <h2 className="text-2xl font-bold">Pembayaran Berhasil!</h2>
          <p className="text-green-100 text-sm mt-1">Transaksi telah diproses</p>
        </div>

        <div className="p-6 bg-gray-50 max-h-96 overflow-y-auto">
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
            <div className="text-center mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">No. Struk</p>
              <p className="text-lg font-bold text-gray-800">{receipt.id}</p>
              <p className="text-xs text-gray-500 mt-1">{receipt.timestamp}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-bold text-gray-700 mb-2">Daftar Produk:</p>
              <div className="space-y-2">
                {receipt.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(receipt.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PPN (10%):</span>
                <span className="font-semibold">{formatCurrency(receipt.tax)}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Diskon:</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(receipt.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-base">
                <span>Total:</span>
                <span className="text-green-600">{formatCurrency(receipt.total)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Metode Pembayaran:</p>
              <p className="font-semibold text-gray-800">{paymentMethodLabel[receipt.paymentMethod]}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={handlePrint}
            className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 active:scale-95"
          >
            🖨️ Cetak Struk
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default Receipt;
