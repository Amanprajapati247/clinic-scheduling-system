import React, { useEffect, useState } from 'react';
import { dashboardApi, alertApi } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  UserCheck,
  UserX,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Stethoscope,
  Clock,
  Sparkles,
  Download,
  CalendarPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const STATUS_COLORS = {
  Requested: '#f59e0b',
  Confirmed: '#3b82f6',
  CheckedIn: '#14b8a6',
  Completed: '#10b981',
  NoShow: '#8b5cf6',
  Cancelled: '#f43f5e',
};

export const Dashboard = () => {
  const { user, isFrontDesk, isProvider } = useAuth();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, alertRes] = await Promise.all([
          dashboardApi.getMetrics(),
          isFrontDesk ? alertApi.getActiveAlerts() : Promise.resolve({ data: { data: [] } }),
        ]);

        if (dashRes.data.success) {
          setData(dashRes.data.data);
        }
        if (alertRes.data.success) {
          setAlerts(alertRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isFrontDesk]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Aggregating Clinical Analytics...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    appointmentsToday: 0,
    checkedInToday: 0,
    noShowsThisWeek: 0,
    upcomingConfirmed: 0,
  };

  const appointmentsByProvider = data?.appointmentsByProvider || [];
  const appointmentsByStatus = data?.appointmentsByStatus || [];
  const weeklyNoShowRate = data?.weeklyNoShowRate || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clinical Operations Control Center</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/80 mt-1 max-w-2xl">
              {isFrontDesk
                ? 'Overview of active clinic operations, unconfirmed appointment alerts, and provider workloads.'
                : `Your personal schedule, supporting care team commitments, and patient visits.`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isFrontDesk && (
              <Link
                to="/slots"
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Manage Slots</span>
              </Link>
            )}
            <Link
              to="/appointments"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 backdrop-blur-xs"
            >
              <span>Appointments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Urgent Alerts Banner for Front Desk */}
      {isFrontDesk && alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 animate-pulse text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Action Required: {alerts.length} Unconfirmed Appointment{alerts.length > 1 ? 's' : ''} in Queue
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Appointments requested within 24 hours require front-desk confirmation or patient follow-up.
              </p>
            </div>
          </div>
          <Link
            to="/alerts"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Review Alerts Queue
          </Link>
        </div>
      )}

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Appointments Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Appointments Today
            </span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.appointmentsToday}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Scheduled for today's clinic hours</span>
          </div>
        </div>

        {/* Metric 2: Checked-In Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Checked-In Patients
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.checkedInToday}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Currently in waiting room or with provider
          </div>
        </div>

        {/* Metric 3: No Shows This Week */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              No Shows This Week
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.noShowsThisWeek}
          </div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">
            Tracked for clinical attrition analysis
          </div>
        </div>

        {/* Metric 4: Upcoming Confirmed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Upcoming Confirmed
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.upcomingConfirmed}
          </div>
          <div className="text-[11px] text-blue-700 font-medium mt-1">
            Confirmed forward bookings
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Appointments By Provider (8 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Appointments by Provider</h3>
                <p className="text-xs text-slate-500">Clinical workload and schedule distribution</p>
              </div>
              <Stethoscope className="w-4 h-4 text-slate-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={appointmentsByProvider}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="providerName"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => val.replace('Dr. ', '')}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="totalAppointments"
                    name="Total Appointments"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 2: Appointments By Status (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Status Distribution</h3>
                <p className="text-xs text-slate-500">Breakdown of appointments by workflow state</p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                  >
                    {appointmentsByStatus.map((entry) => (
                      <Cell
                        key={`cell-${entry.status}`}
                        fill={STATUS_COLORS[entry.status] || '#cbd5e1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
              {appointmentsByStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[item.status] || '#94a3b8' }}
                  />
                  <span className="text-slate-600 truncate">{item.status}:</span>
                  <strong className="text-slate-800 font-semibold">{item.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Chart 3: Weekly No Show Rate Trend (Last 8 Weeks) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Weekly No Show Rate (Last 8 Weeks)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical missed appointment percentage trend across the previous 8 weeks.
            </p>
          </div>

          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg font-medium self-start sm:self-auto">
            8-Week Moving Target &lt; 15%
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklyNoShowRate}
              margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="noShowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                unit="%"
                tick={{ fontSize: 11, fill: '#64748b' }}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(value, name) => [`${value}%`, 'No Show Rate']}
              />
              <Area
                type="monotone"
                dataKey="noShowRate"
                name="No Show Rate"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#noShowGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
