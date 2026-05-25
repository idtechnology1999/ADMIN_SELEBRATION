import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Users, DollarSign, ArrowUpRight, Loader2 } from 'lucide-react';
import { adminApi } from '../services/api';

interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    totalUsers: number;
    conversionRate: number;
    avgRevenuePerUser: number;
    activeUsers: number;
    trialUsers: number;
  };
  monthlyData: { month: string; revenue: number; users: number; conversions: number }[];
  commissionByLevel: { level: string; amount: number; count: number }[];
  topReferrers: { name: string; referrals: number; stage: number; revenue: number }[];
}

const fmt = (v: number) => {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}k`;
  return `₦${v}`;
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.analytics.get().then(res => {
      if (res.success && res.data) setData(res.data as AnalyticsData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={36} style={{ color: '#F5820A' }} />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-500">Failed to load analytics data.</div>;
  }

  const { kpis, monthlyData, commissionByLevel, topReferrers } = data;

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: fmt(kpis.totalRevenue),
      icon: DollarSign,
      color: '#F5820A',
      bg: 'rgba(245,130,10,0.1)',
    },
    {
      label: 'Total Users',
      value: kpis.totalUsers.toLocaleString(),
      icon: Users,
      color: '#0D2847',
      bg: 'rgba(13,40,71,0.1)',
    },
    {
      label: 'Conversion Rate',
      value: `${kpis.conversionRate}%`,
      icon: TrendingUp,
      color: '#1CB957',
      bg: 'rgba(28,185,87,0.1)',
    },
    {
      label: 'Avg. Revenue/User',
      value: fmt(kpis.avgRevenuePerUser),
      icon: DollarSign,
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.1)',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Analytics
        </h1>
        <p className="text-gray-500 text-sm">Platform performance overview — last 7 months</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: kpi.bg }}>
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
              <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
                <ArrowUpRight size={14} />live
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="mb-5">
          <h2 className="font-bold text-gray-900 text-sm">Revenue & User Growth</h2>
          <p className="text-xs text-gray-500">Monthly revenue compared to new users</p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tickFormatter={v => fmt(Number(v))} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              formatter={(val, name) => [name === 'revenue' ? `₦${Number(val).toLocaleString()}` : val, name === 'revenue' ? 'Revenue' : 'New Users']}
              contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#F5820A" strokeWidth={2.5} dot={{ fill: '#F5820A', r: 3 }} activeDot={{ r: 5 }} name="revenue" />
            <Line yAxisId="right" type="monotone" dataKey="users" stroke="#0D2847" strokeWidth={2.5} dot={{ fill: '#0D2847', r: 3 }} activeDot={{ r: 5 }} name="users" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="mb-4">
            <h2 className="font-bold text-gray-900 text-sm">Trial → Paid Conversions</h2>
            <p className="text-xs text-gray-500">Monthly trial-to-subscription conversions</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1CB957" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1CB957" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip formatter={(val) => [val, 'Conversions']} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Area type="monotone" dataKey="conversions" stroke="#1CB957" strokeWidth={2.5} fill="url(#convGrad)" dot={{ fill: '#1CB957', r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="mb-4">
            <h2 className="font-bold text-gray-900 text-sm">Commissions by Referral Level</h2>
            <p className="text-xs text-gray-500">Total payouts per level this period</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={commissionByLevel} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmt(Number(v))} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip formatter={(val) => [`₦${Number(val).toLocaleString()}`, 'Commissions']} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Bar dataKey="amount" fill="#F5820A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">Top Referrers</h2>
          <p className="text-xs text-gray-500 mt-0.5">Users generating the most revenue through referrals</p>
        </div>
        {topReferrers.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No referral data yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Rank', 'User', 'Stage', 'Total Referrals', 'Revenue Generated'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topReferrers.map((user, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold inline-flex"
                        style={{ background: i === 0 ? '#F5820A' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#e5e7eb', color: i >= 3 ? '#6b7280' : 'white' }}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: '#0D2847' }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">Stage {user.stage}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-sm">{user.referrals}</td>
                    <td className="px-5 py-4 font-bold text-sm" style={{ color: '#1CB957' }}>₦{user.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
