import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { adminApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

interface Withdrawal {
  _id: string;
  user: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
}

export default function Withdrawals() {
  const toast = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadWithdrawals = useCallback(() => {
    setLoading(true);
    adminApi.withdrawals.list().then(res => {
      if (res.success && res.data) setWithdrawals(res.data as Withdrawal[]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadWithdrawals();
    connectSocket();
    socket.on('withdrawal:updated', loadWithdrawals);
    return () => {
      socket.off('withdrawal:updated', loadWithdrawals);
      disconnectSocket();
    };
  }, [loadWithdrawals]);

  const filtered = withdrawals.filter(w => {
    const matchSearch = w.user.toLowerCase().includes(search.toLowerCase()) ||
      w.accountName.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filter === 'all' || w.status === filter);
  });

  const pending  = withdrawals.filter(w => w.status === 'pending');
  const approved = withdrawals.filter(w => w.status === 'approved');
  const rejected = withdrawals.filter(w => w.status === 'rejected');

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this withdrawal? Make sure you have transferred the funds first.')) return;
    setActionLoading(id);
    const res = await adminApi.withdrawals.approve(id);
    if (res.success) {
      setWithdrawals(withdrawals.map(w => w._id === id ? { ...w, status: 'approved' } : w));
      toast.success('Withdrawal approved', 'Funds disbursement confirmed.');
    } else {
      toast.error('Failed to approve', res.message || 'Please try again.');
    }
    setActionLoading(null);
  };

  const openRejectModal = (w: Withdrawal) => { setSelected(w); setShowRejectModal(true); };

  const handleReject = async () => {
    if (!selected || !rejectNote.trim()) return;
    setActionLoading(selected._id);
    const res = await adminApi.withdrawals.reject(selected._id, rejectNote);
    if (res.success) {
      setWithdrawals(withdrawals.map(w => w._id === selected._id ? { ...w, status: 'rejected', reason: rejectNote } : w));
      toast.warning('Withdrawal rejected', rejectNote);
    } else {
      toast.error('Failed to reject', res.message || 'Please try again.');
    }
    setActionLoading(null);
    setShowRejectModal(false);
    setSelected(null);
    setRejectNote('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Withdrawal Requests</h1>
        <p className="text-gray-500 text-sm">Manage user withdrawal requests</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Pending', items: pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
          { label: 'Approved', items: approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Rejected', items: rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                <s.icon className={s.color} size={20} />
              </div>
              <span className="text-gray-500 text-sm">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '—' : `₦${s.items.reduce((sum, w) => sum + w.amount, 0).toLocaleString()}`}
            </p>
            <p className="text-sm text-gray-500">{loading ? '—' : `${s.items.length} requests`}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1.5">
            {['all', 'pending', 'approved', 'rejected'].map(f => (
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
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-56"
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
                  {['User ID', 'Amount', 'Bank Details', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No withdrawal requests found</td></tr>
                ) : filtered.map(w => (
                  <tr key={w._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-gray-600">{w.user.slice(-10)}</span>
                    </td>
                    <td className="px-5 py-4 text-lg font-bold text-gray-900">₦{w.amount.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium">{w.bankName || '—'}</div>
                      <div className="text-xs text-gray-500">{w.accountNumber}</div>
                      <div className="text-xs text-gray-400">{w.accountName}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm">{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                        w.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        w.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {w.status === 'pending' && <Clock size={11} />}
                        {w.status === 'approved' && <CheckCircle size={11} />}
                        {w.status === 'rejected' && <XCircle size={11} />}
                        {w.status}
                      </span>
                      {w.reason && <p className="text-xs text-gray-500 mt-1">{w.reason}</p>}
                    </td>
                    <td className="px-5 py-4">
                      {w.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleApprove(w._id)}
                            disabled={actionLoading === w._id}
                            className="text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 bg-green-500 hover:bg-green-600 disabled:opacity-50"
                          >
                            {actionLoading === w._id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={13} />}
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(w)}
                            disabled={actionLoading === w._id}
                            className="text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 bg-red-500 hover:bg-red-600 disabled:opacity-50"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRejectModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Reject Withdrawal</h3>
                <p className="text-sm text-gray-500">Amount: ₦{selected.amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Bank:</span><span>{selected.bankName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Account:</span><span>{selected.accountNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Name:</span><span>{selected.accountName}</span></div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for rejection *</label>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="e.g. Invalid account number, incorrect bank details..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowRejectModal(false); setSelected(null); setRejectNote(''); }}
                className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectNote.trim() || actionLoading === selected._id}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
