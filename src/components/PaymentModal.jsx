import React, { useState } from 'react';

function PaymentModal({ total, onClose, onPaymentSuccess }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const paymentMethods = [
    {
      id: 'cash',
      name: '💵 Tunai',
      description: 'Pembayaran langsung dengan uang tunai',
    },
    {
      id: 'qris',
      name: '📱 QRIS',
      description: 'Scan kode QRIS dengan aplikasi e-wallet',
    },
    {
      id: 'transfer',
      name: '🏦 Transfer Bank',
      description: 'Transfer ke rekening perusahaan',
    },
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      alert('Pilih metode pembayaran terlebih dahulu!');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess(selectedMethod);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">💳 Pilih Metode Pembayaran</h2>
          <p className="text-blue-100 text-sm mt-1">Total yang harus dibayar</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(total)}</p>
        </div>

        <div className="p-6 space-y-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedMethod === method.id
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <p className="font-bold text-gray-800 text-lg mb-1">{method.name}</p>
              <p className="text-sm text-gray-600">{method.description}</p>
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={handlePayment}
            disabled={!selectedMethod || isProcessing}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-200 ${
              !selectedMethod || isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:scale-95 shadow-md'
            }`}
          >
            {isProcessing ? '⏳ Memproses...' : '✓ Konfirmasi Pembayaran'}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-full py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
