import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Users, DollarSign, Wallet, TrendingUp, ArrowUpRight, AlertCircle, Loader2 } from 'lucide-react';
import { adminApi } from '../services/api';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

interface DashboardData {
  totalUsers: number;
  activeSubscribers: number;
  monthlyRevenue: number;
  pendingWithdrawalTotal: number;
  subscriptionBreakdown: { active: number; trial: number; expired: number; cancelled: number };
  userGrowth: { month: string; users: number; revenue: number }[];
  commissionsByLevel: { level: string; amount: number }[];
  recentUsers: { name: string; email: string; date: string; status: string }[];
  recentPayments: { user: string; amount: number; date: string }[];
  pendingWithdrawals: { id: string; user: string; email: string; amount: number; bankName: string; accountNumber: string; accountName: string }[];
}

const PIE_COLORS = { active: '#1CB957', trial: '#F5820A', expired: '#EF4444', cancelled: '#94a3b8' };

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => {
    adminApi.dashboard.stats().then(res => {
      if (res.success && res.data) setData(res.data as DashboardData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
    connectSocket();

    socket.on('user:new', fetchStats);
    socket.on('payment:new', fetchStats);
    socket.on('withdrawal:updated', fetchStats);

    return () => {
      socket.off('user:new', fetchStats);
      socket.off('payment:new', fetchStats);
      socket.off('withdrawal:updated', fetchStats);
      disconnectSocket();
    };
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={36} style={{ color: '#F5820A' }} />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-500">Failed to load dashboard data.</div>;
  }

  const stats = [
    { label: 'Total Users', value: data.totalUsers.toLocaleString(), icon: Users, color: '#F5820A', bg: 'rgba(245,130,10,0.1)' },
    { label: 'Active Subscribers', value: data.activeSubscribers.toLocaleString(), icon: DollarSign, color: '#1CB957', bg: 'rgba(28,185,87,0.1)' },
    { label: 'Monthly Revenue', value: `₦${(data.monthlyRevenue / 1000).toFixed(0)}k`, icon: TrendingUp, color: '#0D2847', bg: 'rgba(13,40,71,0.1)' },
    { label: 'Pending Withdrawals', value: `₦${data.pendingWithdrawalTotal.toLocaleString()}`, icon: Wallet, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  ];

  const pieData = Object.entries(data.subscriptionBreakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: PIE_COLORS[name as keyof typeof PIE_COLORS],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Dashboard</h1>
        <p className="text-gray-500 text-sm">Live platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <ArrowUpRight size={14} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending withdrawals alert */}
      {data.pendingWithdrawals.length > 0 && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(245,130,10,0.08)', border: '1px solid rgba(245,130,10,0.25)' }}>
          <AlertCircle size={20} className="shrink-0" style={{ color: '#F5820A' }} />
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: '#c26200' }}>
              {data.pendingWithdrawals.length} withdrawal request{data.pendingWithdrawals.length > 1 ? 's' : ''} pending review
            </p>
            <p className="text-xs" style={{ color: '#d97706' }}>
              Total: ₦{data.pendingWithdrawalTotal.toLocaleString()} awaiting your approval
            </p>
          </div>
          <Link to="/withdrawals" className="px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0" style={{ background: '#F5820A' }}>
            Review Now
          </Link>
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="mb-5">
            <h2 className="font-bold text-gray-900 text-sm">Revenue Trend</h2>
            <p className="text-xs text-gray-500">Monthly revenue (last 7 months)</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.userGrowth} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5820A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F5820A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v: number) => `₦${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(val) => [`₦${Number(val).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#F5820A" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#F5820A', r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="mb-4">
            <h2 className="font-bold text-gray-900 text-sm">Subscriptions</h2>
            <p className="text-xs text-gray-500">Current status breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(val) => [Number(val).toLocaleString(), '']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="mb-4">
            <h2 className="font-bold text-gray-900 text-sm">New User Growth</h2>
            <p className="text-xs text-gray-500">Monthly new signups</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.userGrowth} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D2847" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#0D2847" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip formatter={(val) => [val, 'New Users']} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Area type="monotone" dataKey="users" stroke="#0D2847" strokeWidth={2.5} fill="url(#userGrad)" dot={{ fill: '#0D2847', r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="mb-4">
            <h2 className="font-bold text-gray-900 text-sm">Commission by Level</h2>
            <p className="text-xs text-gray-500">Total payouts per referral level</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.commissionsByLevel} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v: number) => `₦${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={46} />
              <Tooltip formatter={(val) => [`₦${Number(val).toLocaleString()}`, 'Commissions']} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {data.commissionsByLevel.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#F5820A' : i === 1 ? '#0D2847' : '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">Recent Signups</h2>
            <Link to="/users" className="text-xs font-medium hover:underline" style={{ color: '#F5820A' }}>View All</Link>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['User', 'Date', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentUsers.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-6 text-center text-gray-400 text-sm">No users yet</td></tr>
              ) : data.recentUsers.map((u, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#0D2847' }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{u.date}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      u.status === 'active' ? 'bg-green-100 text-green-700' :
                      u.status === 'trial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{u.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">Recent Payments</h2>
            <Link to="/commissions" className="text-xs font-medium hover:underline" style={{ color: '#F5820A' }}>View All</Link>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['User', 'Amount', 'Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentPayments.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-6 text-center text-gray-400 text-sm">No payments yet</td></tr>
              ) : data.recentPayments.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium">{p.user}</td>
                  <td className="px-5 py-3 text-sm font-bold" style={{ color: '#1CB957' }}>₦{p.amount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
