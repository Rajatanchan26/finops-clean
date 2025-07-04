import '../src/firebase';
import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const DEPARTMENTS = [
  'Finance',
  'HR',
  'Digital Transformation',
  'Planning',
  'Data&AI',
];

function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // 1. Create user in Firebase Auth
      const auth = getAuth();
      await createUserWithEmailAndPassword(auth, email, password);
      // 2. Register user in backend (always as 'user')
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'user', department }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Backend registration failed');
      }
      setSuccess('Registration successful! You can now log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <select value={department} onChange={e => setDepartment(e.target.value)} required>
          {DEPARTMENTS.map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
        <button type="submit">Sign Up</button>
        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
        {success && <p style={{ color: 'green', marginTop: '0.5rem' }}>{success}</p>}
      </form>
      <div style={{ width: '100%', borderTop: '1px solid #eee', margin: '1.5rem 0 1rem 0' }}></div>
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
}

export default SignUpPage; 