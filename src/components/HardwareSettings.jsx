

export default function HardwareSettings() {
  const [selectedPrinter, setSelectedPrinter] = useState('universal');
  const [selectedScanner, setSelectedScanner] = useState('universal');
  const [autoCashDrawer, setAutoCashDrawer] = useState(true);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200 my-4">
      <h3 className="text-lg font-bold mb-2 text-gray-800">Pengaturan Perangkat Kasir</h3>
      <p className="text-sm text-gray-600 mb-4">
        Pilih merek perangkat keras eksternal atau gunakan opsi universal sesuai kebutuhan outlet Anda.
      </p>

      {/* Printer Thermal */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Printer Thermal (Struk)</label>
        <select 
          value={selectedPrinter} 
          onChange={(e) => setSelectedPrinter(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="universal">Universal / Generic Bluetooth Printer</option>
          <option value="epson">Epson (ESC/POS Compatible)</option>
          <option value="codesoft">CodeSoft / Zjiang</option>
        </select>
      </div>

      {/* Barcode Scanner */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Pemindai Barcode / Kamera</label>
        <select 
          value={selectedScanner} 
          onChange={(e) => setSelectedScanner(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="universal">Kamera / USB Barcode Scanner Umum</option>
          <option value="honeywell">Honeywell / Zebra</option>
        </select>
      </div>

      {/* Cash Drawer */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Buka Otomatis Brangkas Uang (Cash Drawer)</span>
        <input 
          type="checkbox" 
          checked={autoCashDrawer} 
          onChange={(e) => setAutoCashDrawer(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
        />
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-100">
        Pengguna dapat membeli perangkat secara mandiri sesuai merek atau spesifikasi universal di atas.
      </div>
    </div>
  );
      }
