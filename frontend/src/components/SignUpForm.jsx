import React, { useState } from 'react';

export default function SignUpForm({ onRegisterSuccess, API_BASE_URL }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Req 1 Password Strength State
  const [strength, setStrength] = useState({
    score: 0,
    label: 'None',
    checks: { length: false, uppercase: false, lowercase: false, number: false },
    isValid: false
  });

  const handlePasswordChange = async (val) => {
    setPassword(val);
    if (!val) {
      setStrength({ score: 0, label: 'None', checks: { length: false, uppercase: false, lowercase: false, number: false }, isValid: false });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/validate-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: val })
      });
      const data = await res.json();
      setStrength(data);
    } catch {
      // Local fallback
      const checks = {
        length: val.length >= 8,
        uppercase: /[A-Z]/.test(val),
        lowercase: /[a-z]/.test(val),
        number: /[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)
      };
      const score = (checks.length ? 25 : 0) + (checks.uppercase ? 25 : 0) + (checks.lowercase ? 25 : 0) + (checks.number ? 25 : 0);
      const label = score >= 100 ? 'Strong' : (score >= 50 ? 'Fair' : 'Weak');
      const isValid = checks.length && checks.uppercase && checks.lowercase && checks.number;
      setStrength({ score, label, checks, isValid });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorText('');

    if (!fullName || !email || !username) {
      setErrorText('All fields are required.');
      return;
    }
    if (!strength.isValid) {
      setErrorText('Password does not satisfy complexity rules.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorText(data.error || 'Registration failed');
        return;
      }
      onRegisterSuccess(data.session);
    } catch (err) {
      setErrorText(err.message || 'Error connecting to server');
    }
  };

  const getStrengthColor = () => {
    if (strength.label === 'Strong') return '#10b981';
    if (strength.label === 'Fair') return '#f59e0b';
    if (strength.label === 'Weak') return '#ef4444';
    return '#6b7280';
  };

  return (
    <form className="form-view" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label className="form-label" htmlFor="regFullName">Full Name</label>
        <div className="input-container">
          <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <input 
            type="text" 
            id="regFullName" 
            className="form-input" 
            placeholder="Alex Morgan" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required 
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="regEmail">Gmail / Email</label>
        <div className="input-container">
          <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input 
            type="email" 
            id="regEmail" 
            className="form-input" 
            placeholder="alex@gmail.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="regUsername">Username</label>
        <div className="input-container">
          <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
          <input 
            type="text" 
            id="regUsername" 
            className="form-input" 
            placeholder="alex_dev" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
        </div>
      </div>

      {/* Password Strength Box (Req 1) */}
      <div className="form-group">
        <label className="form-label" htmlFor="regPassword">Create Strong Password</label>
        <div className="input-container">
          <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <input 
            type={showPassword ? 'text' : 'password'} 
            id="regPassword" 
            className="form-input" 
            placeholder="At least 8 chars with symbols..." 
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required 
          />
          <button 
            type="button" 
            className="btn-icon-toggle" 
            onClick={() => setShowPassword(!showPassword)}
          >
            <svg className="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>

        <div className="strength-meter-box">
          <div className="strength-header">
            <span>Password Strength:</span>
            <span style={{ color: getStrengthColor() }}>{strength.label}</span>
          </div>
          <div className="strength-bar-track">
            <div 
              className="strength-bar-fill" 
              style={{ width: `${strength.score}%`, backgroundColor: getStrengthColor() }}
            ></div>
          </div>
          <div className="strength-checklist">
            <div className={`check-item ${strength.checks.length ? 'valid' : ''}`}>
              <span className="check-icon">✓</span> 8+ Characters
            </div>
            <div className={`check-item ${strength.checks.uppercase ? 'valid' : ''}`}>
              <span className="check-icon">✓</span> Uppercase Letter
            </div>
            <div className={`check-item ${strength.checks.lowercase ? 'valid' : ''}`}>
              <span className="check-icon">✓</span> Lowercase Letter
            </div>
            <div className={`check-item ${strength.checks.number || strength.checks.special ? 'valid' : ''}`}>
              <span className="check-icon">✓</span> Number / Symbol
            </div>
          </div>
        </div>
        {errorText && <span className="field-error-text">{errorText}</span>}
      </div>

      <button type="submit" className="btn-submit" disabled={!strength.isValid}>
        <span>Create Account</span>
      </button>
    </form>
  );
}
