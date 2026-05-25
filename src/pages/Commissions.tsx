import { useState, useEffect } from 'react';
import { Search, Download, DollarSign, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { adminApi } from '../services/api';

interface Commission {
  _id: string;
  payer: string;
  beneficiary: string;
  level: number;
  amount: number;
  course?: string;
  status: 'pending' | 'withdrawable' | 'withdrawn';
  createdAt: string;
}

export default function Commissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi.commissions.list().then(res => {
      if (res.success && res.data) setCommissions(res.data as Commission[]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = commissions.filter(c => {
    const matchSearch =
      c.payer.toLowerCase().includes(search.toLowerCase()) ||
      c.beneficiary.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filter === 'all' || c.status === filter);
  });

  const total      = commissions.reduce((s, c) => s + c.amount, 0);
  const pending    = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
  const withdrawable = commissions.filter(c => c.status === 'withdrawable').reduce((s, c) => s + c.amount, 0);
  const withdrawn  = commissions.filter(c => c.status === 'withdrawn').reduce((s, c) => s + c.amount, 0);

  const exportCsv = () => {
    const rows = [
      ['Date', 'Payer', 'Beneficiary', 'Level', 'Amount', 'Status'],
      ...commissions.map(c => [
        new Date(c.createdAt).toLocaleDateString(),
        c.payer, c.beneficiary,
        `Level ${c.level}`,
        c.amount,
        c.status,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'commissions.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Commissions</h1>
          <p className="text-gray-500 text-sm">Track all commission transactions</p>
        </div>
        <button onClick={exportCsv} className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: 'Total Commissions', value: total, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Pending', value: pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
          { label: 'Withdrawable', value: withdrawable, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Paid Out', value: withdrawn, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={stat.color} size={20} />
              </div>
              <span className="text-gray-500 text-sm">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : `₦${stat.value.toLocaleString()}`}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1.5">
            {['all', 'pending', 'withdrawable', 'withdrawn'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === f ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={filter === f ? { background: '#F5820A' } : {}}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by user ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-52"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin" size={28} style={{ color: '#F5820A' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Payer ID', 'Beneficiary ID', 'Level', 'Amount', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No commissions found</td></tr>
                ) : filtered.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-gray-500 text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-600">{c.payer.slice(-8)}</td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-600">{c.beneficiary.slice(-8)}</td>
                    <td className="px-5 py-4">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Level {c.level}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-sm" style={{ color: '#1CB957' }}>₦{c.amount.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                        c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        c.status === 'withdrawable' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {c.status === 'pending' && <Clock size={11} />}
                        {c.status !== 'pending' && <CheckCircle size={11} />}
                        {c.status}
                      </span>
                    </td>
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
