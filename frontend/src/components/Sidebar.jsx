import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  CalendarRange,
  BellRing,
  FileText,
  ShieldCheck,
  UserCheck,
  Building2,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isFrontDesk, isProvider } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['FRONT_DESK', 'PROVIDER'],
    },
    {
      to: '/appointments',
      label: 'Appointments',
      icon: CalendarDays,
      roles: ['FRONT_DESK', 'PROVIDER'],
    },
    {
      to: '/slots',
      label: 'Slot Management',
      icon: Clock,
      roles: ['FRONT_DESK', 'PROVIDER'],
    },
    {
      to: '/schedule',
      label: isProvider ? 'My Schedule & CSV' : 'Provider Schedules',
      icon: CalendarRange,
      roles: ['FRONT_DESK', 'PROVIDER'],
    },
    {
      to: '/alerts',
      label: 'Urgent Alerts',
      icon: BellRing,
      roles: ['FRONT_DESK'],
      badge: 'Unconfirmed',
    },
    {
      to: '/notes',
      label: 'Visit Notes',
      icon: FileText,
      roles: ['PROVIDER'],
    },
  ];

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div className="space-y-6">
            {/* User role banner */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2">
                {isFrontDesk ? (
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                ) : (
                  <UserCheck className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {isFrontDesk ? 'Front Desk Console' : 'Provider Clinical Portal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                {isFrontDesk
                  ? 'Manage clinic slots, confirm & reassign appointments, handle alerts.'
                  : `Dr. ${user?.name} — ${user?.provider?.department || 'Clinical Care'}`}
              </p>
            </div>

            {/* Nav list */}
            <nav className="space-y-1">
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Navigation
              </p>
              {filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-teal-50 text-teal-700 font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Footer Info */}
          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>St. Jude Medical Center</span>
            </div>
            <p className="text-[10px]">Secure Clinical Scheduling Platform</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
