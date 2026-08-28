import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Package, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('alice@abclogistics.com'); // Pre-filled for demo
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      if (data.user.role === 'FINANCE') {
        navigate('/finance');
      } else {
        navigate('/customer');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-ups-brown text-white font-sans">
      <div className="md:w-1/2 flex flex-col justify-center items-center p-12 relative overflow-hidden bg-gradient-to-br from-[#4d291f] to-ups-brown">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="z-10 text-center space-y-6">
          <div className="w-24 h-24 bg-ups-gold rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(255,181,0,0.5)]">
            <Package size={48} className="text-ups-brown" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight">Smart Billing</h1>
          <p className="text-xl text-gray-300 max-w-md">
            From reactive billing to predictive intelligence. Manage your logistics finances with ease.
          </p>
        </div>
      </div>
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-white text-gray-900 rounded-l-3xl shadow-[-20px_0_40px_rgba(0,0,0,0.3)] z-20">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-ups-brown">Welcome back</h2>
            <p className="text-gray-500 mt-2">Please enter your details to sign in.</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-ups-gold focus:border-ups-gold transition-colors duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-ups-gold focus:border-ups-gold transition-colors duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg flex items-center gap-2"><Lock size={16} /> {error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-ups-brown bg-ups-gold hover:bg-[#e5a300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ups-gold transition-all duration-200 transform hover:scale-[1.02]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="text-center mt-4">
              <p className="text-xs text-gray-400">Demo Accounts: alice@abclogistics.com / finance@ups.com (password123)</p>
            </div>
          </form>
          <div className="mt-6 border-t border-gray-100 pt-6">
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <button onClick={() => navigate('/register')} className="font-bold text-ups-brown hover:text-ups-gold transition-colors">
                Register here
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
