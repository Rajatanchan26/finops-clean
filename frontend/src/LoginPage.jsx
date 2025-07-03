import '../src/firebase';
import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function LoginPage({ setUser, setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // 1. Firebase Auth
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      // 2. Call backend /login to get JWT and user info
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Backend login failed');
      }
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
      </form>
      <div style={{ width: '100%', borderTop: '1px solid #eee', margin: '1.5rem 0 1rem 0' }}></div>
      <p>Don't have an account? <a href="/signup">Sign up</a></p>
    </div>
  );
}

export default LoginPage; 