import React, { useState } from 'react';

export default function GoogleModal({ isOpen, onClose, onSelectAccount }) {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  if (!isOpen) return null;

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    onSelectAccount({
      email: customEmail.trim(),
      name: customName.trim() || customEmail.split('@')[0]
    });
    setCustomEmail('');
    setCustomName('');
    setIsCustomMode(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px', padding: '28px' }}>
        <div className="modal-header-center">
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ marginBottom: '8px' }}>
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"/>
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/>
          </svg>
          <h3 className="modal-title" style={{ fontSize: '18px', fontWeight: 600 }}>Sign in with Google</h3>
          <p className="modal-subtitle" style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
            to continue to <strong>demo</strong>
          </p>
        </div>

        {!isCustomMode ? (
          <>
            <div className="google-account-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '16px 0' }}>
              <div 
                className="google-account-card" 
                onClick={() => onSelectAccount({ email: 'demo@gmail.com', name: 'Security Lead' })}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#1f2937', borderRadius: '8px', cursor: 'pointer', border: '1px solid #374151' }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                  SL
                </div>
                <div>
                  <strong className="account-name" style={{ fontSize: '13px', color: '#f9fafb' }}>Security Lead</strong>
                  <p className="account-email" style={{ fontSize: '11px', color: '#9ca3af' }}>demo@gmail.com</p>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setIsCustomMode(true)}
              style={{ width: '100%', padding: '9px', marginBottom: '8px', fontSize: '12px', background: '#374151', color: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Use Another Google Account
            </button>
          </>
        ) : (
          <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px', color: '#9ca3af' }}>Google Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="user@gmail.com" 
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                required
                style={{ padding: '8px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px', color: '#9ca3af' }}>Full Name (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="John Doe" 
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{ padding: '8px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setIsCustomMode(false)}
                style={{ flex: 1, padding: '8px', background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Back
              </button>
              <button 
                type="submit" 
                className="btn-submit" 
                style={{ flex: 1, padding: '8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Continue
              </button>
            </div>
          </form>
        )}

        <button 
          type="button" 
          className="btn-secondary" 
          onClick={onClose}
          style={{ width: '100%', padding: '9px', fontSize: '12px', background: 'transparent', color: '#9ca3af', border: '1px solid #374151', borderRadius: '6px', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
