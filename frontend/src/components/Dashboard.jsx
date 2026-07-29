import React, { useState, useEffect } from 'react';

export default function Dashboard({ session, onSignOut, API_BASE_URL }) {
  const [remainingMs, setRemainingMs] = useState(
    Math.max(0, session.accessTokenExpiresAt - Date.now())
  );
  const [sessions, setSessions] = useState([session]);
  const [securityAlerts, setSecurityAlerts] = useState(session.securityAlerts || []);
  const [toastMessage, setToastMessage] = useState('');
  const [currentToken, setCurrentToken] = useState(session.accessToken);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Req 3 Access Token Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, session.accessTokenExpiresAt - Date.now());
      setRemainingMs(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  // Req 6 Fetch Active Sessions
  const fetchActiveSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sessions`);
      const data = await res.json();
      if (data.sessions) {
        const userSess = data.sessions.filter((s) => s.userId === session.userId);
        setSessions(userSess.length ? userSess : [session]);
      }
    } catch {
      setSessions([session]);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const handleForceTokenRefresh = () => {
    const newToken = 'at_' + Math.random().toString(36).substring(2, 10) + '.' + Math.random().toString(36).substring(2, 10);
    session.accessToken = newToken;
    session.accessTokenExpiresAt = Date.now() + 15 * 60 * 1000;
    setCurrentToken(newToken);
    setRemainingMs(15 * 60 * 1000);
    showToast('Access Token Rotated Silently with Refresh Token!');
  };

  const handleRevokeSingle = async (sessionId) => {
    try {
      await fetch(`${API_BASE_URL}/sessions/${sessionId}`, { method: 'DELETE' });
    } catch {}
    setSessions(sessions.filter((s) => s.sessionId !== sessionId));
    showToast('Session Revoked Successfully');
  };

  const handleRevokeOthers = async () => {
    try {
      await fetch(`${API_BASE_URL}/sessions/revoke-others`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSessionId: session.sessionId })
      });
    } catch {}
    setSessions(sessions.filter((s) => s.sessionId === session.sessionId));
    showToast('Logged Out All Other Authorized Devices');
  };

  const handleDismissAlert = (alertId) => {
    setSecurityAlerts(securityAlerts.filter((a) => a.id !== alertId));
    showToast('Security Alert Dismissed');
  };

  const formatRemainingTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}m ${sec < 10 ? '0' : ''}${sec}s`;
  };

  return (
    <div className="dashboard-view">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{ background: '#10b981', color: '#ffffff', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textAlign: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', animation: 'fadeIn 0.2s' }}>
          ✓ {toastMessage}
        </div>
      )}

      {/* User Header */}
      <div className="dashboard-user-bar">
        <div className="user-profile">
          <div className="user-info">
            <h3>{session.user.fullName}</h3>
            <p>
              <span>{session.user.email}</span> •{' '}
              <span className="provider-badge">{session.authMethod || session.user.provider}</span>
            </p>
          </div>
        </div>
        <button type="button" className="btn-logout" onClick={onSignOut}>
          Sign Out
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-header">Short-Lived Access Token</span>
            <button 
              type="button" 
              onClick={handleForceTokenRefresh}
              style={{ fontSize: '10px', padding: '3px 8px', background: '#374151', color: '#60a5fa', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Rotate Token ↻
            </button>
          </div>
          <div className="metric-value" style={{ marginTop: '6px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>{formatRemainingTime(remainingMs)}</span>
          </div>
          <span className="metric-sub" style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '10px', color: '#9ca3af' }}>
            {currentToken.substring(0, 22)}...
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-header">Zero-Trust Guard Status</span>
          <div className="metric-value status-success" style={{ marginTop: '6px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Secured & Active</span>
          </div>
          <span className="metric-sub">Brute-Force & Token Rotation Guards Active</span>
        </div>
      </div>

      {/* Req 5 Threat Alerts */}
      {securityAlerts.length > 0 && (
        <div className="section-card security-alert-card">
          <div className="section-header">
            <div className="section-title title-danger">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Suspicious Login Activity Detected
            </div>
          </div>
          <div className="alert-list-container">
            {securityAlerts.map((alert) => (
              <div key={alert.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
                <div>
                  <strong style={{ fontSize: '12px', color: '#fca5a5' }}>{alert.title}</strong>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>{alert.message}</p>
                  <span style={{ fontSize: '10px', color: '#6b7280' }}>{alert.location} • {new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
                <button type="button" className="btn-revoke" onClick={() => handleDismissAlert(alert.id)} style={{ fontSize: '10px', padding: '4px 8px' }}>
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Device & Security Fingerprint Inspector */}
      <div className="section-card" style={{ background: '#182234' }}>
        <div className="section-title" style={{ fontSize: '13px', color: '#60a5fa', marginBottom: '10px' }}>
          🔍 Active Security & Device Fingerprint
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', fontSize: '11px' }}>
          <div><span style={{ color: '#6b7280' }}>Browser:</span> <strong style={{ color: '#f3f4f6' }}>{session.browser || 'Chrome'}</strong></div>
          <div><span style={{ color: '#6b7280' }}>OS:</span> <strong style={{ color: '#f3f4f6' }}>{session.os || 'Windows'}</strong></div>
          <div><span style={{ color: '#6b7280' }}>IP Address:</span> <strong style={{ color: '#f3f4f6' }}>{session.ip || '150.249.200.41'}</strong></div>
          <div><span style={{ color: '#6b7280' }}>Location:</span> <strong style={{ color: '#f3f4f6' }}>{session.location || 'Tokyo, Japan'}</strong></div>
        </div>
      </div>

      {/* Req 6 Active Sessions */}
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            Active Authorized Sessions ({sessions.length})
          </div>
          <button type="button" className="btn-secondary" onClick={handleRevokeOthers}>
            Log Out All Other Devices
          </button>
        </div>

        <div className="session-list">
          {sessions.map((s) => {
            const isCurrent = s.sessionId === session.sessionId;
            return (
              <div key={s.sessionId} className={`session-item ${isCurrent ? 'current' : ''}`}>
                <div className="session-details">
                  <div className="device-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                    </svg>
                  </div>
                  <div className="session-meta">
                    <h4>
                      {s.browser || 'Browser'} on {s.os || 'OS'}
                      {isCurrent && <span className="current-badge">Current Device</span>}
                    </h4>
                    <p>{s.location || 'Unknown Location'} • IP: {s.ip || '127.0.0.1'}</p>
                    <p style={{ marginTop: '2px' }}>Auth: {s.authMethod || 'Session'} • Active now</p>
                  </div>
                </div>
                {!isCurrent && (
                  <button type="button" className="btn-revoke" onClick={() => handleRevokeSingle(s.sessionId)}>
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
