import React, { useState } from 'react';

export default function SignInForm({ onLoginSuccess, onOpenGoogleModal, API_BASE_URL }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState('');
  
  // Req 2 State
  const [lockoutSec, setLockoutSec] = useState(0);
  const [captchaChallenge, setCaptchaChallenge] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaErr, setCaptchaErr] = useState('');

  const checkLockout = async (val) => {
    if (!val) return;
    try {
      const res = await fetch(`${API_BASE_URL}/lockout-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: val })
      });
      const data = await res.json();
      if (data.locked) {
        setLockoutSec(data.remainingSeconds);
      } else if (data.captchaRequired && data.challenge) {
        setCaptchaChallenge(data.challenge);
      } else {
        setCaptchaChallenge(null);
      }
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorText('');
    setCaptchaErr('');

    if (!identifier) {
      setErrorText('Please enter your email.');
      return;
    }
    if (!password) {
      setErrorText('Please enter your password.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password,
          captchaAnswer,
          expectedCaptchaAnswer: captchaChallenge ? captchaChallenge.answer : null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorText(data.error || 'Invalid credentials');
        checkLockout(identifier);
        return;
      }

      onLoginSuccess(data.session);
    } catch (err) {
      setErrorText(err.message || 'Connection error to backend API');
    }
  };

  return (
    <form className="form-view" onSubmit={handleSubmit} noValidate>
      {lockoutSec > 0 && (
        <div className="lockout-banner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <div>
            <strong>Account Lockout Triggered</strong>
            <p>Multiple failed attempts detected. Retry in <span className="lockout-timer">{lockoutSec}s</span>.</p>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="loginIdentifier">Gmail</label>
        <div className="input-container">
          <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input 
            type="email" 
            id="loginIdentifier" 
            className="form-input" 
            placeholder="enter email" 
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onBlur={(e) => checkLockout(e.target.value)}
            required 
            disabled={lockoutSec > 0}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="loginPassword">
          <span>Password</span>
          <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>Forgot?</a>
        </label>
        <div className="input-container">
          <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <input 
            type={showPassword ? 'text' : 'password'} 
            id="loginPassword" 
            className="form-input" 
            placeholder="enter password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            disabled={lockoutSec > 0}
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
        {errorText && <span className="field-error-text">{errorText}</span>}
      </div>

      {captchaChallenge && (
        <div className="captcha-box">
          <div className="captcha-question">
            <span>Security Math Check</span>
            <span className="captcha-badge">{captchaChallenge.questionText}</span>
          </div>
          <input 
            type="text" 
            className="form-input captcha-input" 
            placeholder="Your answer..." 
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
          />
          {captchaErr && <span className="field-error-text">{captchaErr}</span>}
        </div>
      )}

      <button type="submit" className="btn-submit" disabled={lockoutSec > 0}>
        <span>Sign In</span>
      </button>

      <div className="divider">
        <span>OR SIGN IN WITH</span>
      </div>

      <button type="button" className="btn-google" onClick={onOpenGoogleModal}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
          <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"/>
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/>
        </svg>
        Google Identity
      </button>
    </form>
  );
}
