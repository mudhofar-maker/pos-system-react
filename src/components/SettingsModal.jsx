import React, { useState, useEffect } from 'react';

const COLORS = {
  primary: '#0066CC',
  primaryDark: '#004BA0',
  accent: '#00D9FF',
  success: '#00AA44',
  error: '#DD0000',
  warning: '#FF9900',
  background: '#F0F4F8',
  surface: '#FFFFFF',
  border: '#CCDDEE',
  text: '#1A3A52',
  textSecondary: '#5A7A92'
};

export function SettingsModal({ isOpen, onClose, onSave }) {
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [plan, setPlan] = useState('free');
  const [errors, setErrors] = useState({});

  // Load dari localStorage
  useEffect(() => {
    const saved = localStorage.getItem('storeSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      setStoreName(settings.storeName || '');
      setOwnerName(settings.ownerName || '');
      setPlan(settings.plan || 'free');
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!storeName.trim()) newErrors.storeName = 'Nama toko/usaha wajib diisi';
    if (!ownerName.trim()) newErrors.ownerName = 'Nama pemilik wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const settings = {
      storeName,
      ownerName,
      plan,
      createdAt: new Date().toISOString(),
      activatedAt: new Date().toISOString()
    };

    localStorage.setItem('storeSettings', JSON.stringify(settings));
    onSave?.(settings);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000
    }}>
      <div style={{
        backgroundColor: COLORS.surface,
        borderRadius: '12px',
        padding: '32px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ margin: '0 0 24px 0', color: COLORS.text, fontSize: '24px' }}>
          ⚙️ Pengaturan Toko & Akun
        </h2>

        {/* Informasi Toko */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: COLORS.text
          }}>
            Nama Toko / Usaha
          </label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => {
              setStoreName(e.target.value);
              if (errors.storeName) setErrors({...errors, storeName: ''});
            }}
            placeholder="Contoh: Toko Elektronik Jaya"
            style={{
              width: '100%',
              padding: '12px',
              border: errors.storeName ? `2px solid ${COLORS.error}` : `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
              fontWeight: '500'
            }}
          />
          {errors.storeName && (
            <p style={{ color: COLORS.error, fontSize: '12px', margin: '4px 0 0 0' }}>
              {errors.storeName}
            </p>
          )}
        </div>

        {/* Nama Pemilik */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: COLORS.text
          }}>
            Nama Pemilik
          </label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => {
              setOwnerName(e.target.value);
              if (errors.ownerName) setErrors({...errors, ownerName: ''});
            }}
            placeholder="Contoh: Budi Santoso"
            style={{
              width: '100%',
              padding: '12px',
              border: errors.ownerName ? `2px solid ${COLORS.error}` : `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
              fontWeight: '500'
            }}
          />
          {errors.ownerName && (
            <p style={{ color: COLORS.error, fontSize: '12px', margin: '4px 0 0 0' }}>
              {errors.ownerName}
            </p>
          )}
        </div>

        {/* Pilih Paket */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: COLORS.text
          }}>
            Pilih Paket
          </label>

          {/* FREE PLAN */}
          <div 
            onClick={() => setPlan('free')}
            style={{
              border: plan === 'free' ? `3px solid ${COLORS.primary}` : `2px solid ${COLORS.border}`,
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px',
              cursor: 'pointer',
              backgroundColor: plan === 'free' ? '#E3F2FD' : COLORS.surface,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, color: COLORS.text }}>
                💰 FREEMIUM - Rp 250.000
              </h3>
              <input
                type="radio"
                name="plan"
                value="free"
                checked={plan === 'free'}
                onChange={() => setPlan('free')}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <p style={{ margin: '0 0 8px 0', color: COLORS.textSecondary, fontSize: '12px' }}>
              Fitur terbatas untuk mencoba
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', color: COLORS.text, fontSize: '12px' }}>
              <li>✓ Max 50 produk</li>
              <li>✓ Scan barcode dasar</li>
              <li>✓ Riwayat penjualan 30 hari</li>
              <li>✗ Laporan lanjutan</li>
              <li>✗ Multi user</li>
              <li>✗ Cloud backup</li>
            </ul>
          </div>

          {/* PRO PLAN */}
          <div 
            onClick={() => setPlan('pro')}
            style={{
              border: plan === 'pro' ? `3px solid ${COLORS.success}` : `2px solid ${COLORS.border}`,
              borderRadius: '8px',
              padding: '16px',
              cursor: 'pointer',
              backgroundColor: plan === 'pro' ? '#E8F8F5' : COLORS.surface,
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,170,68,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              position: 'absolute',
              top: '8px',
              right: '12px',
              backgroundColor: COLORS.success,
              color: COLORS.surface,
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              ⭐ RECOMMENDED
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, color: COLORS.text }}>
                🚀 PRO - Rp 500.000/bulan
              </h3>
              <input
                type="radio"
                name="plan"
                value="pro"
                checked={plan === 'pro'}
                onChange={() => setPlan('pro')}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <p style={{ margin: '0 0 8px 0', color: COLORS.textSecondary, fontSize: '12px' }}>
              Fitur lengkap untuk bisnis
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', color: COLORS.text, fontSize: '12px' }}>
              <li>✓ Unlimited produk</li>
              <li>✓ Scan barcode + QR advanced</li>
              <li>✓ Riwayat penjualan unlimited</li>
              <li>✓ Laporan penjualan lengkap</li>
              <li>✓ Multi user (5 user)</li>
              <li>✓ Cloud backup + sync</li>
              <li>✓ Export data PDF/Excel</li>
            </ul>
          </div>
        </div>

        {/* Info Harga */}
        <div style={{
          backgroundColor: '#FFF9E6',
          border: `2px solid ${COLORS.warning}`,
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px',
          fontSize: '12px',
          color: '#C77700'
        }}>
          <strong>💡 Catatan:</strong> Paket FREE berlaku seumur hidup. Paket PRO adalah subscription bulanan dengan akses penuh ke semua fitur.
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px',
              backgroundColor: COLORS.background,
              color: COLORS.text,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.background;
            }}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '12px',
              backgroundColor: COLORS.primary,
              color: COLORS.surface,
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.primaryDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.primary;
            }}
          >
            ✓ Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
