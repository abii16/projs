import React, { useState, useEffect } from 'react';
import SignInForm from './components/SignInForm.jsx';
import SignUpForm from './components/SignUpForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import GoogleModal from './components/GoogleModal.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [currentSession, setCurrentSession] = useState(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('current_session');
      if (saved) {
        setCurrentSession(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const handleLoginSuccess = (session) => {
    setCurrentSession(session);
    sessionStorage.setItem('current_session', JSON.stringify(session));
  };

  const handleGoogleSelect = async (googleProfile) => {
    setIsGoogleModalOpen(false);
    try {
      const res = await fetch(`${API_BASE_URL}/google-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleProfile)
      });
      const data = await res.json();
      handleLoginSuccess(data.session);
    } catch (err) {
      alert('Google Sign-In failed: ' + err.message);
    }
  };

  const handleSignOut = () => {
    setCurrentSession(null);
    sessionStorage.removeItem('current_session');
  };

  return (
    <div className={`app-wrapper ${currentSession ? 'dashboard-active' : ''}`}>
      <div className="auth-container">
        
        {/* App Title Header */}
        <div className="app-header">
          <h1 className="app-title">
            {currentSession ? 'Demo Security Dashboard' : (activeTab === 'signin' ? 'Demo Sign In' : 'Create Demo Account')}
          </h1>

        </div>

        {/* Dashboard View vs Auth View */}
        {currentSession ? (
          <Dashboard 
            session={currentSession} 
            onSignOut={handleSignOut} 
            API_BASE_URL={API_BASE_URL} 
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="auth-tabs">
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
                onClick={() => setActiveTab('signin')}
              >
                Sign In
              </button>
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => setActiveTab('signup')}
              >
                Create Account
              </button>
            </div>

            {/* Forms */}
            {activeTab === 'signin' ? (
              <SignInForm 
                onLoginSuccess={handleLoginSuccess} 
                onOpenGoogleModal={() => setIsGoogleModalOpen(true)} 
                API_BASE_URL={API_BASE_URL} 
              />
            ) : (
              <SignUpForm 
                onRegisterSuccess={handleLoginSuccess} 
                API_BASE_URL={API_BASE_URL} 
              />
            )}
          </>
        )}

      </div>

      {/* Google OAuth Modal */}
      <GoogleModal 
        isOpen={isGoogleModalOpen} 
        onClose={() => setIsGoogleModalOpen(false)} 
        onSelectAccount={handleGoogleSelect} 
      />
    </div>
  );
}
