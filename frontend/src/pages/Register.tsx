import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Building, Mail, Lock, User, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', companyName: '', email: '', password: '', role: 'CUSTOMER' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Validation
  const isAlphaNumeric = /^[a-zA-Z0-9]*$/.test(formData.password);
  const isMaxLength = formData.password.length <= 8;
  const isPasswordValid = formData.password.length > 0 && isAlphaNumeric && isMaxLength;

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isPasswordValid) {
      setError('Password must be alphanumeric and maximum 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/register/initiate', formData);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/register/verify', { email: formData.email, otp });
      login(res.data.token, res.data.user);
      navigate('/customer');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ups-brown flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ups-gold rounded-full opacity-10 blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center text-ups-gold mb-6">
          <Shield size={64} strokeWidth={1.5} />
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight text-white uppercase">
          Create Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          Already have an account?{' '}
          <button onClick={() => navigate('/')} className="font-bold text-ups-gold hover:text-white transition-colors">
            Sign in here
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border-t-4 border-ups-gold">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleInitiate}>
              {/* Role Selection */}
              <div className="flex gap-4 mb-6">
                <label className={`flex-1 border p-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors ${formData.role === 'CUSTOMER' ? 'border-ups-gold bg-yellow-50 text-ups-brown font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  <input type="radio" name="role" value="CUSTOMER" checked={formData.role === 'CUSTOMER'} onChange={() => setFormData({...formData, role: 'CUSTOMER'})} className="hidden" />
                  Customer
                </label>
                <label className={`flex-1 border p-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors ${formData.role === 'FINANCE' ? 'border-ups-gold bg-yellow-50 text-ups-brown font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  <input type="radio" name="role" value="FINANCE" checked={formData.role === 'FINANCE'} onChange={() => setFormData({...formData, role: 'FINANCE'})} className="hidden" />
                  Finance Admin
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700">Full Name</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input required type="text" className="pl-10 block w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ups-gold"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              {formData.role === 'CUSTOMER' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700">Company Name</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Building size={18} />
                    </div>
                    <input required type="text" className="pl-10 block w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ups-gold"
                      value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700">Email Address</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input required type="email" className="pl-10 block w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ups-gold"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700">Password</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input required type="password" maxLength={8} className="pl-10 block w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ups-gold"
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                
                {/* Password Validation Indicators */}
                <div className="mt-3 flex gap-4 text-xs font-medium">
                  <div className={`flex items-center gap-1 ${formData.password.length > 0 && isAlphaNumeric ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle2 size={14} /> Alphanumeric
                  </div>
                  <div className={`flex items-center gap-1 ${formData.password.length > 0 && isMaxLength ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle2 size={14} /> Max 8 chars
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-ups-brown bg-ups-gold hover:bg-[#e5a300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ups-gold transition-colors disabled:opacity-70">
                {loading ? 'Sending OTP...' : 'Next Step'} <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerify}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <Mail size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Check your email</h3>
                <p className="text-sm text-gray-500 mt-1">We sent a 6-digit verification code to<br/><span className="font-bold text-gray-900">{formData.email}</span></p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 text-center mb-4">Enter 6-digit OTP</label>
                <div className="relative max-w-[200px] mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound size={18} />
                  </div>
                  <input required type="text" maxLength={6} placeholder="123456" className="pl-10 block w-full text-center bg-gray-50 border border-gray-200 rounded-lg py-3 text-2xl font-bold tracking-[0.5em] text-gray-900 focus:outline-none focus:ring-2 focus:ring-ups-gold"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-ups-brown bg-ups-gold hover:bg-[#e5a300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ups-gold transition-colors disabled:opacity-70">
                {loading ? 'Verifying...' : 'Complete Registration'}
              </button>
              
              <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors">
                Back to details
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
