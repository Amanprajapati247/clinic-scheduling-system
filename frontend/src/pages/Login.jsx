import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Stethoscope, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles,
  AlertCircle,
  Building2,
  CalendarCheck2
} from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Authentication failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Demo login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl grid lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800/10">
        
        {/* Left Side: Brand & Feature Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-white text-teal-800 flex items-center justify-center shadow-lg font-bold">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">CareSync<span className="text-teal-300">.clinic</span></h1>
                <p className="text-xs text-teal-200">Clinical Scheduling & Care Teams</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight leading-snug mt-6">
              Next-Generation Clinic Management System
            </h2>
            <p className="text-sm text-teal-100/90 mt-3 leading-relaxed">
              Enterprise appointment scheduling with finite state machine validation, multi-provider care teams, urgent alert routing, and immutable audit trails.
            </p>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-teal-600/50 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-teal-100">
              <CalendarCheck2 className="w-4 h-4 text-teal-300 shrink-0" />
              <span>Bulk Recurring Availability & Daily CSV Exporter</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-teal-100">
              <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0" />
              <span>Strict Role-Based Access Control (RBAC)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form & Demo Accounts */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900">Sign in to your account</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your medical staff credentials or choose a demo persona below.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Instant Quick-Fill Demo Personas */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Demo Accounts (1-Click)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('frontdesk@example.com', 'Password123')}
                disabled={loading}
                className="p-3 text-left rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/70 hover:border-teal-300 transition-all text-xs group"
              >
                <div className="flex items-center justify-between font-semibold text-teal-900">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    Front Desk Lead
                  </span>
                  <span className="text-[10px] text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded font-mono">
                    ADMIN
                  </span>
                </div>
                <div className="text-[11px] text-teal-700 mt-1">frontdesk@example.com</div>
                <div className="text-[10px] text-teal-600/80 mt-0.5 font-mono">Password: Password123</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('provider@example.com', 'Password123')}
                disabled={loading}
                className="p-3 text-left rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 hover:border-blue-300 transition-all text-xs group"
              >
                <div className="flex items-center justify-between font-semibold text-blue-900">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    Dr. Gregory House
                  </span>
                  <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-mono">
                    PROVIDER
                  </span>
                </div>
                <div className="text-[11px] text-blue-700 mt-1">provider@example.com</div>
                <div className="text-[10px] text-blue-600/80 mt-0.5 font-mono">Password: Password123</div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
