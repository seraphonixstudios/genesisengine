import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AIImageGenerator from './components/AIImageGenerator';
import './styles/ai-generator.css';

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  plan: string;
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.accessToken);
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-icon">{'\u2728'}</span>
          <h1>Genesis Engine</h1>
        </div>
        <p>Sign in to create amazing AI art</p>
        {error && <div className="error-banner"><span>{'\u26a0'}</span> {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="demo@example.com" required autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="demo123" required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Demo: <strong>demo@example.com / demo123</strong></p>
        </div>
      </div>
    </div>
  );
}

function Register({ onRegister }: { onRegister: (user: User) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('token', data.accessToken);
      onRegister(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-icon">{'\u2728'}</span>
          <h1>Genesis Engine</h1>
        </div>
        <p>Start generating amazing AI art</p>
        {error && <div className="error-banner"><span>{'\u26a0'}</span> {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required autoComplete="name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <a href="/genesis/login">Sign in</a></p>
        </div>
      </div>
    </div>
  );
}

function MobileNav({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="app-nav">
      <div className="nav-brand">
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span className={menuOpen ? 'bar open' : 'bar'}></span>
          <span className={menuOpen ? 'bar open' : 'bar'}></span>
          <span className={menuOpen ? 'bar open' : 'bar'}></span>
        </button>
        <span className="brand-text">{'\u2728'} Genesis Engine</span>
        <span className="nav-tagline">Seven Modes of Creation</span>
      </div>

      <div className={`nav-user ${menuOpen ? 'mobile-open' : ''}`}>
        <span className="daily-limit" title="Resets at midnight UTC">{'\u2728'} 20 Free/Day</span>
        <span className="credits">{user.credits} credits</span>
        <span className="user-name">{user.name}</span>
        <button onClick={onLogout} className="btn btn-sm btn-outline">Logout</button>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.id) { setUser(data); }
          else { localStorage.removeItem('token'); }
        })
        .catch(() => { localStorage.removeItem('token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData: User) => { setUser(userData); };
  const handleLogout = () => { localStorage.removeItem('token'); setUser(null); };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-large" />
        <p>Loading Genesis Engine...</p>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/genesis">
      <div className="app">
        {user ? (
          <>
            <MobileNav user={user} onLogout={handleLogout} />
            <main>
              <AIImageGenerator />
            </main>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onRegister={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;