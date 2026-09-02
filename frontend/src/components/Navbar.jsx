import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { alertApi } from '../api';
import { 
  Bell, 
  User, 
  LogOut, 
  Stethoscope, 
  Shield, 
  Sparkles,
  AlertCircle,
  Menu
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = ({ toggleSidebar }) => {
  const { user, logout, login, isFrontDesk, isProvider } = useAuth();
  const [alertCount, setAlertCount] = useState(0);
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (isFrontDesk) {
      const fetchAlerts = async () => {
        try {
          const res = await alertApi.getActiveAlerts();
          if (res.data.success) {
            setAlertCount(res.data.data.length);
          }
        } catch (err) {
          // silently handle polling error
        }
      };

      fetchAlerts();
      interval = setInterval(fetchAlerts, 20000); // poll every 20s
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFrontDesk]);

  const handleQuickSwitch = async () => {
    setSwitching(true);
    try {
      if (isFrontDesk) {
        // Switch to Provider
        await login('provider@example.com', 'Password123');
      } else {
        // Switch to Front Desk
        await login('frontdesk@example.com', 'Password123');
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Quick switch failed:', err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-500/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              CareSync<span className="text-teal-600">.clinic</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              Enterprise v2.0
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Front Desk Urgent Alerts Icon */}
        {isFrontDesk && (
          <Link
            to="/alerts"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
          >
            <Bell className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Alerts</span>
            {alertCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-xs animate-pulse">
                {alertCount}
              </span>
            )}
          </Link>
        )}

        {/* Demo Quick Role Switcher Button */}
        <button
          onClick={handleQuickSwitch}
          disabled={switching}
          title="Instantly switch demo role"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Switch to {isFrontDesk ? 'Provider (Dr. House)' : 'Front Desk'}</span>
        </button>

        {/* User Card */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-700">
            {isFrontDesk ? (
              <Shield className="w-4 h-4 text-teal-600" />
            ) : (
              <Stethoscope className="w-4 h-4 text-blue-600" />
            )}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.name}
            </div>
            <div className="text-[10px] font-medium text-slate-400">
              {isFrontDesk ? 'Front Desk Staff' : user?.provider?.specialty || 'Clinical Provider'}
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
